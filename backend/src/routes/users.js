const express = require('express');
const { User } = require('../models');

const router = express.Router();

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all online users
router.get('/online/all', async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('username avatar lastSeen')
      .sort({ lastSeen: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const updates = req.body;
    
    const user = await User.findOneAndUpdate(
      { username },
      updates,
      { new: true, upsert: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username avatar isOnline lastSeen')
    .limit(20);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
