const express = require('express');
const router = express.Router();
const {
  getShowTimesByMovieTheaterDate,
  getTheatersByMovie,
  getMovieDetail,
  hasUpcomingShowtimes
} = require('../../controllers/pageUserController/showtimesController');

// GET /api/showtimes?movie_id=&theater_id=&date=
router.get('/', getShowTimesByMovieTheaterDate);

// GET /api/theaters/by-movie/:movieId
router.get('/theaters/by-movie/:movieId', getTheatersByMovie);

// GET /api/films/:movieId
router.get('/films/:movieId', getMovieDetail);
// kiểm tra xuất chiếu 
router.get('/has-upcoming', hasUpcomingShowtimes);

module.exports = router;
