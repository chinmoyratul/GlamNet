const { getRecommendations, getPopularServices } = require('../utils/recommendations');
const Customer = require('../models/Customer');

// @desc    Get recommendations for customer
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.id });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const recommendations = await getRecommendations(customer._id);

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get popular services
// @route   GET /api/recommendations/popular-services
// @access  Public
exports.getPopularServices = async (req, res, next) => {
  try {
    const services = await getPopularServices();

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


