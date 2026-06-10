const express = require('express');
const {
  getSalonReviews,
  submitReview,
  editReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/salon/:salonId', getSalonReviews);
router.post('/', protect, submitReview);
router.put('/:id', protect, editReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;


