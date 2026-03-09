// middlewares/adminAuth.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Thêm để đọc biến môi trường

// ✅ Middleware xác thực token admin
exports.verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Thiếu token xác thực' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin_secret_key'); // Ưu tiên biến môi trường
    if (!decoded.role || (decoded.role !== 'super_admin' && decoded.role !== 'theater_admin')) {
      return res.status(403).json({ error: 'Vai trò không hợp lệ' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token không hợp lệ' });
  }
};

// ✅ Middleware yêu cầu phải là super_admin
exports.requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin mới được phép thao tác này' });
  }
  next();
};