const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://lwhbxt59-3000.inc1.devtunnels.ms"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/katlio');

// User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  isOnline: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Message model
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  sender: { type: String, required: true },
  roomId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  fileUrl: { type: String, default: '' },
  readBy: [{ user: String, timestamp: Date }]
});

const Message = mongoose.model('Message', messageSchema);

// Room model
const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['public', 'private', 'group'], required: true },
  participants: [String],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins
  socket.on('user-join', async (userData) => {
    try {
      const { username, avatar } = userData;
      
      // Update or create user
      await User.findOneAndUpdate(
        { username },
        { avatar, isOnline: true, lastSeen: new Date() },
        { upsert: true, new: true }
      );

      connectedUsers.set(socket.id, { username, avatar });
      socket.broadcast.emit('user-online', { username, avatar });
      
      // Send current online users
      const onlineUsers = Array.from(connectedUsers.values());
      socket.emit('online-users', onlineUsers);
    } catch (error) {
      console.error('Error in user-join:', error);
    }
  });

  // Join room
  socket.on('join-room', async (roomId) => {
    console.log('User joining room:', roomId);
    socket.join(roomId);
    
    // Send recent messages
    try {
      const messages = await Message.find({ roomId })
        .sort({ timestamp: -1 })
        .limit(50)
        .exec();
      
      console.log(`Found ${messages.length} messages for room ${roomId}`);
      const reversedMessages = messages.reverse();
      console.log('Emitting room-messages event with', reversedMessages.length, 'messages');
      socket.emit('room-messages', reversedMessages);
      console.log('room-messages event emitted successfully');
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  // Send message
  socket.on('send-message', async (messageData) => {
    try {
      console.log('Received message:', messageData);
      const messageId = uuidv4();
      const message = new Message({
        id: messageId,
        content: messageData.content,
        sender: messageData.sender,
        roomId: messageData.roomId,
        type: messageData.type || 'text',
        fileUrl: messageData.fileUrl || ''
      });

      await message.save();
      console.log('Message saved:', message);
      
      // Send to all users in the room including sender
      io.to(messageData.roomId).emit('new-message', message);
      console.log('Message broadcasted to room:', messageData.roomId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      username: data.username,
      roomId: data.roomId
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.roomId).emit('user-stopped-typing', {
      username: data.username,
      roomId: data.roomId
    });
  });

  // Mark message as read
  socket.on('mark-read', async (data) => {
    try {
      const { messageId, username } = data;
      await Message.findOneAndUpdate(
        { id: messageId },
        { $addToSet: { readBy: { user: username, timestamp: new Date() } } }
      );
      
      socket.to(data.roomId).emit('message-read', { messageId, username });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // User disconnects
  socket.on('disconnect', async () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      try {
        await User.findOneAndUpdate(
          { username: userData.username },
          { isOnline: false, lastSeen: new Date() }
        );
        
        connectedUsers.delete(socket.id);
        socket.broadcast.emit('user-offline', userData.username);
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// REST API Routes

// Get all public rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ type: 'public' });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, type, participants, createdBy } = req.body;
    const roomId = uuidv4();
    
    const room = new Room({
      id: roomId,
      name,
      type,
      participants: participants || [],
      createdBy
    });
    
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl, filename: req.file.originalname });
});

// Get user by username
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Katlio backend server running on port ${PORT}`);
});
