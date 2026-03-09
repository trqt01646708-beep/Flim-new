const db = require('../../db');

// Lấy danh sách rạp (tất cả hoặc theo tỉnh)
exports.getTheaters = (req, res) => {
  const { province_id } = req.query;

  let sql = 'SELECT * FROM theaters';
  const values = [];

  if (province_id) {
    sql += ' WHERE province_id = ?';
    values.push(province_id);
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error fetching theaters:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// THÊM: Lấy chi tiết một rạp phim theo ID
exports.getTheaterById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      t.*,
      p.name as province_name
    FROM theaters t
    LEFT JOIN provinces p ON t.province_id = p.id
    WHERE t.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error fetching theater by ID:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy rạp phim' });
    }
    
    // Chuyển đổi banner URL nếu cần
    const theater = {
      ...result[0],
      banner_image: convertImageUrl(result[0].banner_image),
    };
    
    res.json(theater);
  });
};

// Lấy rạp theo phim
exports.getTheatersByMovie = (req, res) => {
  const movieId = req.params.movieId;
  
  const sql = `
    SELECT DISTINCT t.* 
    FROM show_times st 
    JOIN theaters t ON st.theater_id = t.id 
    WHERE st.movie_id = ?
  `;
  
  db.query(sql, [movieId], (err, result) => {
    if (err) {
      console.error('Error fetching theaters by movie:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// Lấy rạp theo tỉnh
exports.getTheatersByProvince = (req, res) => {
  const { provinceId } = req.params;

  const sql = `SELECT * FROM theaters WHERE province_id = ?`;
  
  db.query(sql, [provinceId], (err, result) => {
    if (err) {
      console.error('Error fetching theaters by province:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// THÊM MỚI: Lấy phim có ca chiếu trong 6 ngày tới theo rạp


// Helper function để chuyển đổi URL
function convertImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  if (imageUrl.includes('localhost:5001')) {
    return imageUrl.replace('http://localhost:5001', 'http://localhost:5000');
  }
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/uploads')) {
    return `http://localhost:5000${imageUrl}`;
  }
  
  return imageUrl;
}

// Các endpoints khác giữ nguyên...

// SỬA endpoint này
exports.getMoviesByTheaterWithUpcomingShowtimes = (req, res) => {
  const { theaterId } = req.params;
  
  const sql = `
    SELECT DISTINCT m.* 
    FROM movies m
    INNER JOIN show_times st ON m.id = st.movie_id
    WHERE st.theater_id = ?
      AND st.show_time >= NOW()
      AND st.show_time <= DATE_ADD(NOW(), INTERVAL 6 DAY)
      AND m.is_visible = 1
    ORDER BY m.title
  `;
  
  db.query(sql, [theaterId], (err, result) => {
    if (err) {
      console.error('Error fetching movies with upcoming showtimes:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // CONVERT poster URLs
    const moviesWithProxyUrls = result.map(movie => ({
      ...movie,
      poster: convertImageUrl(movie.poster),
      director: movie.director || 'Chưa cập nhật',
      main_actors: movie.main_actors || 'Chưa cập nhật',
      language: movie.language || 'Tiếng Việt'
    }));
    
    res.json(moviesWithProxyUrls);
  });
};