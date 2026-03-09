const db = require('../../db');

exports.getUserProfile = async (req, res) => {
  const userId = req.user.id; // Từ JWT payload
  console.log('🔍 Fetching profile for authenticated userId:', userId); // Debug

  if (!userId) {
    return res.status(401).json({ message: 'Không xác thực được user' });
  }

  try {
    const [users] = await db.promise().query(
      `SELECT id, username, email, 
              COALESCE(points, 0) as points, 
              COALESCE(moneySpent, 0) as moneySpent, 
              is_verified, phone, gender, cccd, dateOfBirth, province, district 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = users[0];
    console.log('📊 User points/moneySpent from DB for ID', userId, ':', { points: user.points, moneySpent: user.moneySpent });

    const [orders] = await db.promise().query(
      `
        SELECT 
          b.id AS order_id,
          m.title AS movie_title,
          t.name AS theater_name,
          st.show_time,
          r.room_number,
          b.status,
          b.total_price,
          b.points_used,
          b.discount_amount,
          GROUP_CONCAT(s.seat_number ORDER BY s.seat_number ASC) AS seat_info
        FROM bookings b
        LEFT JOIN show_times st ON b.show_time_id = st.id
        LEFT JOIN movies m ON st.movie_id = m.id
        LEFT JOIN theaters t ON st.theater_id = t.id
        LEFT JOIN rooms r ON st.room_id = r.id
        LEFT JOIN booking_seats bs ON b.id = bs.booking_id
        LEFT JOIN seats s ON bs.seat_id = s.id
        WHERE b.user_id = ? AND b.status = 'confirmed'
        GROUP BY b.id
      `,
      [userId]
    );

    console.log('🎫 Found confirmed orders for user', userId, ':', orders.length, 'tickets');

    const response = {
      id: user.id,
      username: user.username,
      email: user.email,
      points: parseInt(user.points) || 0,
      moneySpent: parseFloat(user.moneySpent) || 0,
      is_verified: user.is_verified,
      phone: user.phone,
      gender: user.gender,
      cccd: user.cccd,
      dateOfBirth: user.dateOfBirth,
      province: user.province,
      district: user.district,
      purchasedMovies: orders
    };

    res.json(response);
  } catch (err) {
    console.error('❌ Lỗi getUserProfile for user', userId, ':', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { phone, gender, cccd, dateOfBirth, province, district } = req.body;

  console.log('🔍 Updating profile for authenticated userId:', userId);

  if (!userId) {
    return res.status(401).json({ message: 'Không xác thực được user' });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE users SET phone = ?, gender = ?, cccd = ?, dateOfBirth = ?, province = ?, district = ? WHERE id = ?`,
      [phone, gender, cccd, dateOfBirth, province, district, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('❌ Lỗi updateUserProfile for user', userId, ':', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin' });
  }
};