const db = require('../../db'); 

// GET tất cả quảng cáo/banner (cập nhật để hỗ trợ filter theo rạp)
exports.getAllAds = (req, res) => {
  const { theater_id } = req.query;

  let sql = `
    SELECT id, title, image_url, link 
    FROM adv 
    WHERE is_active = 1 AND (theater_id IS NULL`;
  
  let params = [];

  // Nếu có theater_id thì lấy cả banner global và banner của rạp đó
  if (theater_id) {
    sql += ` OR theater_id = ?`;
    params.push(theater_id);
  }

  sql += `) ORDER BY created_at DESC`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Lỗi truy vấn adv:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    }

    // Convert image URLs cho user server
    const adsWithProxyUrls = result.map(ad => ({
      ...ad,
      image_url: convertImageUrl(ad.image_url)
    }));

    res.json(adsWithProxyUrls);
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