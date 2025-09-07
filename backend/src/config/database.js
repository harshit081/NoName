const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/katlio'
    );

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;
