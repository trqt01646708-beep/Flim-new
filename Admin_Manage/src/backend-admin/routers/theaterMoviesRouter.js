const express = require('express');
const router = express.Router();
const theaterMoviesController = require('../controllers/adminTheaterMoviesController');
const { verifyAdmin } = require('../middlewares/adminAuth');

router.use(verifyAdmin);

// Lấy danh sách phim của rạp
router.get('/', theaterMoviesController.getMoviesByTheater);

// ✅ GET phim chưa gán vào rạp 
router.get('/available', theaterMoviesController.getAvailableMoviesToAssign);

// Gán phim có sẵn cho rạp
router.post('/', theaterMoviesController.assignMovieToTheater);

// Sửa ngày chiếu và trạng thái hiển thị phim của rạp
router.put('/:movie_id', theaterMoviesController.updateMovieForTheater);

// Xoá phim khỏi rạp
router.delete('/:movie_id', theaterMoviesController.deleteMovieFromTheater);

// Lấy danh sách phòng
router.get('/rooms', theaterMoviesController.getRoomsByTheater);


// Lưu giá vé
router.post('/ticket-prices', theaterMoviesController.createTicketPrice);

module.exports = router;