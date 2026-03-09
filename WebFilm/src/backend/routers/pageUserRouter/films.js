const express = require('express');
const router = express.Router();
const { getFilteredFilms, getAllFilmsWithSchedule } = require('../../controllers/pageUserController/filmsController');
const filmController = require('../../controllers/pageUserController/filmsController');

router.get('/', getFilteredFilms); // Dùng cho trang Movies.jsx
router.get('/with-showtimes', filmController.getFilmsWithShowtimes);
router.get('/:id', filmController.getFilmById);


module.exports = router;
