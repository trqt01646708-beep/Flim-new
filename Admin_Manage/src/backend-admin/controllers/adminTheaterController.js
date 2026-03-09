const db = require('../db');
const moment = require('moment');

// 🟦 Dành cho super_admin: Lấy danh sách tất cả rạp
exports.getAllTheaters = (req, res) => {
  const { admin } = req;
  if (admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin mới được phép xem tất cả rạp' });
  }

  const sql = `
    SELECT t.id, t.name, t.address, t.hotline, t.province_id, 
           p.name AS province_name, t.total_rooms 
    FROM theaters t
    LEFT JOIN provinces p ON t.province_id = p.id
    ORDER BY t.name
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('All theaters:', result);
    res.json(result);
  });
};

// 🟩 Dành cho theater_admin: Lấy rạp được gán
exports.getAssignedTheater = (req, res) => {
  const { admin } = req;
  if (admin.role !== 'theater_admin') {
    return res.status(403).json({ error: 'Chỉ theater_admin được phép lấy rạp được gán' });
  }

  console.log('Admin data from token:', admin);
  
  // JOIN với bảng provinces để lấy tên tỉnh
  const sql = `
    SELECT 
      t.id, 
      t.name, 
      t.address, 
      t.hotline, 
      t.province_id,
      p.name AS province_name,
      t.total_rooms 
    FROM theaters t
    LEFT JOIN provinces p ON t.province_id = p.id
    WHERE t.id = ?
  `;
  
  db.query(sql, [admin.assigned_theater_id], (err, result) => {
    console.log('SQL query result:', result);
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.length === 0) {
      console.log('No theater found for theater_id:', admin.assigned_theater_id);
      return res.status(404).json({ error: 'Rạp không tồn tại hoặc không được gán' });
    }
    
    const theater = result[0];
    console.log('Assigned theater data:', theater);
    
    // Trả về object với province_name
    res.json({
      id: theater.id,
      name: theater.name,
      address: theater.address,
      hotline: theater.hotline,
      province_id: theater.province_id,
      province_name: theater.province_name || 'Không xác định',
      total_rooms: theater.total_rooms
    });
  });
};

// 🟨 Lấy danh sách phòng theo ID rạp
exports.getRoomsByTheater = (req, res) => {
  const { theaterId } = req.params;
  if (!theaterId || isNaN(theaterId)) {
    return res.status(400).json({ error: 'ID rạp không hợp lệ' });
  }
  const sql = 'SELECT id, room_number FROM rooms WHERE theater_id = ?';
  db.query(sql, [theaterId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// 🟪 Lấy lịch chiếu từ hôm nay đến 6 ngày sau theo rạp

