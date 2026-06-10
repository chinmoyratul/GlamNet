const express = require('express');
const {
  getServices,
  getServiceBySalon,
  createService,
  updateService,
  calculateServiceDuration
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/salon/:salonId', getServiceBySalon);
router.get('/:id/duration', calculateServiceDuration);
router.get('/', getServices);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);

module.exports = router;


