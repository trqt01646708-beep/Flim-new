const express = require('express');
const router = express.Router();
const theaterIntroBannersController = require('../../controllers/pageUserController/theaterIntroBannersController');

// GET theater intro banners
router.get('/', theaterIntroBannersController.getTheaterIntroBanners);

module.exports = router;