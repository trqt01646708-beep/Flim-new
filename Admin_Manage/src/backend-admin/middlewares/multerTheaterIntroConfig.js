const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục theater-intro-banners nếu chưa có
const theaterIntroBannerDir = path.join(__dirname, '../uploads/theater-intro-banners');
if (!fs.existsSync(theaterIntroBannerDir)) {
  fs.mkdirSync(theaterIntroBannerDir, { recursive: true });
  console.log('Đã tạo thư mục uploads/theater-intro-banners');
}

// Cấu hình storage
const theaterIntroBannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, theaterIntroBannerDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'theater-intro-banner-' + uniqueSuffix + ext);
  }
});

// File filter
const theaterIntroBannerFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (JPEG, JPG, PNG, WEBP)'), false);
  }
};

// Tạo upload middleware
const uploadTheaterIntroBanner = multer({
  storage: theaterIntroBannerStorage,
  fileFilter: theaterIntroBannerFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('theater_intro_banner');

module.exports = { uploadTheaterIntroBanner };