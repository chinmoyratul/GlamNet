const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  },
  messageSentMethod: {
    type: String,
    enum: ['customer', 'salon', 'system'],
    default: 'customer'
  },
  messageText: {
    type: String,
    required: [true, 'Please add message text']
  },
  sentimentLabel: {
    type: String,
    enum: ['positive', 'negative', 'neutral']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);


