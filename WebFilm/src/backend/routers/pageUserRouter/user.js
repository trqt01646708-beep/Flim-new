const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../../controllers/pageUserController/userController');
const authenticateToken = require('../../middleware/authenticate');
router.get('/profile', authenticateToken, getUserProfile); // Bỏ :userId, dùng req.user.id
router.put('/profile', authenticateToken, updateUserProfile); // Tương tự

module.exports = router;