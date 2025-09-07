const { User } = require('../models');

// Clean up expired guest users
const cleanupExpiredGuests = async () => {
  try {
    const now = new Date();
    const result = await User.deleteMany({
      isGuest: true,
      guestExpiry: { $lt: now }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired guest users`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired guests:', error);
  }
};

// Schedule cleanup every hour
const startGuestCleanup = () => {
  // Run immediately on startup
  cleanupExpiredGuests();
  
  // Then run every hour
  setInterval(cleanupExpiredGuests, 60 * 60 * 1000); // 1 hour
  console.log('✅ Guest cleanup scheduler started');
};

module.exports = { cleanupExpiredGuests, startGuestCleanup };
