const db = require('../../db');

// Helper function ở đầu file
function convertPosterUrl(posterUrl) {
  if (!posterUrl) return null;
  
  // Convert localhost:5001 sang localhost:5000
  if (posterUrl.includes('localhost:5001')) {
    return posterUrl.replace('http://localhost:5001', 'http://localhost:5000');
  }
  
  if (posterUrl.startsWith('http')) {
    return posterUrl;
  }
  
  if (posterUrl.startsWith('/uploads')) {
    return `http://localhost:5000${posterUrl}`;
  }
  
  return posterUrl;
}

// Áp dụng cho TẤT CẢ endpoints
exports.getFilteredFilms = (req, res) => {
  const { status, province_id, theater_id } = req.query;

  let sql;
  const values = [];

  // Nếu có province hoặc theater filter → JOIN với show_times
  if (province_id || theater_id) {
    sql = `
      SELECT DISTINCT m.*
      FROM movies m
      JOIN show_times st ON m.id = st.movie_id
      JOIN theaters t ON st.theater_id = t.id
      JOIN provinces p ON t.province_id = p.id
      WHERE m.is_visible = 1
    `;

    const conditions = [];
    if (status) {
      conditions.push("m.status = ?");
      values.push(status);
    }
    if (province_id) {
      conditions.push("p.id = ?");
      values.push(province_id);
    }
    if (theater_id) {
      conditions.push("t.id = ?");
      values.push(theater_id);
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ");
    }
    
    sql += " ORDER BY m.title ASC"; // Có alias m
  } else {
    // KHÔNG JOIN - lấy trực tiếp từ bảng movies
    sql = `SELECT * FROM movies WHERE is_visible = 1`;
    
    if (status) {
      sql += ' AND status = ?';
      values.push(status);
    }
    
    sql += " ORDER BY title ASC"; // KHÔNG có alias
  }

  console.log('SQL Query:', sql);
  console.log('Values:', values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Lỗi SQL khi lọc phim:", err);
      return res.status(500).json({ error: err.message });
    }
    
    const moviesWithProxyUrls = result.map(movie => ({
      ...movie,
      poster: convertPosterUrl(movie.poster),
      director: movie.director || 'Chưa cập nhật',
      main_actors: movie.main_actors || 'Chưa cập nhật',
      language: movie.language || 'Tiếng Việt'
    }));
    
    console.log(`Trả về ${moviesWithProxyUrls.length} phim với status: ${status || 'all'}`);
    res.json(moviesWithProxyUrls);
  });
};

exports.getFilmById = (req, res) => {
  const filmId = req.params.id;
  const sql = 'SELECT * FROM movies WHERE id = ? AND is_visible = 1';
  
  db.query(sql, [filmId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ message: 'Phim không tồn tại' });
    
    const movie = {
      ...result[0],
      poster: convertPosterUrl(result[0].poster), // CONVERT
      director: result[0].director || 'Chưa cập nhật',
      main_actors: result[0].main_actors || 'Chưa cập nhật',
      language: result[0].language || 'Tiếng Việt'
    };
    
    res.json(movie);
  });
};

exports.getFilmsWithShowtimes = (req, res) => {
  const today = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);

  const sql = `
    SELECT DISTINCT m.*
    FROM movies m
    JOIN show_times st ON m.id = st.movie_id
    WHERE st.show_time BETWEEN ? AND ?
    AND m.status = 'now_showing'
    AND m.is_visible = 1
  `;

  db.query(sql, [today, sevenDaysLater], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const moviesWithProxyUrls = result.map(movie => ({
      ...movie,
      poster: convertPosterUrl(movie.poster), // CONVERT
      director: movie.director || 'Chưa cập nhật',
      main_actors: movie.main_actors || 'Chưa cập nhật',
      language: movie.language || 'Tiếng Việt'
    }));
    
    res.json(moviesWithProxyUrls);
  });
};