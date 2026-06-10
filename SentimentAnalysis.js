const mongoose = require('mongoose');

const SentimentAnalysisSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  chatSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession'
  },
  sentimentLabel: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1
  },
  analyzedText: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SentimentAnalysis', SentimentAnalysisSchema);


