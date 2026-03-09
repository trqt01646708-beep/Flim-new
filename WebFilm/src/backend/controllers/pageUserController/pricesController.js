const db = require('../../db');

exports.getBanners = (req, res) => {
  const { theater_id } = req.query;

  if (!theater_id) {
    return res.status(400).json({ error: 'theater_id là bắt buộc' });
  }

  const sql = `
    SELECT * FROM ticket_price_banners
    WHERE theater_id = ? AND is_active = 1
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(sql, [theater_id], (err, result) => {
    if (err) {
      console.error('Database error in getBanners:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Xử lý URL để đảm bảo tương thích
    const processedResult = result.map(banner => {
      let processedImageUrl = banner.image_url;
      
      console.log('Original image_url:', banner.image_url);
      
      // Kiểm tra loại URL
      if (processedImageUrl) {
        if (processedImageUrl.includes('localhost:5001')) {
          // URL từ admin server local - chuyển sang user server proxy
          processedImageUrl = processedImageUrl.replace('localhost:5001', 'localhost:5000');
          console.log('Converted admin URL to user proxy:', processedImageUrl);
        } else if (processedImageUrl.startsWith('http')) {
          // External URL - giữ nguyên, để frontend xử lý
          console.log('External URL detected, keeping original:', processedImageUrl);
        } else if (processedImageUrl.startsWith('/uploads/')) {
          // Relative path - chuyển thành full URL với user server
          processedImageUrl = `http://localhost:5000${processedImageUrl}`;
          console.log('Converted relative path to full URL:', processedImageUrl);
        }
      }
      
      return {
        ...banner,
        image_url: processedImageUrl,
        is_external: processedImageUrl && processedImageUrl.startsWith('http') && !processedImageUrl.includes('localhost')
      };
    });
    
    console.log(`Found ${processedResult.length} banner(s) for theater_id: ${theater_id}`);
    res.json(processedResult);
  });
};

// THÊM: Endpoint mới để lấy banner mặc định từ Hà Nội
exports.getDefaultBanner = (req, res) => {
  // Tìm rạp ở Hà Nội (province_id = 1 thường là Hà Nội, bạn có thể điều chỉnh)
  const findHanoiTheaterSql = `
    SELECT t.id FROM theaters t
    JOIN provinces p ON t.province_id = p.id
    WHERE p.name LIKE '%Hà Nội%' OR p.name LIKE '%Ha Noi%' OR t.province_id = 1
    LIMIT 1
  `;
  
  db.query(findHanoiTheaterSql, (err, theaterResult) => {
    if (err) {
      console.error('Error finding Hanoi theater:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (theaterResult.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy rạp ở Hà Nội' });
    }
    
    const hanoiTheaterId = theaterResult[0].id;
    console.log('Found Hanoi theater ID:', hanoiTheaterId);
    
    // Lấy banner của rạp Hà Nội
    const bannerSql = `
      SELECT tpb.*, t.name as theater_name 
      FROM ticket_price_banners tpb
      JOIN theaters t ON tpb.theater_id = t.id
      WHERE tpb.theater_id = ? AND tpb.is_active = 1
      ORDER BY tpb.id DESC
      LIMIT 1
    `;
    
    db.query(bannerSql, [hanoiTheaterId], (err2, bannerResult) => {
      if (err2) {
        console.error('Error getting Hanoi banner:', err2);
        return res.status(500).json({ error: err2.message });
      }
      
      if (bannerResult.length === 0) {
        return res.status(404).json({ error: 'Rạp Hà Nội chưa có banner' });
      }
      
      // Xử lý URL như ở endpoint chính
      const processedResult = bannerResult.map(banner => {
        let processedImageUrl = banner.image_url;
        
        if (processedImageUrl) {
          if (processedImageUrl.includes('localhost:5001')) {
            processedImageUrl = processedImageUrl.replace('localhost:5001', 'localhost:5000');
          } else if (processedImageUrl.startsWith('/uploads/')) {
            processedImageUrl = `http://localhost:5000${processedImageUrl}`;
          }
        }
        
        return {
          ...banner,
          image_url: processedImageUrl,
          is_external: processedImageUrl && processedImageUrl.startsWith('http') && !processedImageUrl.includes('localhost'),
          is_default: true // Đánh dấu đây là banner mặc định
        };
      });
      
      console.log('Default Hanoi banner found:', processedResult[0]);
      res.json(processedResult);
    });
  });
};