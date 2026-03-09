const db = require('../../db');

// Lấy tất cả banners
exports.getAllBanners = (req, res) => {
  const sql = 'SELECT * FROM banners';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Lỗi truy vấn banners:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    }
    res.json(result); // Trả về mảng banner
  });
};
