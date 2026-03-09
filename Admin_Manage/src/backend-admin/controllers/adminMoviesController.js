const db = require('../db');
const fs = require('fs'); 
const path = require('path');


// ✅ GET - Lấy danh sách phim (super_admin thấy tất cả, theater_admin thấy theo rạp)
exports.getAllMovies = (req, res) => {
  const { role, assigned_theater_id } = req.admin;

  if (role === 'super_admin') {
    const sql = 'SELECT * FROM movies ORDER BY id DESC';
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  } else {
    const sql = `
      SELECT m.* FROM movies m
      JOIN movies_theaters mt ON m.id = mt.movie_id
      WHERE mt.theater_id = ?
      ORDER BY m.id DESC
    `;
    db.query(sql, [assigned_theater_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  }
};
// API upload poster
exports.uploadPoster = (req, res) => {
  console.log('📤 Upload poster request:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được upload' });
  }
  
  const filename = req.file.filename;
  const posterUrl = `/uploads/movies/${filename}`;
  const fullUrl = `http://localhost:5001${posterUrl}`;
  
  console.log('✅ Upload thành công:', fullUrl);
  
  res.json({ 
    message: 'Upload poster thành công',
    poster_url: fullUrl,
    filename: filename,
    path: posterUrl
  });
};
const deleteOldPosterFile = (oldPosterUrl) => {
  if (!oldPosterUrl || !oldPosterUrl.includes('/uploads/movies/')) return;
  
  try {
    const filename = oldPosterUrl.split('/uploads/movies/')[1];
    const filePath = path.join(__dirname, '../uploads/movies/', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Đã xóa file cũ:', filename);
    }
  } catch (err) {
    console.error('Lỗi xóa file cũ:', err.message);
  }
};

// ✅ POST - Thêm phim mới (super_admin only)
exports.addMovie = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });

  const {
    title, genre, poster_path, duration, description, director, main_actors, language,
    status, start_date, end_date, is_visible, license_type, license_start, license_end
  } = req.body;

  console.log('Thêm phim với dữ liệu:', req.body);

  // Convert relative path thành full URL cho database
  const poster_url = poster_path ? `http://localhost:5001${poster_path}` : null;

  const sql = `
    INSERT INTO movies (title, genre, poster, duration, description, director, main_actors, language,
      status, start_date, end_date, is_visible, license_type, license_start, license_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title, genre, poster_url, duration, description, director, main_actors, language,
    status, start_date, end_date, is_visible, license_type,
    license_start, // Luôn có license_start
    license_type === 'period' ? license_end : null // Chỉ có license_end khi là period
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Lỗi thêm phim:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Thêm phim thành công, ID:', result.insertId);
    res.json({ message: 'Thêm phim thành công', movie_id: result.insertId });
  });
};

// ✅ PUT - Sửa thông tin phim (super_admin only)
exports.editMovie = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });

  const movieId = req.params.id;
  const {
    title, genre, poster_path, duration, description, director, main_actors, language,
    status, start_date, end_date, is_visible, license_type, license_start, license_end
  } = req.body;

  // Chỉ update poster nếu có poster_path mới
  const poster_url = poster_path ? `http://localhost:5001${poster_path}` : undefined;

  let sql = `
    UPDATE movies SET title = ?, genre = ?, duration = ?, description = ?, director = ?, 
      main_actors = ?, language = ?, status = ?, start_date = ?, end_date = ?,
      is_visible = ?, license_type = ?, license_start = ?, license_end = ?
  `;
  
  let values = [
    title, genre, duration, description, director, main_actors, language,
    status, start_date, end_date, is_visible, license_type,
    license_start, // Luôn có license_start
    license_type === 'period' ? license_end : null // Chỉ có license_end khi là period
  ];

  // Nếu có poster mới thì update
  if (poster_url) {
    sql = `
      UPDATE movies SET title = ?, genre = ?, poster = ?, duration = ?, description = ?, 
        director = ?, main_actors = ?, language = ?, status = ?, start_date = ?, end_date = ?,
        is_visible = ?, license_type = ?, license_start = ?, license_end = ?
    `;
    values = [
      title, genre, poster_url, duration, description, director, main_actors, language,
      status, start_date, end_date, is_visible, license_type,
      license_start,
      license_type === 'period' ? license_end : null
    ];
  }

  sql += ` WHERE id = ?`;
  values.push(movieId);

  db.query(sql, values, (err) => {
    if (err) {
      console.error('Lỗi cập nhật phim:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Cập nhật phim thành công');
    res.json({ message: 'Cập nhật phim thành công' });
  });
};

// ✅ DELETE - Xoá phim nếu không còn suất chiếu (super_admin only)
exports.deleteMovie = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });

  const movieId = req.params.id;

  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ error: 'Lỗi bắt đầu transaction: ' + err.message });
    }

    const checkShowtimes = `
      SELECT DISTINCT t.name AS theater_name
      FROM show_times st
      JOIN theaters t ON st.theater_id = t.id
      WHERE st.movie_id = ? AND st.show_time > NOW()
    `;

    db.query(checkShowtimes, [movieId], (err, result) => {
      if (err) {
        console.error('Error checking showtimes:', err);
        return db.rollback(() => res.status(500).json({ error: 'Lỗi kiểm tra suất chiếu: ' + err.message }));
      }

      if (result.length > 0) {
        const theaters = result.map(r => r.theater_name);
        return db.rollback(() => res.status(400).json({
          error: 'Không thể xoá phim vì còn suất chiếu sắp tới ở các rạp sau:',
          theaters
        }));
      }

      db.query('DELETE FROM show_times WHERE movie_id = ?', [movieId], (err1) => {
        if (err1) {
          console.error('Error deleting showtimes:', err1);
          return db.rollback(() => res.status(500).json({ error: 'Lỗi xóa suất chiếu: ' + err1.message }));
        }

        db.query('DELETE FROM movies_theaters WHERE movie_id = ?', [movieId], (err2) => {
          if (err2) {
            console.error('Error deleting links:', err2);
            return db.rollback(() => res.status(500).json({ error: 'Lỗi xóa liên kết: ' + err2.message }));
          }

          db.query('DELETE FROM movies WHERE id = ?', [movieId], (err3) => {
            if (err3) {
              console.error('Error deleting movie:', err3);
              return db.rollback(() => res.status(500).json({ error: 'Lỗi xóa phim: ' + err3.message }));
            }

            db.commit((err4) => {
              if (err4) {
                console.error('Commit error:', err4);
                return db.rollback(() => res.status(500).json({ error: 'Lỗi commit transaction: ' + err4.message }));
              }
              res.json({ message: 'Đã xoá phim và gỡ khỏi các rạp' });
            });
          });
        });
      });
    });
  });
};