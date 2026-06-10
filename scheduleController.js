const ScheduleSlot = require('../models/ScheduleSlot');
const Barber = require('../models/Barber');
const Salon = require('../models/Salon');

// @desc    Get schedule slots
// @route   GET /api/schedules
// @access  Private
exports.getScheduleSlots = async (req, res, next) => {
  try {
    const { barberId, salonId, date, isBooked } = req.query;
    let query = {};

    if (barberId) {
      query.barberId = barberId;
    }

    if (salonId) {
      query.salonId = salonId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (isBooked !== undefined) {
      query.isBooked = isBooked === 'true';
    }

    const slots = await ScheduleSlot.find(query)
      .populate('barberId', 'userId specialty')
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('salonId', 'name address')
      .populate('appointmentId')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available slots
// @route   GET /api/schedules/available
// @access  Public
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { barberId, salonId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide barberId and date'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let targetBarberId = barberId;
    if (barberId === 'default') {
      const firstBarber = await Barber.findOne({ salonId });
      if (!firstBarber) {
        return res.status(404).json({
          success: false,
          message: 'No barbers found for this salon to show available slots'
        });
      }
      targetBarberId = firstBarber._id;
    }

    let slots = await ScheduleSlot.find({
      barberId: targetBarberId,
      salonId: salonId || undefined,
      date: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false
    })
      .populate('barberId', 'userId specialty')
      .sort({ startTime: 1 });

    // If no slots exist in DB, generate "virtual" slots based on salon hours
    if (slots.length === 0) {
      const salon = await Salon.findById(salonId);
      if (salon && salon.openingTime && salon.closingTime) {
        const generatedSlots = [];
        let [openHour, openMin] = salon.openingTime.split(':').map(Number);
        const [closeHour, closeMin] = salon.closingTime.split(':').map(Number);

        let currentHour = openHour;
        let currentMin = openMin;

        while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
          const nextMin = (currentMin + 30) % 60;
          const nextHour = currentHour + Math.floor((currentMin + 30) / 60);

          if (nextHour > closeHour || (nextHour === closeHour && nextMin > closeMin)) break;

          const startTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;

          generatedSlots.push({
            _id: `virtual-${startTimeStr}`, // Prefixed ID to identify as virtual
            barberId: targetBarberId,
            salonId,
            date: startOfDay,
            startTime: startTimeStr,
            endTime: endTimeStr,
            isBooked: false,
            isVirtual: true
          });

          currentHour = nextHour;
          currentMin = nextMin;
        }
        slots = generatedSlots;
      }
    }

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add schedule slot
// @route   POST /api/schedules
// @access  Private
exports.addSchedule = async (req, res, next) => {
  try {
    const { barberId, salonId, date, startTime, endTime } = req.body;

    // Verify barber belongs to salon
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    if (barber.salonId.toString() !== salonId) {
      return res.status(400).json({
        success: false,
        message: 'Barber does not belong to this salon'
      });
    }

    // Get day of week
    const dateObj = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dateObj.getDay()];

    const slot = await ScheduleSlot.create({
      barberId,
      salonId,
      date: dateObj,
      dayOfWeek,
      startTime,
      endTime,
      isBooked: false
    });

    const populatedSlot = await ScheduleSlot.findById(slot._id)
      .populate('barberId', 'userId specialty')
      .populate('salonId', 'name');

    res.status(201).json({
      success: true,
      data: populatedSlot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update schedule slot
// @route   PUT /api/schedules/:id
// @access  Private
exports.updateSchedule = async (req, res, next) => {
  try {
    let slot = await ScheduleSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found'
      });
    }

    // Check authorization
    const barber = await Barber.findById(slot.barberId);
    if (barber.userId.toString() !== req.user.id && req.user.role !== 'salon_staff' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this schedule'
      });
    }

    // Update day of week if date changed
    if (req.body.date) {
      const dateObj = new Date(req.body.date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      req.body.dayOfWeek = days[dateObj.getDay()];
    }

    slot = await ScheduleSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('barberId', 'userId specialty')
      .populate('salonId', 'name');

    res.status(200).json({
      success: true,
      data: slot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete schedule slot
// @route   DELETE /api/schedules/:id
// @access  Private
exports.deleteSchedule = async (req, res, next) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found'
      });
    }

    // Check if slot is booked
    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a booked schedule slot'
      });
    }

    // Check authorization
    const barber = await Barber.findById(slot.barberId);
    if (barber.userId.toString() !== req.user.id && req.user.role !== 'salon_staff' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this schedule'
      });
    }

    await slot.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check availability
// @route   GET /api/schedules/check-availability
// @access  Public
exports.checkAvailability = async (req, res, next) => {
  try {
    const { barberId, date, startTime, endTime } = req.query;

    if (!barberId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide barberId, date, startTime, and endTime'
      });
    }

    const dateObj = new Date(date);
    const slots = await ScheduleSlot.find({
      barberId,
      date: dateObj,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    const isAvailable = slots.every(slot => !slot.isBooked);

    res.status(200).json({
      success: true,
      data: {
        isAvailable,
        conflictingSlots: slots.filter(s => s.isBooked)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


