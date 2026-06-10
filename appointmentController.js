const Appointment = require('../models/Appointment');
const ScheduleSlot = require('../models/ScheduleSlot');
const Customer = require('../models/Customer');
const Service = require('../models/Service');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user.id });
      if (customer) {
        query.customerId = customer._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Customer profile not found'
        });
      }
    } else if (req.user.role === 'barber') {
      const Barber = require('../models/Barber');
      const barber = await Barber.findOne({ userId: req.user.id });
      if (barber) {
        query.barberId = barber._id;
      }
    } else if (req.user.role === 'salon_staff') {
      const SalonStaff = require('../models/SalonStaff');
      const staff = await SalonStaff.findOne({ userId: req.user.id });
      if (staff) {
        query.salonId = staff.salonId;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerId', 'userId')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
      })
      .populate('barberId', 'userId specialty')
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('salonId', 'name address city phone')
      .populate('serviceId', 'name price duration')
      .populate('scheduleSlotId')
      .sort({ appointmentDateTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customerId')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
      })
      .populate('barberId')
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('salonId')
      .populate('serviceId')
      .populate('scheduleSlotId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const { barberId, salonId, serviceId, scheduleSlotId, appointmentDateTime, notes } = req.body;

    // Get customer
    const customer = await Customer.findOne({ userId: req.user.id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Check if slot is available
    let slot;
    const isVirtual = typeof scheduleSlotId === 'string' && scheduleSlotId.startsWith('virtual-');

    if (isVirtual) {
      // Handle virtual slot: Create it in DB on the fly
      const startTime = scheduleSlotId.split('-')[1];
      // Calculate end time (30 mins later)
      let [h, m] = startTime.split(':').map(Number);
      m += 30;
      if (m >= 60) { h += 1; m -= 60; }
      const endTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const dateObj = new Date(appointmentDateTime);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      slot = await ScheduleSlot.create({
        barberId,
        salonId,
        date: dateObj,
        dayOfWeek: days[dateObj.getDay()],
        startTime,
        endTime,
        isBooked: false
      });
    } else {
      slot = await ScheduleSlot.findById(scheduleSlotId);
    }

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found'
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Verify slot belongs to the selected barber
    if (slot.barberId.toString() !== barberId) {
      return res.status(400).json({
        success: false,
        message: 'Schedule slot does not match the selected barber'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      customerId: customer._id,
      barberId,
      salonId,
      serviceId,
      scheduleSlotId: slot._id, // Use the real slot ID
      appointmentDateTime,
      notes,
      paymentStatus: 'pending'
    });

    // Mark slot as booked
    slot.isBooked = true;
    slot.appointmentId = appointment._id;
    await slot.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate('barberId')
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('salonId', 'name address phone')
      .populate('serviceId', 'name price duration');

    res.status(201).json({
      success: true,
      data: populatedAppointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const customer = await Customer.findOne({ userId: req.user.id });
    if (appointment.customerId.toString() !== customer?._id.toString() &&
      req.user.role !== 'barber' &&
      req.user.role !== 'salon_staff' &&
      req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('customerId')
      .populate('barberId')
      .populate('salonId')
      .populate('serviceId');

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const customer = await Customer.findOne({ userId: req.user.id });
    if (appointment.customerId.toString() !== customer?._id.toString() &&
      req.user.role !== 'barber' &&
      req.user.role !== 'salon_staff' &&
      req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Free up the schedule slot
    const slot = await ScheduleSlot.findById(appointment.scheduleSlotId);
    if (slot) {
      slot.isBooked = false;
      slot.appointmentId = null;
      await slot.save();
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

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

// @desc    Confirm payment
// @route   PUT /api/appointments/:id/payment
// @access  Private
exports.confirmPayment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.paymentStatus = 'paid';
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


