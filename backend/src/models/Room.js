const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  type: { 
    type: String, 
    enum: ['public', 'private', 'group'], 
    required: true 
  },
  participants: {
    type: [String],
    default: []
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
roomSchema.index({ type: 1 });
roomSchema.index({ participants: 1 });
roomSchema.index({ createdBy: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
