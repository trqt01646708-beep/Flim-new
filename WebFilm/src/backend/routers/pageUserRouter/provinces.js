// routers/provinces.js
const express = require('express');
const router = express.Router();
const { getAllProvinces } = require('../../controllers/pageUserController/provincesController');

router.get('/', getAllProvinces); // GET /api/provinces

module.exports = router;
