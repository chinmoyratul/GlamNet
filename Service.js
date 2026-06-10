const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a service name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Haircut', 'Hair Color', 'Hair Styling', 'Beard Trim', 'Facial', 'Massage', 'Other']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes'],
    min: 15
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

module.exports = mongoose.model('Service', ServiceSchema);


