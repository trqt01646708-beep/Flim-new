const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/pageUserController/bookingController');
const authenticateToken = require('../../middleware/authenticate'); // Import middleware

module.exports = (io) => {
  // Gán socket cho controller
  bookingController.setSocketIO(io);

  // Các route booking (không cần auth)
  router.get('/seats', bookingController.getSeatsByShowTime);
  router.get('/status', bookingController.getSeatStatus); // Trạng thái ghế 
  router.get('/status', bookingController.getSeatStatusByShowTime); // Duplicate? Giữ nguyên nếu cần
  router.get('/my', authenticateToken, bookingController.getMyTickets); // Auth cho my tickets
  router.get('/ticket-prices', bookingController.getTicketPrices);

  // Routes cần auth
  router.post('/hold', authenticateToken, bookingController.holdSeats); // Giữ ghế
  router.post('/confirm', authenticateToken, bookingController.confirmBooking); // Xác nhận
  router.post('/cancel', authenticateToken, bookingController.cancelBooking); // Hủy

  return router;
};