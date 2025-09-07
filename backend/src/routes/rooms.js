const express = require('express');
const { Room } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all public rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ type: 'public', isActive: true })
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get rooms for a specific user (including DMs)
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get public rooms and private rooms where user is a participant
    const rooms = await Room.find({
      $or: [
        { type: 'public', isActive: true },
        { type: 'private', participants: username, isActive: true },
        { type: 'group', participants: username, isActive: true }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, type, participants, createdBy, description } = req.body;
    
    // Validate required fields
    if (!name || !type || !createdBy) {
      return res.status(400).json({ 
        error: 'Name, type, and createdBy are required' 
      });
    }
    
    const roomId = type === 'private' && participants && participants.length === 2
      ? `dm-${participants.sort().join('-')}`  // Consistent DM room IDs
      : uuidv4();
    
    // Check if DM room already exists
    if (type === 'private') {
      const existingRoom = await Room.findOne({ id: roomId });
      if (existingRoom) {
        return res.json(existingRoom);
      }
    }
    
    const room = new Room({
      id: roomId,
      name,
      type,
      participants: participants || [],
      createdBy,
      description: description || ''
    });
    
    await room.save();
    console.log('Room created via API:', room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a DM (Direct Message) room
router.post('/dm', async (req, res) => {
  try {
    const { participants } = req.body;
    
    // Validate participants
    if (!participants || !Array.isArray(participants) || participants.length !== 2) {
      return res.status(400).json({ 
        error: 'Exactly 2 participants are required for a DM' 
      });
    }
    
    const sortedParticipants = participants.sort();
    const dmId = `dm-${sortedParticipants.join('-')}`;
    
    // Check if DM room already exists
    const existingRoom = await Room.findOne({ id: dmId });
    if (existingRoom) {
      return res.json(existingRoom);
    }
    
    // Create new DM room
    const room = new Room({
      id: dmId,
      name: sortedParticipants[1], // Name is the other participant
      type: 'private',
      participants: sortedParticipants,
      createdBy: sortedParticipants[0] // First participant as creator
    });
    
    await room.save();
    console.log('DM created via API:', room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating DM:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update room
router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;
    
    const room = await Room.findOneAndUpdate(
      { id: roomId },
      updates,
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete room
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findOneAndUpdate(
      { id: roomId },
      { isActive: false },
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
