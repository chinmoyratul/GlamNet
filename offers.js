const express = require('express');
const {
  getOffers,
  getActiveOffers,
  createOffer,
  updateOffer,
  checkOfferValidity
} = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/active', getActiveOffers);
router.get('/:id/validity', checkOfferValidity);
router.get('/', getOffers);
router.post('/', protect, createOffer);
router.put('/:id', protect, updateOffer);

module.exports = router;


