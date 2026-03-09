const express = require('express');
const router = express.Router();
const { getAllBanners } = require('../../controllers/pageUserController/bannersController');

router.get('/', getAllBanners);

module.exports = router;
