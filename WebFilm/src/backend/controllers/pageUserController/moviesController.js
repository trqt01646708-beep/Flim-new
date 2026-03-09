const db = require('../../db');

exports.getMovies = (req, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT * FROM movies 
    WHERE is_visible = 1 
  `;
  
  let params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  // CHỈ lọc end_date khi KHÔNG có status filter
  // hoặc khi status = 'now_showing'
  if (!status || status === 'now_showing') {
    sql += ' AND (end_date IS NULL OR end_date >= CURDATE())';
  }
  
  sql += ' ORDER BY id DESC';

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error fetching movies:', err);
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


exports.getMovieById = (req, res) => {
  const movieId = req.params.id;
  
  const sql = `
    SELECT * FROM movies 
    WHERE id = ? AND is_visible = 1 
    AND (end_date IS NULL OR end_date >= CURDATE())
  `;

  db.query(sql, [movieId], (err, result) => {
    if (err) {
      console.error('Error fetching movie by ID:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phim hoặc phim không khả dụng' });
    }
    
    // Chuyển đổi poster URL và format dữ liệu
    const movie = {
      ...result[0],
      poster: convertPosterUrl(result[0].poster),
      // Đảm bảo các trường mới có giá trị
      director: result[0].director || 'Chưa cập nhật',
      main_actors: result[0].main_actors || 'Chưa cập nhật',
      language: result[0].language || 'Tiếng Việt',
      // Format main_actors thành array nếu cần
      main_actors_array: result[0].main_actors ? result[0].main_actors.split(',').map(actor => actor.trim()) : []
    };
    
    console.log(`Trả về thông tin phim ID: ${movieId}`);
    res.json(movie);
  });
};
// HELPER FUNCTION: Chuyển đổi poster URL (giữ nguyên)
function convertPosterUrl(posterUrl) {
  if (!posterUrl) return null;
  
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


// THÊM: Function để lấy phim theo theater
exports.getMoviesByTheater = (req, res) => {
  const { theaterId } = req.params;
  
  const sql = `
    SELECT DISTINCT m.* 
    FROM movies m
    JOIN movies_theaters mt ON m.id = mt.movie_id
    WHERE mt.theater_id = ? 
    AND mt.is_visible = 1 
    AND m.is_visible = 1
    AND mt.start_date <= CURDATE() 
    AND mt.end_date >= CURDATE()
    ORDER BY m.title
  `;

  db.query(sql, [theaterId], (err, result) => {
    if (err) {
      console.error('Error fetching movies by theater:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const moviesWithProxyUrls = result.map(movie => ({
      ...movie,
      poster: convertPosterUrl(movie.poster),
      director: movie.director || 'Chưa cập nhật',
      main_actors: movie.main_actors || 'Chưa cập nhật',
      language: movie.language || 'Tiếng Việt'
    }));
    
    res.json(moviesWithProxyUrls);
  });
};

// THÊM: Function để search phim
exports.searchMovies = (req, res) => {
  const { q } = req.query; // ?q=search_term
  
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Từ khóa tìm kiếm không được để trống' });
  }
  
  const searchTerm = `%${q.trim()}%`;
  const sql = `
    SELECT * FROM movies 
    WHERE is_visible = 1 
    AND (end_date IS NULL OR end_date >= CURDATE())
    AND (title LIKE ? OR genre LIKE ? OR description LIKE ?)
    ORDER BY 
      CASE 
        WHEN title LIKE ? THEN 1
        WHEN genre LIKE ? THEN 2  
        ELSE 3
      END,
      title
  `;

  db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, result) => {
    if (err) {
      console.error('Error searching movies:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const moviesWithProxyUrls = result.map(movie => ({
      ...movie,
      poster: convertPosterUrl(movie.poster)
    }));
    
    console.log(`Tìm được ${moviesWithProxyUrls.length} phim với từ khóa: ${q}`);
    res.json(moviesWithProxyUrls);
  });
};

// HELPER FUNCTION: Chuyển đổi poster URL
function convertPosterUrl(posterUrl) {
  console.log('Original poster URL:', posterUrl);
  
  if (!posterUrl) return null;
  
  if (posterUrl.includes('localhost:5001')) {
    const converted = posterUrl.replace('http://localhost:5001', 'http://localhost:5000');
    console.log('Converted URL:', converted);
    return converted;
  }
  
  if (posterUrl.startsWith('http')) {
    console.log('External URL kept:', posterUrl);
    return posterUrl;
  }
  
  if (posterUrl.startsWith('/uploads')) {
    const converted = `http://localhost:5000${posterUrl}`;
    console.log('Relative path converted:', converted);
    return converted;
  }
  
  console.log('Fallback URL:', posterUrl);
  return posterUrl;
}

// THÊM: Health check cho movies API
exports.healthCheck = (req, res) => {
  const sql = 'SELECT COUNT(*) as total, COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible FROM movies';
  
  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: err.message 
      });
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      data: {
        total_movies: result[0].total,
        visible_movies: result[0].visible,
        server: 'User Server (Port 5000)'
      }
    });
  });
};