const mongoose = require('mongoose');

const ScheduleSlotSchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: [true, 'Please add start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please add end time']
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
ScheduleSlotSchema.index({ barberId: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('ScheduleSlot', ScheduleSlotSchema);


