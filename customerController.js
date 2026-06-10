const Customer = require('../models/Customer');
const User = require('../models/User');

// @desc    View salons (redirects to salon routes)
// @route   GET /api/customers/salons
// @access  Private
exports.viewSalons = async (req, res, next) => {
  try {
    // This would typically redirect to salon routes
    res.status(200).json({
      success: true,
      message: 'Use /api/salons to view all salons'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customers/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    if (req.body.preferredBarberId) {
      customer.preferredBarberId = req.body.preferredBarberId;
    }

    customer.lastActiveDate = new Date();
    await customer.save();

    const updatedCustomer = await Customer.findById(customer._id)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('preferredBarberId', 'specialty');

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer profile
// @route   GET /api/customers/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('preferredBarberId', 'specialty');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


