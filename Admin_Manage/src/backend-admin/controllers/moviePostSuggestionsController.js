// controllers/moviePostSuggestionsController.js
const db = require('../db');


exports.createSuggestion = async (req, res) => {
  console.log('=== CREATE SUGGESTION DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Admin ID:', req.admin?.id);
  
  const { 
    title, 
    genre, 
    poster, 
    duration, 
    description, 
    director,        // THÊM
    main_actors,     // THÊM
    language,        // THÊM
    release_date,    // THÊM
    license_type, 
    license_start, 
    license_end 
  } = req.body;
  
  const admin_id = req.admin?.id;

  // Validate required fields
  if (!title || !genre || !duration || !description || !license_type || 
      !director || !main_actors || !language || !release_date) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ 
      error: 'Thiếu thông tin: Tên phim, Thể loại, Thời lượng, Mô tả, Đạo diễn, Diễn viên, Ngôn ngữ, Ngày khởi chiếu, Loại bản quyền'
    });
  }

  // Validate license_start for temporary
  if (license_type === 'temporary' && !license_start) {
    console.log('❌ Missing license_start for temporary license');
    return res.status(400).json({ 
      error: 'Bản quyền tạm thời cần có ngày bắt đầu'
    });
  }

  // Validate license_end for temporary
  if (license_type === 'temporary' && !license_end) {
    console.log('❌ Missing license_end for temporary license');
    return res.status(400).json({ 
      error: 'Bản quyền tạm thời phải có ngày hết hạn'
    });
  }

  // For permanent license, use current date as license_start if not provided
  let finalLicenseStart = license_start;
  if (license_type === 'permanent' && !license_start) {
    finalLicenseStart = new Date().toISOString().split('T')[0];
    console.log('Using current date as license_start for permanent license:', finalLicenseStart);
  }

  // Validate dates
  try {
    if (finalLicenseStart) {
      const startDate = new Date(finalLicenseStart);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Ngày bắt đầu bản quyền không hợp lệ' });
      }
    }

    if (license_end) {
      const endDate = new Date(license_end);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Ngày kết thúc bản quyền không hợp lệ' });
      }
      
      if (finalLicenseStart && endDate <= new Date(finalLicenseStart)) {
        return res.status(400).json({ error: 'Ngày kết thúc phải sau ngày bắt đầu' });
      }
    }

    if (release_date) {
      const relDate = new Date(release_date);
      if (isNaN(relDate.getTime())) {
        return res.status(400).json({ error: 'Ngày khởi chiếu không hợp lệ' });
      }
    }
  } catch (err) {
    console.error('Date validation error:', err);
    return res.status(400).json({ error: 'Lỗi validate ngày tháng' });
  }

  if (!admin_id) {
    return res.status(401).json({ error: 'Không tìm thấy thông tin admin' });
  }

  try {
    const finalLicenseEnd = license_type === 'permanent' ? null : (license_end || null);
    
    const query = `
      INSERT INTO movie_suggestions 
      (title, genre, poster, duration, description, director, main_actors, language, release_date, 
       license_type, license_start, license_end, admin_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      title.trim(), 
      genre.trim(), 
      poster?.trim() || null, 
      parseInt(duration), 
      description.trim(), 
      director.trim(),       // THÊM
      main_actors.trim(),    // THÊM
      language.trim(),       // THÊM
      release_date,          // THÊM
      license_type, 
      finalLicenseStart, 
      finalLicenseEnd, 
      admin_id
    ];
    
    console.log('SQL Query:', query);
    console.log('Values:', values);

    await new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) {
          console.error('❌ Database error:', err);
          reject(err);
        } else {
          console.log('✅ Database result:', result);
          resolve(result);
        }
      });
    });

    console.log('✅ Suggestion created successfully');
    res.status(201).json({ message: 'Tạo đề xuất phim thành công!' });
    
  } catch (err) {
    console.error('❌ Error creating suggestion:', err);
    
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Lỗi: Bảng movie_suggestions chưa được tạo trong database' });
    }
    
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ error: 'Lỗi: Cấu trúc bảng không đúng - ' + err.sqlMessage });
    }
    
    res.status(500).json({ 
      error: 'Lỗi tạo đề xuất phim', 
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Upload poster cho suggestion
exports.uploadSuggestionPoster = (req, res) => {
  console.log('Upload suggestion poster request:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được upload' });
  }
  
  const filename = req.file.filename;
  const posterUrl = `/uploads/suggestions/${filename}`;
  const fullUrl = `http://localhost:5001${posterUrl}`;
  
  console.log('✅ Upload suggestion poster thành công:', fullUrl);
  
  res.json({ 
    message: 'Upload poster thành công',
    poster_url: fullUrl,
    filename: filename,
    path: posterUrl
  });
};