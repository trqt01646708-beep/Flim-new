const express = require('express');
const router = express.Router();
const { getAllAds } = require('../../controllers/pageUserController/advController');

// Route GET /api/adv
router.get('/', getAllAds);

module.exports = router;
