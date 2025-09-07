const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/katlio'
    );

    console.log(`MongoDB connected: ${connection.connection.host}`)
    // Create default rooms if none exist
    await createDefaultRooms();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createDefaultRooms = async () => {
  try {
    // Import Room model here to avoid circular dependency
    const { Room } = require('../models');
    
    // Check if any public rooms exist
    const existingRooms = await Room.find({ type: 'public' });
    
    if (existingRooms.length === 0) {
      const defaultRooms = [
        {
          id: 'general',
          name: 'General',
          type: 'public',
          participants: [],
          createdBy: 'system',
          description: 'General discussion room'
        },
        {
          id: 'random',
          name: 'Random',
          type: 'public',
          participants: [],
          createdBy: 'system',
          description: 'Random conversations'
        },
        {
          id: 'tech',
          name: 'Tech Talk',
          type: 'public',
          participants: [],
          createdBy: 'system',
          description: 'Technology discussions'
        }
      ];

      await Room.insertMany(defaultRooms);
      console.log('✅ Created default rooms:', defaultRooms.map(r => r.name).join(', '));
    } else {
      console.log('✅ Default rooms already exist, skipping creation');
    }
  } catch (error) {
    console.error('❌ Error creating default rooms:', error);
  }
};

module.exports = connectDatabase;
