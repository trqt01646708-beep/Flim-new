const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../uploads/movies');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Đã tạo thư mục uploads/movies');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: poster-[timestamp]-[random].jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = 'poster-' + uniqueSuffix + extension;
    console.log('📝 Đang lưu file:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 Kiểm tra file:', file.originalname, file.mimetype);
  
  // Chỉ chấp nhận file ảnh
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    console.log('✅ File hợp lệ');
    return cb(null, true);
  } else {
    console.log('❌ File không hợp lệ');
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // Chỉ 1 file mỗi lần
  },
  fileFilter: fileFilter
});

module.exports = upload;