// SỬA LỖI ROUTE PATTERN - Cập nhật server.js

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const movieRoutes = require('./routers/pageUserRouter/movies');
const advRoutes = require('./routers/pageUserRouter/adv');
const authRoutes = require('./routers/pageUserRouter/auth');
const filmRoutes = require('./routers/pageUserRouter/films');
const provinceRoutes = require('./routers/pageUserRouter/provinces');
const theaterRoutes = require('./routers/pageUserRouter/theaters');
const showtimesRoutes = require('./routers/pageUserRouter/showtimes');
const userRoutes = require('./routers/pageUserRouter/user');
const bookingRoutes = require('./routers/pageUserRouter/booking');
const priceRoutes = require('./routers/pageUserRouter/prices');
const theaterIntroBannersRoutes = require('./routers/pageUserRouter/theaterIntroBanners');

const app = express();
const server = http.createServer(app);

// Middleware cơ bản
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"], // Full CORS cho frontend ports
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Log all requests for debug (tạm, remove in prod)
app.use((req, res, next) => {
  console.log(`📡 Request: ${req.method} ${req.path} - Headers:`, req.headers.authorization ? 'Has Auth' : 'No Auth');
  next();
});

// SỬA: Thay đổi route pattern từ '/uploads/*' thành '/uploads/:folder/:filename'
app.get('/uploads/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  const imagePath = `/uploads/${folder}/${filename}`;
  const adminUrl = `http://localhost:5001${imagePath}`;
  
  console.log(`Yêu cầu hình ảnh: ${imagePath}`);
  console.log(`Lấy từ admin server: ${adminUrl}`);
  
  try {
    const response = await axios.get(adminUrl, {
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'User-Server-Image-Proxy'
      }
    });
    
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    });
    
    console.log(`Trả về hình ảnh thành công: ${imagePath} (${contentType})`);
    
    response.data.pipe(res);
    
    response.data.on('error', (streamError) => {
      console.error(`Lỗi stream ${imagePath}:`, streamError.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Lỗi stream hình ảnh', path: imagePath });
      }
    });
    
    response.data.on('end', () => {
      console.log(`Hoàn thành gửi hình ảnh: ${imagePath}`);
    });
    
  } catch (error) {
    console.error(`Không thể lấy hình ảnh ${imagePath}:`, error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'Không tìm thấy hình ảnh',
        path: imagePath,
        adminUrl: adminUrl
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Admin server không khả dụng',
        path: imagePath,
        adminUrl: adminUrl
      });
    } else {
      res.status(500).json({ 
        error: 'Lỗi server khi lấy hình ảnh',
        details: error.message,
        path: imagePath,
        adminUrl: adminUrl
      });
    }
  }
});

console.log("Đã cấu hình endpoint cho /uploads/:folder/:filename");

// Khởi tạo Socket.IO (chỉ một lần)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"], // Full ports
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    transports: ['websocket', 'polling'] // Fallback
  },
  allowEIO3: true,
  pingTimeout: 20000,
  pingInterval: 25000
});

// Socket.IO events (chỉ một block)
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('joinRoom', (showTimeId) => {
    const roomName = `room_${showTimeId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('holdSeats', ({ showTimeId, seatIds, bookingId }) => {
    io.to(`room_${showTimeId}`).emit('seatUpdate', seatIds.map(id => ({
      id,
      isHeld: true,
      isBooked: false,
    })));
  });

  socket.on('confirmBooking', ({ showTimeId, bookingId }) => {
    io.to(`room_${showTimeId}`).emit('seatUpdate', [{ bookingId, isBooked: true }]);
  });

  socket.on('cancelBooking', ({ showTimeId, bookingId }) => {
    io.to(`room_${showTimeId}`).emit('seatUpdate', [{ bookingId, isHeld: false, isBooked: false }]);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Test endpoints
app.get('/test-image-server', (req, res) => {
  res.json({
    message: 'User Server với endpoint hình ảnh tùy chỉnh',
    image_endpoint: '/uploads/:folder/:filename',
    test_urls: [
      'http://localhost:5000/uploads/movies/poster-1758947366230-535615717.jpg',
      'http://localhost:5000/uploads/movies/poster-1758946517560-502040924.jpg',
      'http://localhost:5000/uploads/movies/poster-1758944503895-226686428.png'
    ],
    admin_check: 'http://localhost:5001/uploads/movies/poster-1758947366230-535615717.jpg'
  });
});

app.get('/health/admin-server', async (req, res) => {
  try {
    const testUrl = 'http://localhost:5001/uploads/movies/poster-1758947366230-535615717.jpg';
    const response = await axios.head(testUrl, { timeout: 5000 });
    
    res.json({
      status: 'success',
      adminServerReachable: true,
      statusCode: response.status,
      message: 'Admin server hoạt động bình thường'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      adminServerReachable: false,
      error: error.message
    });
  }
});

app.get('/test-ticket-price-banners', (req, res) => {
  res.json({
    message: 'Test endpoint cho ticket price banners',
    endpoint: '/uploads/ticket-price-banners/:filename',
    example_urls: [
      'http://localhost:5000/uploads/ticket-price-banners/ticket-price-banner-123456789-987654321.jpg',
    ],
    admin_server_check: 'http://localhost:5001/uploads/ticket-price-banners/',
    note: 'Endpoint này sẽ proxy request từ admin server'
  });
});

// Debug middleware để log requests
app.use('/uploads/ticket-price-banners', (req, res, next) => {
  console.log('🎫 Ticket Price Banner Request:', req.originalUrl);
  console.log('🎫 Params:', req.params);
  next();
});

// API Routes
app.use('/api/movies', movieRoutes);
console.log("Đã load movie route");

app.use('/api/adv', advRoutes);
console.log("Đã load adv route");

app.use('/api/auth', authRoutes);
console.log("Đã load login/register");

app.use('/api/provinces', provinceRoutes);
console.log("Đã load province route");

app.use('/api/theaters', theaterRoutes);
console.log("Đã load theater route");

app.use('/api/films', filmRoutes);
console.log("Đã load film route");

app.use('/api/showtimes', showtimesRoutes);
console.log("Đã load showtime route");

app.use('/api/users', userRoutes);
console.log("Đã load user route");

app.use('/api/ticket-banners', priceRoutes);
console.log("Đã load booking gia ve");

app.use('/api/theater-intro-banners', theaterIntroBannersRoutes);
console.log("Đã load theater intro banners route");

app.use('/api/bookings', bookingRoutes(io));
console.log("Đã load booking route và truyền WebSocket");

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server + WebSocket running at http://localhost:${PORT}`);
  console.log(`Image endpoint: http://localhost:${PORT}/uploads/:folder/:filename`);
  console.log(`Test endpoint: http://localhost:${PORT}/test-image-server`);
  console.log(`Health check: http://localhost:${PORT}/health/admin-server`);
});