const Offer = require('../models/Offer');
const Salon = require('../models/Salon');

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public
exports.getOffers = async (req, res, next) => {
  try {
    const { salonId, active, featured } = req.query;
    let query = {};

    if (salonId) {
      query.salonId = salonId;
    }

    if (active === 'true') {
      query.isActive = true;
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const offers = await Offer.find(query)
      .populate('salonId', 'name city address')
      .populate('serviceIds', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active offers
// @route   GET /api/offers/active
// @access  Public
exports.getActiveOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
      .populate('salonId', 'name city address')
      .populate('serviceIds', 'name price')
      .sort({ discountPercentage: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create offer
// @route   POST /api/offers
// @access  Private
exports.createOffer = async (req, res, next) => {
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
        message: 'Not authorized to create offer for this salon'
      });
    }

    const offer = await Offer.create(req.body);

    const populatedOffer = await Offer.findById(offer._id)
      .populate('salonId', 'name city')
      .populate('serviceIds', 'name price');

    res.status(201).json({
      success: true,
      data: populatedOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private
exports.updateOffer = async (req, res, next) => {
  try {
    let offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Verify salon ownership
    const salon = await Salon.findById(offer.salonId);
    if (salon.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this offer'
      });
    }

    offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('salonId', 'name city')
    .populate('serviceIds', 'name price');

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check offer validity
// @route   GET /api/offers/:id/validity
// @access  Public
exports.checkOfferValidity = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const now = new Date();
    const isValid = offer.isActive &&
                   offer.startDate <= now &&
                   offer.endDate >= now;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        offer,
        message: isValid ? 'Offer is valid' : 'Offer is not valid'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


