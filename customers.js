const express = require('express');
const {
  viewSalons,
  updateProfile,
  getProfile
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/salons', viewSalons);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;


