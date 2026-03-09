const db = require('../../db');

// Lấy suất chiếu theo phim, rạp và ngày
exports.getShowTimesByMovieTheaterDate = (req, res) => {
  const { movie_id, theater_id, date } = req.query;

  if (!movie_id || !theater_id || !date) {
    return res.status(400).json({ message: 'Thiếu tham số movie_id, theater_id hoặc date' });
  }

 const sql = `
  SELECT 
    st.id, st.show_time, r.room_number,
    (
      SELECT COUNT(*)
      FROM seats s
      WHERE s.room_id = st.room_id AND NOT EXISTS (
        SELECT 1 FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.id
        WHERE bs.seat_id = s.id 
          AND b.show_time_id = st.id
          AND b.status IN ('held', 'confirmed')
          AND (b.expire_at IS NULL OR b.expire_at > NOW())
      )
    ) AS available_seats
  FROM show_times st
  JOIN rooms r ON st.room_id = r.id
  WHERE st.movie_id = ? AND st.theater_id = ? AND DATE(st.show_time) = ?
  ORDER BY st.show_time ASC
`;


  db.query(sql, [movie_id, theater_id, date], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn suất chiếu', error: err });
    res.json(result);
  });
};

// Lấy danh sách rạp có phim
exports.getTheatersByMovie = (req, res) => {
  const { movieId } = req.params;
  if (!movieId) return res.status(400).json({ error: 'Thiếu movieId' });

  const today = new Date();
  const sixDaysLater = new Date();
  sixDaysLater.setDate(today.getDate() + 6);

  const sql = `
    SELECT DISTINCT t.id, t.name, t.address, t.hotline
    FROM show_times st
    JOIN theaters t ON st.theater_id = t.id
    WHERE st.movie_id = ?
      AND st.show_time >= ? AND st.show_time <= ?
    ORDER BY t.name
  `;

  db.query(sql, [movieId, today, sixDaysLater], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};




// showtimesController.js
exports.getTheatersWithShowtimesByMovie = (req, res) => {
  const { movie_id } = req.query;

  if (!movie_id) return res.status(400).json({ error: 'Thiếu movie_id' });

  const sql = `
    SELECT DISTINCT t.id, t.name, t.address, t.province_id
    FROM show_times st
    JOIN theaters t ON st.theater_id = t.id
    WHERE st.movie_id = ?
      AND st.show_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 6 DAY)
  `;

  db.query(sql, [movie_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};


// Lấy thông tin chi tiết phim
exports.getMovieDetail = (req, res) => {
  const movieId = req.params.movieId;

  const sql = 'SELECT * FROM movies WHERE id = ?';

  db.query(sql, [movieId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn phim', error: err });
    if (result.length === 0) return res.status(404).json({ message: 'Không tìm thấy phim' });
    res.json(result[0]);
  });
};



// kiem tra xuat chieu trong 7 ngày 

exports.hasUpcomingShowtimes = (req, res) => {
  const { movie_id } = req.query;
  if (!movie_id) return res.status(400).json({ error: 'Thiếu movie_id' });

  const today = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);

  const sql = `
    SELECT 1 FROM show_times 
    WHERE movie_id = ? AND show_time BETWEEN ? AND ? 
    LIMIT 1
  `;

  db.query(sql, [movie_id, today, sevenDaysLater], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ hasShowtime: result.length > 0 });
  });
};
