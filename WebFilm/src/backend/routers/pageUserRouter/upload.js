const express = require('express');
const router = express.Router();
const upload = require('../../config/uploadConfig');

// API upload ảnh đơn giản - chỉ trả về link
router.post('/image', upload.single('image'), (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Không có file được upload' });
    }

    // Tạo URL đầy đủ
    const imageUrl = `http://localhost:5000/uploads/movies/${file.filename}`;

    res.json({
      message: 'Upload thành công',
      url: imageUrl,
      filename: file.filename,
      size: file.size
    });

  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ error: 'Lỗi upload file' });
  }
});

// API upload nhiều ảnh cùng lúc
router.post('/images', upload.array('images', 5), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Không có file được upload' });
    }

    const imageUrls = files.map(file => ({
      url: `http://localhost:5000/uploads/movies/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));

    res.json({
      message: `Upload ${files.length} ảnh thành công`,
      images: imageUrls
    });

  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ error: 'Lỗi upload files' });
  }
});

// API liệt kê tất cả ảnh đã upload
router.get('/images', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, '../../uploads/movies');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(filename => ({
        filename,
        url: `http://localhost:5000/uploads/movies/${filename}`,
        size: fs.statSync(path.join(uploadsDir, filename)).size
      }));

    res.json({ 
      message: `Tìm thấy ${files.length} ảnh`,
      images: files 
    });

  } catch (error) {
    console.error('Lỗi đọc thư mục:', error);
    res.status(500).json({ error: 'Lỗi đọc danh sách ảnh' });
  }
});

module.exports = router;