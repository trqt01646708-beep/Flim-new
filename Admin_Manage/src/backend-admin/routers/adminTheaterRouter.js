const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminTheaterController');
const { verifyAdmin } = require('../middlewares/adminAuth');

router.get('/all', verifyAdmin, controller.getAllTheaters); // Thay /api/admin/all thành /all
router.get('/assigned', verifyAdmin, (req, res, next) => {
  console.log('Request received for /assigned with admin:', req.admin);
  next();
}, controller.getAssignedTheater); // Thay /api/admin/assigned thành /assigned
router.get('/:theaterId/rooms', verifyAdmin, controller.getRoomsByTheater);


module.exports = router;