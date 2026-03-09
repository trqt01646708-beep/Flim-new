const express = require('express');
const router = express.Router();
const adminAccountController = require('../controllers/adminAccountController');
const { verifyAdmin, requireSuperAdmin } = require('../middlewares/adminAuth');

// Tạo tài khoản admin
router.post('/create-admin', verifyAdmin, requireSuperAdmin, adminAccountController.createAdminAccount);

// Lấy danh sách rạp
router.get('/theaters', verifyAdmin, requireSuperAdmin, adminAccountController.getAllTheaters);

// Lấy danh sách admin accounts
router.get('/accounts', verifyAdmin, requireSuperAdmin, adminAccountController.getAllAdminAccounts);

// Sửa admin account
router.put('/accounts/:id', verifyAdmin, requireSuperAdmin, adminAccountController.updateAdminAccount);

// Xóa admin account
router.delete('/accounts/:id', verifyAdmin, requireSuperAdmin, adminAccountController.deleteAdminAccount);


module.exports = router;