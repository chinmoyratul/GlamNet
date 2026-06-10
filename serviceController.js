const Service = require('../models/Service');
const Salon = require('../models/Salon');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
  try {
    const { salonId, category } = req.query;
    let query = { isActive: true };

    if (salonId) {
      query.salonId = salonId;
    }

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .populate('salonId', 'name city address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get service by salon
// @route   GET /api/services/salon/:salonId
// @access  Public
exports.getServiceBySalon = async (req, res, next) => {
  try {
    let services = await Service.find({
      salonId: req.params.salonId,
      isActive: true
    }).sort({ category: 1, name: 1 });

    // If no services found, seed default services (for better UX/testing)
    if (services.length === 0) {
      const defaultServices = [
        { name: 'Classic Haircut', category: 'Haircut', price: 25, duration: 30, description: 'Standard haircut and styling' },
        { name: 'Deluxe Haircut', category: 'Haircut', price: 40, duration: 45, description: 'Premium haircut with wash and head massage' },
        { name: 'Beard Trim', category: 'Beard Trim', price: 15, duration: 20, description: 'Neat trim and shaping for your beard' },
        { name: 'Full Hair Color', category: 'Hair Color', price: 80, duration: 120, description: 'Complete hair coloring service for your hair' },
        { name: 'Refresh Facial', category: 'Facial', price: 35, duration: 40, description: 'Cleansing and moisturizing facial treatment' }
      ];

      await Promise.all(defaultServices.map(service =>
        Service.create({ ...service, salonId: req.params.salonId })
      ));

      // Fetch again after seeding
      services = await Service.find({
        salonId: req.params.salonId,
        isActive: true
      }).sort({ category: 1, name: 1 });
    }

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res, next) => {
  try {
    // Verify salon ownership
    const salon = await Salon.findById(req.body.salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    if (salon.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create service for this salon'
      });
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify salon ownership
    const salon = await Salon.findById(service.salonId);
    if (salon.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calculate service duration
// @route   GET /api/services/:id/duration
// @access  Public
exports.calculateServiceDuration = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        duration: service.duration,
        durationInHours: (service.duration / 60).toFixed(2)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


