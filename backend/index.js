require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import configurations and modules
const connectDatabase = require('./src/config/database');
const { handleSocketConnection } = require('./src/socket/socketHandlers');
const { startGuestCleanup } = require('./src/utils/guestCleanup');
const apiRoutes = require('./src/routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    methods: ["GET", "POST"]
  }
});
// console.log(process.env.FRONTEND_URL,"here")
// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000", 
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Katlio Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      rooms: '/api/rooms',
      users: '/api/users',
      upload: '/api/upload'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Initialize Socket.io handlers
handleSocketConnection(io);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start guest cleanup scheduler
    startGuestCleanup();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Katlio backend server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  // Only start server if this file is run directly (not required as module)
  startServer();
}

// Export the app as default for deployment platforms
module.exports = app;
