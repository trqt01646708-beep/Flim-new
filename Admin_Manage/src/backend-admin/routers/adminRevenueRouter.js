const express = require('express');
const router = express.Router();
const adminRevenueController = require('../controllers/adminRevenueController');
const { verifyAdmin } = require('../middlewares/adminAuth');

// Theater admin routes
router.get('/theater', verifyAdmin, adminRevenueController.getTheaterRevenue);
router.get('/theater/by-movie', verifyAdmin, adminRevenueController.getTheaterRevenueByMovie);
router.get('/theater/by-date', verifyAdmin, adminRevenueController.getTheaterRevenueByDate);
// Super admin routes
router.get('/super-admin', verifyAdmin, adminRevenueController.getSuperAdminRevenue);
router.get('/ranking', verifyAdmin, adminRevenueController.getTheaterRanking);

// Chung cho cả 2 role
router.get('/by-month', verifyAdmin, adminRevenueController.getRevenueByMonth);

module.exports = router;