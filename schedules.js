const express = require('express');
const {
  getScheduleSlots,
  getAvailableSlots,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  checkAvailability
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/available', getAvailableSlots);
router.get('/check-availability', checkAvailability);
router.get('/', protect, getScheduleSlots);
router.post('/', protect, addSchedule);
router.put('/:id', protect, updateSchedule);
router.delete('/:id', protect, deleteSchedule);

module.exports = router;


