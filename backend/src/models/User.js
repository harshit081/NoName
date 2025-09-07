const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  originalUsername: {
    type: String,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGuest; // Password not required for guests
    }
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  guestExpiry: {
    type: Date,
    required: function() {
      return this.isGuest; // Expiry required for guests
    }
  },
  isOnline: { 
    type: Boolean, 
    default: true 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for better query performance (username and email already have unique indexes)
userSchema.index({ isOnline: 1 });
userSchema.index({ isGuest: 1 });
userSchema.index({ guestExpiry: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
