const express = require('express');
const router = express.Router();
const moviesController = require('../../controllers/pageUserController/moviesController');

// Health check
router.get('/health', moviesController.healthCheck);

// Search movies
router.get('/search', moviesController.searchMovies);

// Get movies by theater (phải đặt trước /:id)
router.get('/by-theater/:theaterId', moviesController.getMoviesByTheater);

// Get movie by ID
router.get('/:id', moviesController.getMovieById);

// Get all movies (có thể filter theo status)
router.get('/', moviesController.getMovies);

module.exports = router;