const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber'
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: [true, 'Please add review text']
  },
  sentimentLabel: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  isVerified: {
    type: Boolean,
    default: true // Only customers who completed appointments can review
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
ReviewSchema.index({ salonId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);


