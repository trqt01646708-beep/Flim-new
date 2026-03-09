const express = require('express');
const router = express.Router();
const pricesController = require('../../controllers/pageUserController/pricesController');

// Route để lấy banner theo theater_id
router.get('/', pricesController.getBanners); // /api/ticket-banners?theater_id=1

// THÊM: Route để lấy banner mặc định từ Hà Nội
router.get('/default', pricesController.getDefaultBanner); // /api/ticket-banners/default

module.exports = router;