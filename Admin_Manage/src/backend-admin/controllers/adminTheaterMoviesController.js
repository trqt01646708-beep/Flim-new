const db = require('../db');

// Lấy danh sách phim đã gán cho rạp
exports.getMoviesByTheater = (req, res) => {
  const { assigned_theater_id } = req.admin;
  const sql = `
    SELECT m.id AS movie_id, m.title, m.genre, m.poster, m.duration, m.description,
           mt.start_date, mt.end_date, mt.is_visible,
           m.status, m.license_type, m.license_start, m.license_end
    FROM movies_theaters mt
    JOIN movies m ON mt.movie_id = m.id
    WHERE mt.theater_id = ?
  `;
  db.query(sql, [assigned_theater_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// Lấy danh sách phim có sẵn để gán cho rạp (chưa được thêm vào)
exports.getAvailableMoviesToAssign = (req, res) => {
  const { assigned_theater_id } = req.admin;
  const sql = `
    SELECT m.id, m.title, m.genre, m.poster, m.duration, m.description,
           m.status, m.license_type, m.license_start, m.license_end
    FROM movies m
    WHERE m.id NOT IN (
      SELECT movie_id FROM movies_theaters WHERE theater_id = ?
    )
    AND (
      m.scope = 'global' 
      OR (m.scope = 'restricted' AND m.restricted_to_theater_id = ?)
    )
  `;
  db.query(sql, [assigned_theater_id, assigned_theater_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// Gán phim cho rạp, có kiểm tra logic bản quyền
exports.assignMovieToTheater = (req, res) => {
  const { movie_id, start_date, end_date, is_visible } = req.body;
  const { assigned_theater_id } = req.admin;

  const checkExistSql = `SELECT * FROM movies_theaters WHERE movie_id = ? AND theater_id = ?`;
  db.query(checkExistSql, [movie_id, assigned_theater_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length > 0) return res.status(400).json({ error: 'Phim đã tồn tại trong rạp' });

    const movieSql = `
      SELECT status, license_type, license_start, license_end, 
             scope, restricted_to_theater_id 
      FROM movies WHERE id = ?
    `;
    
    db.query(movieSql, [movie_id], (err2, movieRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (movieRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy phim' });

      const movie = movieRows[0];

      // KIỂM TRA QUYỀN TRUY CẬP DỰA TRÊN SCOPE
      if (movie.scope === 'restricted') {
        if (movie.restricted_to_theater_id !== assigned_theater_id) {
          return res.status(403).json({ 
            error: 'Phim này chỉ dành riêng cho rạp được chỉ định. Bạn không có quyền thêm phim này vào rạp của mình.' 
          });
        }
        console.log('✅ Phim restricted - Theater được phép:', assigned_theater_id);
      } else {
        console.log('✅ Phim global - Tất cả rạp được phép');
      }

      // KIỂM TRA LICENSE_END CHỈ KHI KHÔNG PHẢI MUA ĐỨT
      if (movie.license_type !== 'permanent' && movie.license_end) {
        if (new Date(end_date) > new Date(movie.license_end)) {
          return res.status(400).json({ error: 'Ngày kết thúc chiếu không được vượt quá ngày hết bản quyền' });
        }
      }

      // KIỂM TRA LICENSE_START
      if (movie.status === 'coming_soon') {
        if (new Date(start_date) < new Date(movie.license_start)) {
          return res.status(400).json({ error: 'Ngày bắt đầu chiếu phải sau hoặc bằng ngày bản quyền bắt đầu cho phim coming_soon' });
        }
      } else if (movie.status !== 'special') {
        if (new Date(start_date) < new Date(movie.license_start)) {
          return res.status(400).json({ error: 'Ngày bắt đầu chiếu phải sau hoặc bằng ngày bản quyền bắt đầu' });
        }
      }

      // INSERT VÀO MOVIES_THEATERS
      const insertSql = `
        INSERT INTO movies_theaters (movie_id, theater_id, start_date, end_date, is_visible)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.query(insertSql, [movie_id, assigned_theater_id, start_date, end_date, is_visible], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        
        console.log('✅ Đã gán phim cho rạp thành công');
        res.json({ message: 'Đã gán phim cho rạp thành công' });
      });
    });
  });
};
// Xoá phim khỏi rạp (nếu không còn suất chiếu sắp tới)
exports.deleteMovieFromTheater = (req, res) => {
  const { movie_id } = req.params;
  const { assigned_theater_id } = req.admin;

  const checkShowtimeSql = `
    SELECT COUNT(*) AS count FROM show_times 
    WHERE movie_id = ? AND theater_id = ? AND show_time > NOW()
  `;
  db.query(checkShowtimeSql, [movie_id, assigned_theater_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result[0].count > 0) {
      return res.status(400).json({ error: 'Không thể xoá, phim đang có suất chiếu chưa diễn ra tại rạp này' });
    }

    const deleteSql = `DELETE FROM movies_theaters WHERE movie_id = ? AND theater_id = ?`;
    db.query(deleteSql, [movie_id, assigned_theater_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Đã xoá phim khỏi rạp' });
    });
  });
};

// Sửa ngày chiếu và trạng thái hiển thị phim của rạp
exports.updateMovieForTheater = (req, res) => {
  const { movie_id } = req.params;
  const { start_date, end_date, is_visible } = req.body;
  const { assigned_theater_id } = req.admin;

  if (!start_date || !end_date || is_visible === undefined) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin: start_date, end_date, is_visible' });
  }

  const checkSql = `SELECT * FROM movies_theaters WHERE movie_id = ? AND theater_id = ?`;
  db.query(checkSql, [movie_id, assigned_theater_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Phim không tồn tại trong rạp' });

    const movieSql = `SELECT status, license_type, license_start, license_end FROM movies WHERE id = ?`;
    db.query(movieSql, [movie_id], (err2, movieRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (movieRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy phim' });

      const movie = movieRows[0];

      // CHỈ KIỂM TRA license_end NẾU KHÔNG PHẢI MUA ĐỨT
      if (movie.license_type !== 'permanent' && movie.license_end) {
        if (new Date(end_date) > new Date(movie.license_end)) {
          return res.status(400).json({ error: 'Ngày kết thúc chiếu không được vượt quá ngày hết bản quyền' });
        }
      }

      if (movie.status === 'coming_soon') {
        if (new Date(start_date) < new Date(movie.license_start)) {
          return res.status(400).json({ error: 'Ngày bắt đầu chiếu phải sau hoặc bằng ngày bản quyền bắt đầu cho phim coming_soon' });
        }
      } else if (movie.status !== 'special') {
        if (new Date(start_date) < new Date(movie.license_start)) {
          return res.status(400).json({ error: 'Ngày bắt đầu chiếu phải sau hoặc bằng ngày bản quyền bắt đầu' });
        }
      }

      const updateSql = `
        UPDATE movies_theaters 
        SET start_date = ?, end_date = ?, is_visible = ?
        WHERE movie_id = ? AND theater_id = ?
      `;
      db.query(updateSql, [start_date, end_date, is_visible, movie_id, assigned_theater_id], (err3, result) => {
        if (err3) return res.status(500).json({ error: err3.message });
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Không thể cập nhật, bản ghi không tồn tại' });
        }
        res.json({ message: 'Đã cập nhật thời gian chiếu phim cho rạp thành công' });
      });
    });
  });
};

// Lấy danh sách phòng của rạp
exports.getRoomsByTheater = (req, res) => {
  const { assigned_theater_id } = req.admin;

  const sql = 'SELECT id, room_number, capacity FROM rooms WHERE theater_id = ?';
  db.query(sql, [assigned_theater_id], (err, result) => {
    if (err) {
      console.error('Error fetching rooms:', err.message);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phòng nào cho rạp này' });
    }
    res.json(result);
  });
};

// Lưu giá vé
exports.createTicketPrice = (req, res) => {
  const { show_time_id, seat_type, price } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    const sql = `
      INSERT INTO ticket_prices (show_time_id, seat_type, price, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    db.query(sql, [show_time_id, seat_type, price], (err, result) => {
      if (err) {
        return db.rollback(() => res.status(500).json({ error: err.message }));
      }
      res.json({ message: 'Đã lưu giá vé thành công', id: result.insertId });
      db.commit((err2) => {
        if (err2) return db.rollback(() => res.status(500).json({ error: err2.message }));
      });
    });
  });
};