const db = require('../../db');
let io = null;

exports.setSocketIO = (ioInstance) => {
  io = ioInstance;
};

// Lấy danh sách ghế và trạng thái
exports.getSeatsByShowTime = (req, res) => {
  const { show_time_id } = req.query;
  const getRoomSql = `SELECT room_id FROM show_times WHERE id = ?`;

  db.query(getRoomSql, [show_time_id], (err, roomResult) => {
    if (err || roomResult.length === 0) {
      return res.status(500).json({ error: 'Không tìm thấy suất chiếu' });
    }

    const roomId = roomResult[0].room_id;
    const seatStatusSql = `
      SELECT s.id, s.seat_number, s.seat_type,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.id
            WHERE bs.seat_id = s.id AND b.show_time_id = ?
              AND b.status IN ('held', 'confirmed')
              AND (b.expire_at IS NULL OR b.expire_at > NOW())
          ) THEN 0 ELSE 1
        END AS is_available
      FROM seats s WHERE s.room_id = ?
    `;

    db.query(seatStatusSql, [show_time_id, roomId], (err2, seats) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(seats);
    });
  });
};

// Lấy trạng thái ghế đơn giản
exports.getSeatStatus = (req, res) => {
  const { show_time_id } = req.query;
  if (!show_time_id) return res.status(400).json({ error: 'Thiếu show_time_id' });

  const sql = `
    SELECT bs.seat_id, b.id as booking_id,
      CASE WHEN b.status = 'confirmed' THEN TRUE ELSE FALSE END as is_confirmed
    FROM booking_seats bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE b.show_time_id = ? AND (b.expire_at IS NULL OR b.expire_at > NOW())
  `;

  db.query(sql, [show_time_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// Chi tiết trạng thái ghế
exports.getSeatStatusByShowTime = (req, res) => {
  const { show_time_id } = req.query;
  if (!show_time_id) return res.status(400).json({ error: 'Thiếu show_time_id' });

  const sql = `
    SELECT bs.seat_id, b.id AS booking_id, b.status, b.expire_at
    FROM booking_seats bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE b.show_time_id = ?
  `;

  db.query(sql, [show_time_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const now = new Date();
    const data = result.map(row => ({
      seat_id: row.seat_id,
      booking_id: row.booking_id,
      is_confirmed: row.status === 'confirmed',
      is_held: row.status === 'held' && new Date(row.expire_at) > now
    }));
    res.json(data);
  });
};

// Giữ ghế tạm thời (sử dụng req.user.id từ JWT)
exports.holdSeats = (req, res) => {
  const userId = req.user.id; // Từ JWT middleware
  const { show_time_id, seat_ids } = req.body;
  
  console.log('🔍 Hold seats request:', { userId, show_time_id, seat_ids: seat_ids?.length }); // Debug log

  if (!userId) {
    console.error('❌ No userId from token in holdSeats');
    return res.status(401).json({ error: 'Unauthorized - No user ID from token' });
  }

  if (!show_time_id || isNaN(Number(show_time_id))) {
    console.error('❌ Invalid show_time_id:', show_time_id);
    return res.status(400).json({ error: 'Missing or invalid show_time_id' });
  }

  if (!Array.isArray(seat_ids) || seat_ids.length === 0 || seat_ids.some(id => isNaN(Number(id)))) {
    console.error('❌ Invalid seat_ids:', seat_ids);
    return res.status(400).json({ error: 'Missing or invalid seat_ids (must be non-empty array of numbers)' });
  }

  const parsedUserId = parseInt(userId, 10);
  const expireTime = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

  const checkSeatsSql = `
    SELECT s.id FROM seats s
    WHERE s.id IN (?)
      AND NOT EXISTS (
        SELECT 1 FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.id
        WHERE bs.seat_id = s.id AND b.show_time_id = ?
          AND b.status IN ('held', 'confirmed')
          AND (b.expire_at IS NULL OR b.expire_at > NOW())
      )
  `;

  db.query(checkSeatsSql, [seat_ids, show_time_id], (err, availableSeats) => {
    if (err) {
      console.error('❌ Lỗi kiểm tra ghế:', err);
      return res.status(500).json({ error: 'Lỗi kiểm tra ghế: ' + err.message });
    }

    const validSeatIds = availableSeats.map(row => row.id);
    const invalidSeats = seat_ids.filter(id => !validSeatIds.includes(id));
    if (invalidSeats.length > 0) {
      console.error('❌ Invalid seats:', invalidSeats);
      return res.status(400).json({ error: `Seat IDs không hợp lệ: ${invalidSeats.join(', ')}` });
    }

    // Tính tổng tiền dựa trên giá vé
    const getPricesSql = `SELECT seat_type, price FROM ticket_prices WHERE show_time_id = ?`;
    
    db.query(getPricesSql, [show_time_id], (errPrice, pricesResult) => {
      if (errPrice) {
        console.error('❌ Lỗi lấy giá vé:', errPrice);
        return res.status(500).json({ error: 'Lỗi lấy giá vé: ' + errPrice.message });
      }
      
      const priceMap = {};
      pricesResult.forEach(row => {
        priceMap[row.seat_type] = parseFloat(row.price);
      });

      // Lấy thông tin seat_type của các ghế đã chọn
      const getSeatTypesSql = `SELECT id, seat_type FROM seats WHERE id IN (?)`;
      
      db.query(getSeatTypesSql, [validSeatIds], (errSeats, seatsResult) => {
        if (errSeats) {
          console.error('❌ Lỗi lấy thông tin ghế:', errSeats);
          return res.status(500).json({ error: 'Lỗi lấy thông tin ghế: ' + errSeats.message });
        }
        
        // Tính tổng tiền
        let totalPrice = 0;
        seatsResult.forEach(seat => {
          totalPrice += priceMap[seat.seat_type] || 0;
        });

        const bookingQuery = `
          INSERT INTO bookings (user_id, show_time_id, status, total_price, payment_method, created_at, expire_at)
          VALUES (?, ?, 'held', ?, 'counter', NOW(), ?)
        `;

        db.query(bookingQuery, [parsedUserId, show_time_id, totalPrice, expireTime], (err, result) => {
          if (err) {
            console.error('❌ Lỗi tạo booking:', err);
            return res.status(500).json({ error: 'Lỗi tạo booking: ' + err.message });
          }

          const booking_id = result.insertId;
          const insertSeats = validSeatIds.map(id => [booking_id, id]);

          db.query('INSERT INTO booking_seats (booking_id, seat_id) VALUES ?', [insertSeats], (err2) => {
            if (err2) {
              console.error('❌ Lỗi thêm ghế:', err2);
              db.query('DELETE FROM bookings WHERE id = ?', [booking_id]); // Rollback
              return res.status(500).json({ error: 'Lỗi thêm ghế: ' + err2.message });
            }

            console.log('✅ Held seats successfully:', { booking_id, totalPrice });
            res.json({ booking_id, expire_at: expireTime, total_price: totalPrice });
            
            // Emit socket update
            if (io) {
              io.to(`room_${show_time_id}`).emit('seatUpdate', validSeatIds.map(id => ({ id: Number(id), isHeld: true })));
            }
          });
        });
      });
    });
  });
};

// Xác nhận thanh toán với điểm tích lũy
exports.confirmBooking = (req, res) => {
  const userId = req.user.id;
  const { booking_id, payment_method, use_points } = req.body;
  
  console.log('🔥 Confirm booking request:', { userId, booking_id, payment_method, use_points });
  
  if (!userId) {
    console.error('❌ No userId from token in confirmBooking');
    return res.status(401).json({ error: 'Unauthorized - No user ID from token' });
  }
  
  if (!booking_id || !payment_method) {
    console.error('❌ Missing data in confirmBooking:', { booking_id, payment_method });
    return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
  }

  const getBookingInfoSql = `
    SELECT b.user_id, b.show_time_id, b.total_price, b.status,
           GROUP_CONCAT(bs.seat_id) as seat_ids
    FROM bookings b
    LEFT JOIN booking_seats bs ON b.id = bs.booking_id
    WHERE b.id = ? AND b.user_id = ?
    GROUP BY b.id
  `;

  db.query(getBookingInfoSql, [booking_id, userId], (err, bookingResult) => {
    if (err) {
      console.error('❌ Lỗi lấy booking:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn booking: ' + err.message });
    }

    if (bookingResult.length === 0) {
      console.error('❌ Booking not found or unauthorized:', { booking_id, userId });
      return res.status(404).json({ error: 'Không tìm thấy booking hoặc không có quyền' });
    }

    const booking = bookingResult[0];
    
    if (booking.status === 'confirmed') {
      console.warn('⚠️ Booking already confirmed:', booking_id);
      return res.status(400).json({ error: 'Booking này đã được xác nhận rồi' });
    }

    let totalPrice = parseFloat(booking.total_price);

    console.log('📊 Booking info:', { userId, totalPrice, seat_ids: booking.seat_ids, status: booking.status });

    const getUserSql = `SELECT points FROM users WHERE id = ?`;
    
    db.query(getUserSql, [userId], (err2, userResult) => {
      if (err2 || userResult.length === 0) {
        console.error('❌ Lỗi lấy user:', err2);
        return res.status(500).json({ error: 'Không tìm thấy thông tin người dùng' });
      }

      const currentPoints = parseInt(userResult[0].points) || 0;
      let pointsToUse = parseInt(use_points) || 0;
      let discount = 0;

      console.log('💎 User points:', currentPoints);
      console.log('💰 Use points request:', pointsToUse);

      if (pointsToUse > 0) {
        if (currentPoints < pointsToUse) {
          console.error('❌ Insufficient points:', { currentPoints, pointsToUse });
          return res.status(400).json({ 
            error: 'Không đủ điểm tích lũy',
            currentPoints: currentPoints,
            requestedPoints: pointsToUse
          });
        }

        discount = Math.floor(pointsToUse / 1000) * 5000;

        if (discount > totalPrice) {
          discount = totalPrice;
          pointsToUse = Math.ceil(discount / 5000) * 1000;
        }
      }

      const finalPrice = totalPrice - discount;
      
      console.log('💵 Price calculation:', {
        totalPrice,
        pointsToUse,
        discount,
        finalPrice
      });
      
      const newPointsEarned = Math.floor(finalPrice / 80000) * 1500;
      const newTotalPoints = currentPoints - pointsToUse + newPointsEarned;

      console.log('⭐ Points calculation:', {
        currentPoints,
        pointsToUse,
        newPointsEarned,
        newTotalPoints
      });

      const updateBookingSql = `
        UPDATE bookings 
        SET payment_method = ?, 
            status = 'confirmed', 
            expire_at = NULL,
            total_price = ?,
            points_used = ?,
            discount_amount = ?
        WHERE id = ? AND user_id = ?
      `;

      db.query(updateBookingSql, [payment_method, finalPrice, pointsToUse, discount, booking_id, userId], (err3, updateResult) => {
        if (err3) {
          console.error('❌ Lỗi update booking:', err3);
          return res.status(500).json({ error: 'Lỗi cập nhật booking: ' + err3.message });
        }

        if (updateResult.affectedRows === 0) {
          console.error('❌ No rows updated for booking:', booking_id);
          return res.status(400).json({ error: 'Không thể cập nhật booking' });
        }

        console.log('✅ Booking updated successfully');

        const updateUserSql = `
          UPDATE users 
          SET points = ?, 
              moneySpent = COALESCE(moneySpent, 0) + ?
          WHERE id = ?
        `;

        db.query(updateUserSql, [newTotalPoints, finalPrice, userId], (err4) => {
          if (err4) {
            console.error('❌ Lỗi update user:', err4);
            console.warn('⚠️ Booking confirmed but failed to update user points');
          } else {
            console.log('✅ User points updated successfully');
          }

          if (io && booking.show_time_id) {
            const seatIds = booking.seat_ids.split(',').map(id => parseInt(id));
            io.to(`room_${booking.show_time_id}`).emit('seatUpdate', 
              seatIds.map(id => ({ id, isHeld: false, isBooked: true }))
            );
          }

          return res.status(200).json({ 
            success: true,
            message: 'Đã xác nhận thanh toán',
            pointsUsed: pointsToUse,
            discount: discount,
            finalPrice: finalPrice,
            pointsEarned: newPointsEarned,
            newTotalPoints: newTotalPoints
          });
        });
      });
    });
  });
};

// Hủy booking (sử dụng req.user.id từ JWT)
exports.cancelBooking = (req, res) => {
  const userId = req.user.id; // Từ JWT
  const { booking_id } = req.body;
  
  console.log('🔍 Cancel booking request:', { userId, booking_id });

  if (!userId) {
    console.error('❌ No userId from token in cancelBooking');
    return res.status(401).json({ error: 'Unauthorized - No user ID from token' });
  }

  if (!booking_id) {
    console.error('❌ Missing booking_id in cancelBooking');
    return res.status(400).json({ error: 'Thiếu booking_id' });
  }

  // Check ownership
  const checkOwnershipSql = `SELECT show_time_id FROM bookings WHERE id = ? AND user_id = ?`;
  db.query(checkOwnershipSql, [booking_id, userId], (err, result) => {
    if (err || result.length === 0) {
      console.error('❌ Booking not found or unauthorized:', { booking_id, userId });
      return res.status(404).json({ error: 'Không tìm thấy booking hoặc không có quyền' });
    }

    const show_time_id = result[0].show_time_id;
    const getSeatIdsSql = `SELECT seat_id FROM booking_seats WHERE booking_id = ?`;
    const deleteBookingSeats = `DELETE FROM booking_seats WHERE booking_id = ?`;
    const deleteBooking = `DELETE FROM bookings WHERE id = ?`;

    db.query(getSeatIdsSql, [booking_id], (err2, seatRows) => {
      if (err2) {
        console.error('❌ Lỗi lấy seat_ids:', err2);
        return res.status(500).json({ error: err2.message });
      }

      const seat_ids = seatRows.map(r => r.seat_id);

      db.query(deleteBookingSeats, [booking_id], (err3) => {
        if (err3) {
          console.error('❌ Lỗi delete booking_seats:', err3);
          return res.status(500).json({ error: err3.message });
        }
        db.query(deleteBooking, [booking_id], (err4) => {
          if (err4) {
            console.error('❌ Lỗi delete booking:', err4);
            return res.status(500).json({ error: err4.message });
          }
          console.log('✅ Cancelled booking:', { booking_id, userId });
          res.json({ message: 'Đã hủy giữ ghế' });
          if (io) {
            io.to(`room_${show_time_id}`).emit('seatUpdate', seat_ids.map(id => ({ id, isHeld: false })));
          }
        });
      });
    });
  });
};

// Lấy danh sách vé của người dùng
exports.getMyTickets = (req, res) => {
  const userId = req.user.id; // Từ JWT
  console.log('🔍 Fetching tickets for authenticated userId:', userId); // Debug

  if (!userId) {
    return res.status(401).json({ error: 'Không xác thực được user' });
  }

  const sql = `
    SELECT b.id AS booking_id, m.title AS movie_title, t.name AS theater_name, t.address AS theater_address,
           st.show_time, b.status, b.payment_method, b.created_at, b.total_price,
           b.points_used, b.discount_amount,
           GROUP_CONCAT(s.seat_number ORDER BY s.seat_number ASC) AS seat_numbers
    FROM bookings b
    JOIN show_times st ON b.show_time_id = st.id
    JOIN movies m ON st.movie_id = m.id
    JOIN theaters t ON st.theater_id = t.id
    JOIN booking_seats bs ON b.id = bs.booking_id
    JOIN seats s ON bs.seat_id = s.id
    WHERE b.user_id = ? AND b.status IN ('confirmed', 'held')
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('❌ Lỗi getMyTickets for user', userId, ':', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('🎫 Found tickets for user', userId, ':', result.length);
    res.json(result);
  });
};

// Giá vé theo show_time_id
exports.getTicketPrices = (req, res) => {
  const { show_time_id } = req.query;
  const sql = `SELECT seat_type, price FROM ticket_prices WHERE show_time_id = ?`;
  db.query(sql, [show_time_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const priceMap = {};
    result.forEach(row => {
      priceMap[row.seat_type] = row.price;
    });
    res.json(priceMap);
  });
};