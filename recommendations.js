const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');
const Service = require('../models/Service');
const Review = require('../models/Review');

/**
 * Get recommendations for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise} Recommended salons
 */
exports.getRecommendations = async (customerId) => {
  try {
    // Get customer's previous bookings
    const previousAppointments = await Appointment.find({ customerId })
      .populate('salonId')
      .populate('serviceId')
      .sort({ appointmentDateTime: -1 })
      .limit(10);

    // Get customer's preferred services
    const preferredServices = previousAppointments.map(apt => apt.serviceId._id.toString());
    const uniqueServices = [...new Set(preferredServices)];

    // Get salons based on previous bookings
    const previouslyVisitedSalons = previousAppointments.map(apt => apt.salonId._id.toString());
    const uniqueSalons = [...new Set(previouslyVisitedSalons)];

    // Get popular services in the area (based on booking frequency)
    const popularServices = await Appointment.aggregate([
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const popularServiceIds = popularServices.map(s => s._id);

    // Get highly rated salons
    const highlyRatedSalons = await Salon.find({
      rating: { $gte: 4.0 },
      totalReviews: { $gte: 5 }
    })
    .sort({ rating: -1, totalReviews: -1 })
    .limit(10);

    // Get salons offering preferred services
    const salonsWithPreferredServices = await Service.find({
      _id: { $in: uniqueServices }
    }).distinct('salonId');

    // Get salons with good ratings offering preferred services
    const recommendedSalons = await Salon.find({
      $or: [
        { _id: { $in: salonsWithPreferredServices } },
        { _id: { $in: highlyRatedSalons.map(s => s._id) } },
        { rating: { $gte: 4.0 } }
      ]
    })
    .sort({ rating: -1, totalReviews: -1 })
    .limit(10)
    .populate('ownerId', 'firstName lastName');

    // Remove previously visited salons from recommendations (or prioritize them)
    const newSalons = recommendedSalons.filter(
      salon => !uniqueSalons.includes(salon._id.toString())
    );
    const visitedSalons = recommendedSalons.filter(
      salon => uniqueSalons.includes(salon._id.toString())
    );

    // Combine: visited salons first, then new recommendations
    const finalRecommendations = [...visitedSalons, ...newSalons].slice(0, 10);

    return {
      success: true,
      recommendations: finalRecommendations,
      basedOn: {
        previousBookings: previousAppointments.length,
        preferredServices: uniqueServices.length,
        popularServices: popularServiceIds.length
      }
    };
  } catch (error) {
    console.error('Recommendation error:', error);
    return {
      success: false,
      recommendations: [],
      message: 'Error generating recommendations'
    };
  }
};

/**
 * Get popular services
 * @returns {Promise} Popular services
 */
exports.getPopularServices = async () => {
  try {
    const popularServices = await Appointment.aggregate([
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const serviceIds = popularServices.map(s => s._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate('salonId', 'name city');

    return services;
  } catch (error) {
    console.error('Popular services error:', error);
    return [];
  }
};


