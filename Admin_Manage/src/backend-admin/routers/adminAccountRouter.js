const express = require('express');
const router = express.Router();
const adminAccountController = require('../controllers/adminAccountController');
const { verifyAdmin } = require('../middlewares/adminAuth');

// Lấy thông tin tài khoản của chính mình
router.get('/', verifyAdmin, (req, res) => {
  const { id } = req.admin;
  
  const sql = `
    SELECT 
      a.id, a.username, a.email, a.full_name, a.role, a.assigned_theater_id,
      t.name AS theater_name,
      t.address AS theater_address
    FROM admin_accounts a
    LEFT JOIN theaters t ON a.assigned_theater_id = t.id
    WHERE a.id = ?
  `;
  
  const db = require('../db');
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    res.json(rows[0]);
  });
});

// Cập nhật thông tin tài khoản của chính mình
router.put('/update', verifyAdmin, adminAccountController.updateOwnAccount);

module.exports = router;