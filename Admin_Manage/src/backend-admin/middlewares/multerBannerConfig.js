// Tạo file middleware/multerBannerConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục banners nếu chưa có
const bannerDir = path.join(__dirname, '../uploads/banners');
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
  console.log('Đã tạo thư mục uploads/banners');
}

// Cấu hình storage cho banner
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannerDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

// File filter cho banner (chỉ cho phép ảnh)
const bannerFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (JPEG, JPG, PNG, WEBP)'), false);
  }
};

// Tạo upload middleware cho banner
const uploadBanner = multer({
  storage: bannerStorage,
  fileFilter: bannerFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('banner');

module.exports = { uploadBanner };