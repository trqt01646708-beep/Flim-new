// controllers/adminAccountController.js
const db = require('../db');

exports.getAccountInfo = (req, res) => {
  const adminId = req.admin.id;

  const sql = `
    SELECT a.id, a.username, a.full_name, a.email, a.role,
           t.name AS theater_name, t.address AS theater_address
    FROM admin_accounts a
    LEFT JOIN theaters t ON a.assigned_theater_id = t.id
    WHERE a.id = ?
  `;

  db.query(sql, [adminId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    if (results.length === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    res.json(results[0]);
  });
};
