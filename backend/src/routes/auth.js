const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = new User({
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      avatar: avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
      isGuest: false,
      isOnline: true
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, isGuest: false },
      process.env.JWT_SECRET || 'katlio-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isGuest: false
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!user || user.isGuest) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update user online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, isGuest: false },
      process.env.JWT_SECRET || 'katlio-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isGuest: false
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create guest user
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required for guest access' 
      });
    }
    
    // Check if username is already taken (including guests)
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists. Please choose a different name.' 
      });
    }
    
    // Create guest user
    const guestUser = new User({
      id: uuidv4(),
      username,
      email: `guest-${uuidv4()}@katlio.local`, // Temporary email for guests
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
      isGuest: true,
      isOnline: true
    });
    
    await guestUser.save();
    
    // Generate JWT token for guest
    const token = jwt.sign(
      { userId: guestUser.id, username: guestUser.username, isGuest: true },
      process.env.JWT_SECRET || 'katlio-secret-key',
      { expiresIn: '24h' } // Shorter expiry for guests
    );
    
    res.status(201).json({
      message: 'Guest user created successfully',
      user: {
        id: guestUser.id,
        username: guestUser.username,
        avatar: guestUser.avatar,
        isGuest: true
      },
      token
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'katlio-secret-key');
    const user = await User.findOne({ id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.isGuest ? undefined : user.email,
        avatar: user.avatar,
        isGuest: user.isGuest
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'katlio-secret-key');
      const user = await User.findOne({ id: decoded.userId });
      
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.json({ message: 'Logout successful' }); // Still return success even if token is invalid
  }
});

module.exports = router;
