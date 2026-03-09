const db = require('../../db');

// Lấy theater intro banners theo theater_id (cho user client)
exports.getTheaterIntroBanners = (req, res) => {
  const { theater_id } = req.query;

  let sql = `
    SELECT id, theater_id, image_url
    FROM theater_intro_banners 
    WHERE is_active = 1
  `;
  
  let params = [];

  // Nếu có theater_id thì lọc theo rạp đó
  if (theater_id) {
    sql += ` AND theater_id = ?`;
    params.push(theater_id);
  }

  sql += ` ORDER BY created_at DESC`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Lỗi truy vấn theater_intro_banners:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    }

    // Convert image URLs cho user server
    const bannersWithProxyUrls = result.map(banner => ({
      ...banner,
      image_url: convertImageUrl(banner.image_url)
    }));

    res.json(bannersWithProxyUrls);
  });
};

// Helper function để convert image URL
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