const Salon = require('../models/Salon');
const Service = require('../models/Service');
const Offer = require('../models/Offer');
const Review = require('../models/Review');

// @desc    Get all salons
// @route   GET /api/salons
// @access  Public
exports.getSalons = async (req, res, next) => {
  try {
    const { city, search, featured } = req.query;
    let query = {};

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const salons = await Salon.find(query)
      .populate('ownerId', 'firstName lastName email')
      .sort({ rating: -1, totalReviews: -1 });

    res.status(200).json({
      success: true,
      count: salons.length,
      data: salons
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single salon
// @route   GET /api/salons/:id
// @access  Public
exports.getSalon = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('ownerId', 'firstName lastName email');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get services
    const services = await Service.find({ salonId: salon._id, isActive: true });

    // Get active offers
    const offers = await Offer.find({
      salonId: salon._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Get reviews
    const reviews = await Review.find({ salonId: salon._id })
      .populate('customerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        salon,
        services,
        offers,
        reviews
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create salon
// @route   POST /api/salons
// @access  Private (Admin/Salon Owner)
exports.createSalon = async (req, res, next) => {
  try {
    req.body.ownerId = req.user.id;
    const salon = await Salon.create(req.body);

    res.status(201).json({
      success: true,
      data: salon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update salon
// @route   PUT /api/salons/:id
// @access  Private
exports.updateSalon = async (req, res, next) => {
  try {
    let salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Make sure user is salon owner or admin
    if (salon.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this salon'
      });
    }

    salon = await Salon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: salon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured salons
// @route   GET /api/salons/featured
// @access  Public
exports.getFeaturedSalons = async (req, res, next) => {
  try {
    const salons = await Salon.find({ isFeatured: true })
      .populate('ownerId', 'firstName lastName')
      .sort({ rating: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: salons.length,
      data: salons
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


