const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Thêm axios import
const app = express();

// Import routers
const adminAuthRouter = require('./routers/adminAuthRouter');
const theaterMoviesRouter = require('./routers/theaterMoviesRouter');
const adminMoviesRouter = require('./routers/adminMoviesRouter');
const adminAccountRouter = require('./routers/adminGetAccountRouter');
const adminsetAccountRouter = require('./routers/adminsetAccountRouter');
const movieSuggestionsRouter = require('./routers/movieSuggestionsRouter');
const showtimesRouter = require('./routers/showtimesRouter');
const adminTheaterRouter = require('./routers/adminTheaterRouter');
const adminAdvRoutes = require('./routers/adminAdvRouter');
const adminRevenueRouter = require('./routers/adminRevenueRouter');
const adminTheaterIntroRoutes = require('./routers/adminTheaterIntroRouter')


// ... các route khác



app.use(cors());
app.use(express.json());

// Serve static files cho ảnh uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log("✅ Đã cấu hình static files cho uploads");
// Serve static files cho suggestions
app.use('/uploads/suggestions', express.static(path.join(__dirname, 'uploads/suggestions')));
console.log("✅ Đã cấu hình static files cho suggestions");

// Middleware xử lý lỗi upload
const multer = require('multer');
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn, tối đa 10MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Quá nhiều file' });
    }
  }
  if (error.message === 'Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif)') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// SỬA: Đổi từ /admin/adv thành /api/admin/adv
app.use('/api/admin/adv', adminAdvRoutes);
console.log("✅ Đã cấu hình admin adv routes tại /api/admin/adv");

// Proxy endpoint cho banner images từ user server
app.get('/uploads/banners/:filename', async (req, res) => {
  const { filename } = req.params;
  const imagePath = `/uploads/banners/${filename}`;
  const localFilePath = path.join(__dirname, 'uploads/banners', filename);
  
  console.log(`Banner request: ${imagePath}`);
  
  try {
    // Kiểm tra file có tồn tại locally không
    const fs = require('fs');
    if (fs.existsSync(localFilePath)) {
      console.log(`Serving local banner: ${imagePath}`);
      res.sendFile(localFilePath);
    } else {
      console.log(`Banner not found: ${imagePath}`);
      res.status(404).json({ 
        error: 'Banner không tìm thấy',
        path: imagePath
      });
    }
  } catch (error) {
    console.error(`Error serving banner ${imagePath}:`, error.message);
    res.status(500).json({ 
      error: 'Lỗi khi lấy banner',
      path: imagePath
    });
  }
});

// THÊM: Proxy endpoint cho ticket price banner images
app.get('/uploads/ticket-price-banners/:filename', async (req, res) => {
  const { filename } = req.params;
  const imagePath = `/uploads/ticket-price-banners/${filename}`;
  const localFilePath = path.join(__dirname, 'uploads/ticket-price-banners', filename);
  
  console.log(`Ticket Price Banner request: ${imagePath}`);
  
  try {
    // Kiểm tra file có tồn tại locally không
    const fs = require('fs');
    if (fs.existsSync(localFilePath)) {
      console.log(`Serving local ticket price banner: ${imagePath}`);
      res.sendFile(localFilePath);
    } else {
      console.log(`Ticket Price Banner not found: ${imagePath}`);
      res.status(404).json({ 
        error: 'Ticket Price Banner không tìm thấy',
        path: imagePath
      });
    }
  } catch (error) {
    console.error(`Error serving ticket price banner ${imagePath}:`, error.message);
    res.status(500).json({ 
      error: 'Lỗi khi lấy ticket price banner',
      path: imagePath
    });
  }
});

console.log("✅ Đã cấu hình banner và ticket price banner proxy endpoints");

app.use('/api/admin/theater-intro-banners', adminTheaterIntroRoutes);
console.log("✅ Đã load router Theater Intro Banners");

// Thêm endpoint proxy cho theater intro banners
app.get('/uploads/theater-intro-banners/:filename', async (req, res) => {
  const { filename } = req.params;
  const localFilePath = path.join(__dirname, 'uploads/theater-intro-banners', filename);
  
  console.log(`Theater Intro Banner request: ${filename}`);
  
  try {
    const fs = require('fs');
    if (fs.existsSync(localFilePath)) {
      console.log(`Serving local theater intro banner: ${filename}`);
      res.sendFile(localFilePath);
    } else {
      console.log(`Theater Intro Banner not found: ${filename}`);
      res.status(404).json({ 
        error: 'Theater Intro Banner không tìm thấy',
        path: `/uploads/theater-intro-banners/${filename}`
      });
    }
  } catch (error) {
    console.error(`Error serving theater intro banner ${filename}:`, error.message);
    res.status(500).json({ 
      error: 'Lỗi khi lấy theater intro banner'
    });
  }
});

// API Routes
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/movies', adminMoviesRouter);
console.log("✅ Đã load admin movies router");

app.use('/api/admin/theater/movies', theaterMoviesRouter);
console.log("✅ Đã load theater movies router");

app.use('/api/admin/suggestions', movieSuggestionsRouter);
console.log("✅ Đã load combined suggestions router");

app.use('/api/admin/showtimes', showtimesRouter);
console.log("✅ Đã load router showtime");

app.use('/api/admin/account', adminAccountRouter);
console.log("✅ Đã load router accAdmin");

app.use('/api/admin/set-account', adminsetAccountRouter);
console.log("✅ Đã load router setAccount");

app.use('/api/admin/theater', adminTheaterRouter);
console.log("✅ Đã load router Theater");

app.use('/api/admin/revenue', adminRevenueRouter);
console.log("✅ Đã load router Revenue");

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend Admin đang chạy tại http://localhost:${PORT}`);
});