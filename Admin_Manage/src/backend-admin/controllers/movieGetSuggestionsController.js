const db = require('../db');
const fs = require('fs');
const path = require('path');

// Lấy danh sách yêu cầu (super admin xem tất cả, rạp chỉ xem của mình)
exports.getSuggestions = (req, res) => {
  const sql = req.admin.role === 'super_admin'
    ? `SELECT ms.*, 
              a.full_name AS admin_name,
              a.username AS admin_username,
              t.name AS theater_name,
              t.address AS theater_address
       FROM movie_suggestions ms 
       JOIN admin_accounts a ON ms.admin_id = a.id 
       LEFT JOIN theaters t ON a.assigned_theater_id = t.id
       ORDER BY ms.created_at DESC`
    : `SELECT ms.*,
              a.full_name AS admin_name,
              a.username AS admin_username,
              t.name AS theater_name,
              t.address AS theater_address
       FROM movie_suggestions ms
       JOIN admin_accounts a ON ms.admin_id = a.id
       LEFT JOIN theaters t ON a.assigned_theater_id = t.id
       WHERE ms.admin_id = ? 
       ORDER BY ms.created_at DESC`;

  db.query(sql, req.admin.role === 'super_admin' ? [] : [req.admin.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// Duyệt yêu cầu - COPY ẢNH VÀ THÊM VÀO MOVIES
exports.approveSuggestion = (req, res) => {
  const { id } = req.params;
  const { scope } = req.body; // 'requester' hoặc 'all'
  
  console.log('=== APPROVE SUGGESTION ===');
  console.log('ID:', id);
  console.log('Scope:', scope);
  console.log('Admin:', req.admin);

  const getSql = `SELECT * FROM movie_suggestions WHERE id = ?`;
  
  db.query(getSql, [id], (err, rows) => {
    if (err) {
      console.error('❌ Database error in getSql:', err);
      return res.status(500).json({ error: 'Lỗi query database: ' + err.message });
    }
    
    if (rows.length === 0) {
      console.error('❌ Suggestion not found with ID:', id);
      return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    }

    const suggestion = rows[0];
    console.log('✅ Found suggestion:', suggestion);

    if (suggestion.status !== 'pending') {
      return res.status(400).json({ error: 'Đề xuất này đã được xử lý rồi' });
    }

    // Copy ảnh
    let finalPosterUrl = suggestion.poster;
    if (suggestion.poster && suggestion.poster.includes('/uploads/suggestions/')) {
      try {
        const filename = suggestion.poster.split('/uploads/suggestions/')[1];
        const oldPath = path.join(__dirname, '../uploads/suggestions/', filename);
        const newFilename = 'approved-' + Date.now() + '-' + filename;
        const newPath = path.join(__dirname, '../uploads/movies/', newFilename);
        
        if (fs.existsSync(oldPath)) {
          fs.copyFileSync(oldPath, newPath);
          finalPosterUrl = `http://localhost:5001/uploads/movies/${newFilename}`;
          fs.unlinkSync(oldPath);
          console.log('✅ Copy và xóa poster thành công');
        }
      } catch (copyError) {
        console.error('❌ Lỗi copy poster:', copyError);
      }
    }

    // Xác định scope và theater_id
    const scopeValue = scope === 'all' ? 'global' : 'restricted';
    let restrictedTheaterId = null;

    // Nếu scope = 'requester', lấy theater_id của admin gửi đề xuất
    if (scope === 'requester') {
      const getTheaterSql = `SELECT assigned_theater_id FROM admin_accounts WHERE id = ?`;
      db.query(getTheaterSql, [suggestion.admin_id], (errTheater, theaterRows) => {
        if (errTheater) {
          console.error('❌ Lỗi lấy theater_id:', errTheater);
          restrictedTheaterId = null;
        } else if (theaterRows.length > 0) {
          restrictedTheaterId = theaterRows[0].assigned_theater_id;
        }

        // Tiếp tục insert movie
        insertMovieWithScope(restrictedTheaterId);
      });
    } else {
      // scope = 'all', insert ngay
      insertMovieWithScope(null);
    }

    // Hàm helper để insert movie
    function insertMovieWithScope(theaterId) {
      // Insert vào movies với scope và restricted_to_theater_id
      const insertSql = `
        INSERT INTO movies 
        (title, genre, poster, duration, description, director, main_actors, language, 
         status, start_date, end_date, is_visible, license_type, license_start, license_end,
         scope, restricted_to_theater_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'now_showing', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        suggestion.title, 
        suggestion.genre, 
        finalPosterUrl, 
        suggestion.duration, 
        suggestion.description,
        suggestion.director,
        suggestion.main_actors,
        suggestion.language,
        suggestion.license_type, 
        suggestion.license_start, 
        suggestion.license_end,
        scopeValue,           // scope
        theaterId             // restricted_to_theater_id
      ];
      
      db.query(insertSql, values, (err3, result) => {
        if (err3) {
          console.error('❌ Lỗi insert movie:', err3);
          return res.status(500).json({ error: 'Lỗi thêm phim: ' + err3.message });
        }

        const movieId = result.insertId;
        console.log('✅ Insert movie thành công, ID:', movieId);
        console.log('Scope:', scopeValue, 'Theater ID:', theaterId);

        // XỬ LÝ PHẠM VI
        if (scope === 'all') {
          // Thêm cho tất cả các rạp
          const getAllTheatersSql = `SELECT id FROM theaters`;
          
          db.query(getAllTheatersSql, (errTheaters, theaters) => {
            if (errTheaters) {
              console.error('❌ Lỗi lấy danh sách rạp:', errTheaters);
              return res.status(500).json({ error: 'Lỗi lấy danh sách rạp' });
            }

            if (theaters.length === 0) {
              // Không có rạp nào, chỉ update status
              updateSuggestionStatus(id, res);
              return;
            }

            // Insert vào movies_theaters cho tất cả rạp
            const insertTheaterPromises = theaters.map(theater => {
              return new Promise((resolve, reject) => {
                const insertTheaterSql = `
                  INSERT INTO movies_theaters (movie_id, theater_id, start_date, end_date, is_visible)
                  VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1)
                `;
                db.query(insertTheaterSql, [movieId, theater.id], (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            });

            Promise.all(insertTheaterPromises)
              .then(() => {
                console.log('✅ Đã thêm phim vào tất cả các rạp');
                updateSuggestionStatus(id, res);
              })
              .catch(err => {
                console.error('❌ Lỗi thêm phim vào rạp:', err);
                return res.status(500).json({ error: 'Lỗi thêm phim vào rạp' });
              });
          });

        } else {
          // scope === 'requester' - Chỉ thêm cho rạp yêu cầu
          if (!theaterId) {
            // Admin không có theater được gán, chỉ update status
            console.log('⚠️ Admin không có theater được gán');
            updateSuggestionStatus(id, res);
            return;
          }

          // Insert vào movies_theaters cho rạp của admin
          const insertTheaterSql = `
            INSERT INTO movies_theaters (movie_id, theater_id, start_date, end_date, is_visible)
            VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1)
          `;
          
          db.query(insertTheaterSql, [movieId, theaterId], (errTheater) => {
            if (errTheater) {
              console.error('❌ Lỗi thêm phim vào rạp:', errTheater);
              return res.status(500).json({ error: 'Lỗi thêm phim vào rạp' });
            }
            
            console.log('✅ Đã thêm phim vào rạp yêu cầu');
            updateSuggestionStatus(id, res);
          });
        }
      });
    }
  });
};

// Helper function để update status
function updateSuggestionStatus(id, res) {
  const updateSql = `UPDATE movie_suggestions SET status = 'approved' WHERE id = ?`;
  db.query(updateSql, [id], (err4) => {
    if (err4) {
      console.error('❌ Lỗi update status:', err4);
      return res.status(500).json({ error: 'Lỗi update status: ' + err4.message });
    }
    console.log('✅ Approve hoàn tất');
    res.json({ message: 'Phê duyệt và thêm phim thành công' });
  });
}


// Reject function
exports.rejectSuggestion = (req, res) => {
  const { id } = req.params;
  console.log('=== REJECT SUGGESTION ===');
  console.log('ID:', id);

  const getSql = `SELECT poster, status FROM movie_suggestions WHERE id = ?`;
  
  db.query(getSql, [id], (err, rows) => {
    if (err) {
      console.error('❌ Lỗi query:', err);
      return res.status(500).json({ error: 'Lỗi query: ' + err.message });
    }
    
    if (rows.length === 0) {
      console.error('❌ Không tìm thấy suggestion với ID:', id);
      return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    }

    const { poster, status } = rows[0];
    
    // Kiểm tra status hiện tại
    if (status !== 'pending') {
      return res.status(400).json({ error: 'Đề xuất này đã được xử lý rồi' });
    }

    console.log('Poster URL:', poster);

    // Xóa file
    if (poster && poster.includes('/uploads/suggestions/')) {
      try {
        const filename = poster.split('/uploads/suggestions/')[1];
        const filePath = path.join(__dirname, '../uploads/suggestions/', filename);
        
        console.log('File path to delete:', filePath);
        console.log('File exists:', fs.existsSync(filePath));
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Đã xóa file:', filename);
        } else {
          console.log('⚠️ File không tồn tại:', filePath);
        }
      } catch (deleteError) {
        console.error('❌ Lỗi xóa file:', deleteError);
        // Không return lỗi, vẫn tiếp tục update status
      }
    }

    // Update status
    const updateSql = `UPDATE movie_suggestions SET status = 'rejected' WHERE id = ?`;
    db.query(updateSql, [id], (err2) => {
      if (err2) {
        console.error('❌ Lỗi update:', err2);
        return res.status(500).json({ error: 'Lỗi update: ' + err2.message });
      }
      console.log('✅ Reject hoàn tất');
      res.json({ message: 'Đã từ chối và xóa poster' });
    });
  });
};