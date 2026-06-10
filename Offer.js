const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  offerName: {
    type: String,
    required: [true, 'Please add an offer name'],
    trim: true
  },
  description: {
    type: String
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Please add discount percentage'],
    min: 0,
    max: 100
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  startDate: {
    type: Date,
    required: [true, 'Please add start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add end date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Offer', OfferSchema);


