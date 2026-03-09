const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads/suggestions nếu chưa có
const uploadDir = path.join(__dirname, '../uploads/suggestions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Đã tạo thư mục uploads/suggestions');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = 'suggestion-poster-' + uniqueSuffix + extension;
    console.log('📝 Đang lưu file suggestion:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif)'));
  }
};

const uploadSuggestion = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: fileFilter
});

module.exports = uploadSuggestion;