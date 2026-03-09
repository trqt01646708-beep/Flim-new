const db = require('../db');
const moment = require('moment');

exports.checkUpcomingShowtimes = (req, res) => {
  const { movie_id } = req.query;
  const { assigned_theater_id } = req.admin;

  const sql = `
    SELECT COUNT(*) AS count 
    FROM show_times 
    WHERE movie_id = ? AND theater_id = ? AND show_time > NOW()
  `;
  db.query(sql, [movie_id, assigned_theater_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const hasUpcoming = result[0].count > 0;
    res.json({ hasUpcoming });
  });
};



exports.checkUpcomingShowtimes = (req, res) => {
  const { movie_id } = req.query;
  const { assigned_theater_id } = req.admin;

  const sql = `
    SELECT COUNT(*) AS count 
    FROM show_times 
    WHERE movie_id = ? AND theater_id = ? AND show_time > NOW()
  `;
  db.query(sql, [movie_id, assigned_theater_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const hasUpcoming = result[0].count > 0;
    res.json({ hasUpcoming });
  });
};

exports.createShowTime = (req, res) => {
  const { movie_id, room_id, show_time } = req.body;
  const { assigned_theater_id } = req.admin;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    const checkMovieSql = `
      SELECT m.duration, m.license_start, m.license_end, mt.start_date, mt.end_date, m.title
      FROM movies_theaters mt
      JOIN movies m ON mt.movie_id = m.id
      WHERE mt.movie_id = ? AND mt.theater_id = ?
    `;
    db.query(checkMovieSql, [movie_id, assigned_theater_id], (err2, rows) => {
      if (err2) {
        return db.rollback(() => res.status(500).json({ error: err2.message }));
      }
      if (rows.length === 0) {
        return db.rollback(() => res.status(400).json({ error: 'Phim chưa được gán cho rạp này' }));
      }
      
      const { duration, license_start, license_end, start_date, end_date, title: movieTitle } = rows[0];
      const showTimeDate = new Date(show_time);
      
      if (
        (license_start && showTimeDate < new Date(license_start)) ||
        (license_end && showTimeDate > new Date(license_end)) ||
        (start_date && showTimeDate < new Date(start_date)) ||
        (end_date && showTimeDate > new Date(end_date))
      ) {
        return db.rollback(() => res.status(400).json({ error: 'Thời gian suất chiếu không nằm trong khoảng thời gian hợp lệ của phim hoặc rạp' }));
      }

      const endTime = new Date(showTimeDate.getTime() + (duration + 30) * 60000);

      const checkConflictSql = `
        SELECT st.id, st.show_time, m.duration, m.title
        FROM show_times st
        JOIN movies m ON st.movie_id = m.id
        WHERE st.room_id = ?
        AND DATE(st.show_time) = DATE(?)
        ORDER BY st.show_time ASC
      `;
      
      db.query(checkConflictSql, [room_id, show_time], (err3, conflictRows) => {
        if (err3) {
          return db.rollback(() => res.status(500).json({ error: err3.message }));
        }

        let hasConflict = false;
        let conflictingShowtime = null;

        for (let existing of conflictRows) {
          const existingStart = new Date(existing.show_time);
          const existingEnd = new Date(existingStart.getTime() + (existing.duration + 30) * 60000);

          if (
            (showTimeDate <= existingStart && endTime > existingStart) ||
            (showTimeDate < existingEnd && endTime >= existingEnd) ||
            (showTimeDate >= existingStart && endTime <= existingEnd)
          ) {
            hasConflict = true;
            conflictingShowtime = existing;
            break;
          }
        }

        if (hasConflict) {
          const suggestions = [];
          const movieDurationWithBuffer = duration + 30;
          
          const sortedShowtimes = conflictRows.sort((a, b) => 
            new Date(a.show_time) - new Date(b.show_time)
          );
          
          // 1. Kiểm tra TRƯỚC suất chiếu đầu tiên
          if (sortedShowtimes.length > 0) {
            const firstShowtime = sortedShowtimes[0];
            const firstStart = moment(firstShowtime.show_time);
            const suggestedTime = firstStart.clone().subtract(movieDurationWithBuffer, 'minutes');
            
            if (suggestedTime.hour() >= 6) {
              suggestions.push({
                time: suggestedTime.format('DD/MM/YYYY HH:mm'),
                description: `Trước suất đầu tiên "${firstShowtime.title}"`
              });
            }
          }
          
          // 2. Tìm các khoảng trống GIỮA các suất chiếu
          for (let i = 0; i < sortedShowtimes.length - 1; i++) {
            const current = sortedShowtimes[i];
            const next = sortedShowtimes[i + 1];
            
            const currentEnd = moment(current.show_time).add(current.duration + 30, 'minutes');
            const nextStart = moment(next.show_time);
            
            const gapMinutes = nextStart.diff(currentEnd, 'minutes');
            
            if (gapMinutes >= movieDurationWithBuffer) {
              suggestions.push({
                time: currentEnd.format('DD/MM/YYYY HH:mm'),
                description: `Giữa "${current.title}" và "${next.title}"`
              });
            }
          }
          
          // 3. Kiểm tra SAU suất chiếu cuối cùng
          if (sortedShowtimes.length > 0) {
            const lastShowtime = sortedShowtimes[sortedShowtimes.length - 1];
            const lastEnd = moment(lastShowtime.show_time).add(lastShowtime.duration + 30, 'minutes');
            const suggestedAfterEnd = lastEnd.clone().add(movieDurationWithBuffer, 'minutes');
            
            if (suggestedAfterEnd.hour() < 23 || (suggestedAfterEnd.hour() === 23 && suggestedAfterEnd.minute() === 0)) {
              suggestions.push({
                time: lastEnd.format('DD/MM/YYYY HH:mm'),
                description: `Sau suất cuối "${lastShowtime.title}"`
              });
            }
          }

          console.log('=== CONFLICT DETECTED ===');
          console.log('Suggestions found:', suggestions.length);
          console.log('Suggestions:', suggestions);

          return db.rollback(() => {
            const response = { 
              error: 'Phòng đã có suất chiếu trong khoảng thời gian này',
              conflictWith: {
                movie: conflictingShowtime.title,
                time: moment(conflictingShowtime.show_time).format('DD/MM/YYYY HH:mm')
              },
              suggestions: suggestions.length > 0 ? suggestions : [{
                time: null,
                description: 'Không có thời gian khả dụng trong ngày này. Vui lòng chọn ngày khác hoặc phòng khác.'
              }]
            };
            
            console.log('Response to send:', JSON.stringify(response, null, 2));
            res.status(400).json(response);
          });
        }

        const getCapacitySql = `SELECT capacity FROM rooms WHERE id = ? AND theater_id = ?`;
        db.query(getCapacitySql, [room_id, assigned_theater_id], (err4, roomRows) => {
          if (err4) {
            return db.rollback(() => res.status(500).json({ error: err4.message }));
          }
          if (roomRows.length === 0) {
            return db.rollback(() => res.status(400).json({ error: 'Phòng chiếu không tồn tại hoặc không thuộc rạp này' }));
          }
          
          const available_seats = roomRows[0].capacity;

          const insertSql = `
            INSERT INTO show_times (movie_id, theater_id, room_id, show_time, available_seats)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.query(insertSql, [movie_id, assigned_theater_id, room_id, show_time, available_seats], (err5, result) => {
            if (err5) {
              return db.rollback(() => res.status(500).json({ error: err5.message }));
            }
            
            const showTimeId = result.insertId;
            
        // TÍNH TOÁN TẤT CẢ GIỜ KHẢ DỤNG CÒN LẠI TRONG NGÀY
            const movieDurationWithBuffer = duration + 30;
            const newShowEnd = moment(showTimeDate).add(movieDurationWithBuffer, 'minutes');

            // Lấy tất cả suất chiếu trong ngày, bao gồm cả suất vừa tạo
            const findAllShowtimesSql = `
              SELECT st.show_time, m.title, m.duration
              FROM show_times st
              JOIN movies m ON st.movie_id = m.id
              WHERE st.room_id = ?
              AND DATE(st.show_time) = DATE(?)
              ORDER BY st.show_time ASC
            `;

            db.query(findAllShowtimesSql, [room_id, show_time], (err6, allShowtimes) => {
              let availableSlots = [];
              
              if (allShowtimes && allShowtimes.length > 0) {
                const sortedShowtimes = allShowtimes.map(s => ({
                  start: moment(s.show_time),
                  end: moment(s.show_time).add(s.duration + 30, 'minutes'),
                  title: s.title,
                  duration: s.duration
                })).sort((a, b) => a.start - b.start);
                
                // Tìm các khoảng trống GIỮA các suất chiếu
                for (let i = 0; i < sortedShowtimes.length - 1; i++) {
                  const current = sortedShowtimes[i];
                  const next = sortedShowtimes[i + 1];
                  
                  const gapMinutes = next.start.diff(current.end, 'minutes');
                  
                  if (gapMinutes >= movieDurationWithBuffer) {
                    availableSlots.push({
                      time: current.end.format('DD/MM/YYYY HH:mm'),
                      description: `Giữa "${current.title}" và "${next.title}"`
                    });
                  }
                }
                
                // Kiểm tra SAU suất cuối cùng
                const lastShowtime = sortedShowtimes[sortedShowtimes.length - 1];
                const suggestedAfterEnd = lastShowtime.end.clone().add(movieDurationWithBuffer, 'minutes');
                
                if (suggestedAfterEnd.hour() < 23 || (suggestedAfterEnd.hour() === 23 && suggestedAfterEnd.minute() === 0)) {
                  availableSlots.push({
                    time: lastShowtime.end.format('DD/MM/YYYY HH:mm'),
                    description: `Sau suất cuối "${lastShowtime.title}"`
                  });
                }
              }
              
              const response = {
                message: 'Đã tạo suất chiếu thành công',
                id: showTimeId,
                showtime: moment(showTimeDate).format('DD/MM/YYYY HH:mm'),
                movie: movieTitle,
                nextAvailableSlots: availableSlots.length > 0 ? availableSlots : [{
                  time: null,
                  description: 'Không còn thời gian khả dụng trong ngày này'
                }]
              };
              
              res.json(response);
              
              db.commit((err7) => {
                if (err7) return db.rollback(() => res.status(500).json({ error: err7.message }));
              });
            });
          });
        });
      });
    });
  });
};
  


exports.getShowtimesByTheater = (req, res) => {
  const theaterId = req.params.id;
  const { assigned_theater_id, role } = req.admin;

  // Super admin có thể xem tất cả rạp, theater admin chỉ xem rạp được assigned
  if (role !== 'super_admin' && parseInt(theaterId) !== assigned_theater_id) {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập rạp này' });
  }

  // Query với tối ưu chỉ lấy showtime từ hôm nay đến 7 ngày sau
  const sql = `
    SELECT 
      r.id AS room_id,
      r.room_number,
      r.capacity,
      st.id AS show_time_id,
      DATE_FORMAT(st.show_time, '%H:%i') AS show_time,
      DATE(st.show_time) AS date,
      m.title AS movie_title,
      (r.capacity - COALESCE(booked_count, 0)) AS available_seats
    FROM rooms r
    LEFT JOIN show_times st ON r.id = st.room_id
      AND st.show_time >= CURDATE()
      AND st.show_time < DATE_ADD(CURDATE(), INTERVAL 8 DAY)
    LEFT JOIN movies m ON st.movie_id = m.id
    LEFT JOIN (
      SELECT 
        b.show_time_id,
        COUNT(*) as booked_count
      FROM bookings b
      JOIN booking_seats bs ON b.id = bs.booking_id
      WHERE b.status IN ('held', 'confirmed')
        AND (b.expire_at IS NULL OR b.expire_at > NOW())
      GROUP BY b.show_time_id
    ) booking_stats ON st.id = booking_stats.show_time_id
    WHERE r.theater_id = ?
      AND st.id IS NOT NULL
    ORDER BY r.room_number, st.show_time
  `;
  
  db.query(sql, [theaterId], (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('Raw SQL results:', JSON.stringify(results, null, 2));

    // Group data by room
    const processedData = results.reduce((acc, row) => {
      let room = acc.find(r => r.room_id === row.room_id);
      if (!room) {
        room = {
          room_id: row.room_id,
          room_number: row.room_number,
          capacity: row.capacity,
          showtimes: {}
        };
        acc.push(room);
      }
      
      if (row.show_time_id) {
        if (!room.showtimes[row.date]) {
          room.showtimes[row.date] = [];
        }
        
        const showtimeString = `${row.show_time_id}|${row.show_time}|${row.movie_title}|${row.available_seats}`;
        room.showtimes[row.date].push(showtimeString);
      }
      
      return acc;
    }, []);
    
    console.log('Processed data:', JSON.stringify(processedData, null, 2));
    res.json(processedData);
  });
};


// Lấy ghế cho suất chiếu
// Trong showTimesController.js - XÓA TẤT CẢ duplicate functions và chỉ giữ này
exports.getSeatsByShowTime = (req, res) => {
  const showTimeId = req.params.id;
  const { assigned_theater_id, role } = req.admin;

  console.log('Debug getSeatsByShowTime:', { showTimeId, assigned_theater_id, role });

  const checkShowtimeSql = `
    SELECT room_id, theater_id FROM show_times WHERE id = ?
  `;
  
  db.query(checkShowtimeSql, [showTimeId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error in checkShowtime:', checkErr);
      return res.status(500).json({ error: 'Lỗi kiểm tra suất chiếu' });
    }
    
    console.log('checkResults:', checkResults);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }

    const { theater_id, room_id } = checkResults[0];
    
    console.log('Permission check:', { role, theater_id, assigned_theater_id });
    
    // Super admin có thể xem tất cả, theater admin chỉ xem rạp của mình
    if (role !== 'super_admin' && theater_id !== assigned_theater_id) {
      return res.status(403).json({ error: 'Suất chiếu không thuộc rạp của bạn' });
    }

    console.log('Permission granted, roomId:', room_id);
    
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

    db.query(seatStatusSql, [showTimeId, room_id], (err2, seats) => {
      if (err2) {
        console.error('Error in seatStatusSql:', err2);
        return res.status(500).json({ error: err2.message });
      }
      
      const total_seats = seats.length;
      const available_seats = seats.filter(seat => seat.is_available === 1).length;
      
      const response = {
        seats: seats.map(seat => ({
          id: seat.id,
          seat_number: seat.seat_number,
          seat_type: seat.seat_type,
          is_available: !!seat.is_available
        })),
        total_seats,
        available_seats
      };
      
      res.json(response);
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
// Trong showTimesController.js - sửa hàm getSeatBookingDetails
exports.getSeatBookingDetails = (req, res) => {
  const { showTimeId, seatId } = req.query;
  const { assigned_theater_id, role } = req.admin;

  console.log('Debug getSeatBookingDetails:', { showTimeId, seatId, assigned_theater_id, role });

  // Xây dựng truy vấn SQL, bỏ qua kiểm tra theater_id cho super_admin
  let sql = `
    SELECT 
      b.id AS booking_id,
      b.user_id,
      u.username,
      u.email,
      u.phone,
      u.gender,
      s.seat_number,
      s.seat_type,
      b.status,
      b.payment_method,
      b.total_price,
      b.created_at,
      b.expire_at,
      st.theater_id
    FROM bookings b
    JOIN booking_seats bs ON b.id = bs.booking_id
    JOIN seats s ON bs.seat_id = s.id
    JOIN show_times st ON b.show_time_id = st.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.show_time_id = ? AND s.id = ? 
      AND b.status IN ('held', 'confirmed')
  `;
  const queryParams = [showTimeId, seatId];

  if (role !== 'super_admin') {
    sql += ` AND st.theater_id = ?`;
    queryParams.push(assigned_theater_id);
  }

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error('Error in getSeatBookingDetails:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('getSeatBookingDetails results:', results);

    if (results.length === 0) {
      return res.json({ 
        message: 'Ghế chưa được đặt hoặc booking đã bị hủy',
        isEmpty: true 
      });
    }
    
    const booking = results[0];
    
    res.json({
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      username: booking.username || 'Không có tên',
      email: booking.email || 'Không có email',
      phone: booking.phone || 'Không có SĐT',
      gender: booking.gender || 'Không xác định',
      seat_number: booking.seat_number,
      seat_type: booking.seat_type,
      status: booking.status,
      payment_method: booking.payment_method || 'Chưa thanh toán',
      total_price: booking.total_price || 0,
      created_at: booking.created_at,
      expire_at: booking.expire_at
    });
  });
};