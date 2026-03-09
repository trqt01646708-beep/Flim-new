// routers/pageUserRouter/theaters.js
const express = require('express');
const router = express.Router();
const theatersController = require('../../controllers/pageUserController/theatersController');



// Lấy rạp theo phim
router.get('/by-movie/:movieId', theatersController.getTheatersByMovie);

// Lấy rạp theo tỉnh
router.get('/by-province/:provinceId', theatersController.getTheatersByProvince);


// THÊM MỚI: Lấy chi tiết một rạp
router.get('/:id', theatersController.getTheaterById);
// Lấy danh sách tất cả rạp hoặc theo tỉnh
router.get('/', theatersController.getTheaters);
// THÊM MỚI: Lấy phim có ca chiếu trong 6 ngày tới
router.get('/:theaterId/upcoming-movies', theatersController.getMoviesByTheaterWithUpcomingShowtimes);

module.exports = router;