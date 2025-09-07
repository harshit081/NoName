const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  avatar: { 
    type: String, 
    default: '' 
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

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
