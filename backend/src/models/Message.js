const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  sender: { 
    type: String, 
    required: true 
  },
  roomId: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  },
  fileUrl: { 
    type: String, 
    default: '' 
  },
  readBy: [{
    user: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
