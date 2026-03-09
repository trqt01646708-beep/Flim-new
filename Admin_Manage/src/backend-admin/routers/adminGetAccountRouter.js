// routers/adminAccountRouter.js
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middlewares/adminAuth');
const { getAccountInfo } = require('../controllers/adminGetAccountController');
const adminAccountController = require('../controllers/adminAccountController');

// Lấy thông tin tài khoản
router.get('/', verifyAdmin, getAccountInfo);

// Cập nhật thông tin tài khoản của chính mình
router.put('/update', verifyAdmin, adminAccountController.updateOwnAccount);

module.exports = router;