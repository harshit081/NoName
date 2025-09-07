const express = require('express');
const roomRoutes = require('./rooms');
const userRoutes = require('./users');
const uploadRoutes = require('./upload');

const router = express.Router();

// API Routes
router.use('/rooms', roomRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Katlio Backend API'
  });
});

module.exports = router;
