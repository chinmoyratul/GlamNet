const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');
const Barber = require('../models/Barber');
const Customer = require('../models/Customer');
const { analyzeSentiment, storeSentimentResult } = require('../utils/sentimentAnalysis');

// @desc    Get reviews for a salon
// @route   GET /api/reviews/salon/:salonId
// @access  Public
exports.getSalonReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ salonId: req.params.salonId })
      .populate('customerId')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('barberId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit review
// @route   POST /api/reviews
// @access  Private
exports.submitReview = async (req, res, next) => {
  try {
    const { salonId, appointmentId, barberId, rating, reviewText } = req.body;

    // Get customer
    const customer = await Customer.findOne({ userId: req.user.id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Verify appointment exists and belongs to customer
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.customerId.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this appointment'
      });
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed appointments'
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this appointment'
      });
    }

    // Analyze sentiment
    const sentimentResult = analyzeSentiment(reviewText);

    // Create review
    const review = await Review.create({
      customerId: customer._id,
      salonId,
      appointmentId,
      barberId,
      rating,
      reviewText,
      sentimentLabel: sentimentResult.label,
      isVerified: true
    });

    // Store sentiment analysis
    await storeSentimentResult({
      reviewId: review._id,
      analyzedText: reviewText,
      sentimentLabel: sentimentResult.label,
      sentimentScore: sentimentResult.score
    });

    // Update salon rating
    await updateSalonRating(salonId);

    // Update barber rating if barberId provided
    if (barberId) {
      await updateBarberRating(barberId);
    }

    const populatedReview = await Review.findById(review._id)
      .populate('customerId')
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('barberId')
      .populate('salonId', 'name');

    res.status(201).json({
      success: true,
      data: populatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Edit review
// @route   PUT /api/reviews/:id
// @access  Private
exports.editReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    const customer = await Customer.findOne({ userId: req.user.id });
    if (review.customerId.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review'
      });
    }

    // Re-analyze sentiment if review text changed
    if (req.body.reviewText) {
      const sentimentResult = analyzeSentiment(req.body.reviewText);
      req.body.sentimentLabel = sentimentResult.label;
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('customerId')
    .populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'firstName lastName' }
    })
    .populate('salonId', 'name');

    // Update salon rating
    await updateSalonRating(review.salonId);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    const customer = await Customer.findOne({ userId: req.user.id });
    if (review.customerId.toString() !== customer._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const salonId = review.salonId;
    await review.deleteOne();

    // Update salon rating
    await updateSalonRating(salonId);

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

// Helper function to update salon rating
const updateSalonRating = async (salonId) => {
  const reviews = await Review.find({ salonId });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Salon.findByIdAndUpdate(salonId, {
      rating: averageRating.toFixed(1),
      totalReviews: reviews.length
    });
  }
};

// Helper function to update barber rating
const updateBarberRating = async (barberId) => {
  const reviews = await Review.find({ barberId });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Barber.findByIdAndUpdate(barberId, {
      rating: averageRating.toFixed(1),
      totalReviews: reviews.length
    });
  }
};


