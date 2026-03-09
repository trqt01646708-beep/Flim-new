const express = require('express');
const router = express.Router();
const showTimesController = require('../controllers/showTimesController');
const { verifyAdmin } = require('../middlewares/adminAuth');

// Kiểm tra suất chiếu sắp tới
router.get('/has-upcoming', verifyAdmin, showTimesController.checkUpcomingShowtimes);

// Tạo suất chiếu
router.post('/', verifyAdmin, showTimesController.createShowTime);

// Lấy lịch chiếu cho rạp
router.get('/theater/:id/showtimes', verifyAdmin, showTimesController.getShowtimesByTheater);

// Lấy ghế cho suất chiếu
router.get('/:id/seats', verifyAdmin, showTimesController.getSeatsByShowTime);

// Lấy trạng thái ghế
router.get('/seat-booking', verifyAdmin, showTimesController.getSeatStatusByShowTime);

router.get('/seat-details', verifyAdmin, showTimesController.getSeatBookingDetails);

module.exports = router;