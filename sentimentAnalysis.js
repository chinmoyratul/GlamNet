const Sentiment = require('sentiment');
const SentimentAnalysis = require('../models/SentimentAnalysis');

const sentiment = new Sentiment();

/**
 * Analyze text sentiment
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
exports.analyzeSentiment = (text) => {
  const result = sentiment.analyze(text);
  
  // Determine label based on score
  let label = 'neutral';
  if (result.score > 2) {
    label = 'positive';
  } else if (result.score < -2) {
    label = 'negative';
  }

  return {
    label,
    score: result.score,
    comparative: result.comparative
  };
};

/**
 * Store sentiment analysis result
 * @param {Object} data - Analysis data
 * @returns {Promise} Saved sentiment analysis
 */
exports.storeSentimentResult = async (data) => {
  const { reviewId, chatSessionId, analyzedText, sentimentLabel, sentimentScore } = data;

  const sentimentAnalysis = await SentimentAnalysis.create({
    reviewId,
    chatSessionId,
    analyzedText,
    sentimentLabel,
    sentimentScore
  });

  return sentimentAnalysis;
};

/**
 * Get sentiment report for a salon
 * @param {string} salonId - Salon ID
 * @returns {Promise} Sentiment report
 */
exports.getSentimentReport = async (salonId) => {
  const reviews = await require('../models/Review').find({ salonId })
    .populate('customerId', 'firstName lastName')
    .sort({ createdAt: -1 });

  const sentimentAnalyses = await SentimentAnalysis.find({
    reviewId: { $in: reviews.map(r => r._id) }
  });

  const positiveCount = sentimentAnalyses.filter(s => s.sentimentLabel === 'positive').length;
  const negativeCount = sentimentAnalyses.filter(s => s.sentimentLabel === 'negative').length;
  const neutralCount = sentimentAnalyses.filter(s => s.sentimentLabel === 'neutral').length;

  const total = sentimentAnalyses.length;
  const positivePercentage = total > 0 ? (positiveCount / total) * 100 : 0;
  const negativePercentage = total > 0 ? (negativeCount / total) * 100 : 0;
  const neutralPercentage = total > 0 ? (neutralCount / total) * 100 : 0;

  return {
    total,
    positive: {
      count: positiveCount,
      percentage: positivePercentage.toFixed(2)
    },
    negative: {
      count: negativeCount,
      percentage: negativePercentage.toFixed(2)
    },
    neutral: {
      count: neutralCount,
      percentage: neutralPercentage.toFixed(2)
    },
    reviews: reviews.slice(0, 10) // Latest 10 reviews
  };
};


