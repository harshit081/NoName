const mongoose = require('mongoose');
const dns = require('dns');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    console.log('=> Using existing database connection');
    return mongoose.connection;
  }

  const customDnsServers = process.env.MONGODB_DNS_SERVERS
    ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
    : [];

  if (customDnsServers.length > 0) {
    dns.setServers(customDnsServers);
    console.log(`=> Using custom DNS servers for MongoDB: ${customDnsServers.join(', ')}`);
  }

  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/katlio', {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
      }
    );

    isConnected = connection.connection.readyState === 1;
    console.log(`MongoDB connected: ${connection.connection.host}`);
    // Create default rooms if none exist
    await createDefaultRooms();

    return connection.connection;
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
