import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HeaderMenu from './frontend/components/Header';
import Home from './frontend/pages/Home';
import Register from './frontend/pages/Register';
import Login from './frontend/pages/Login';
import Movie from './frontend/pages/Movie';
import ShowTimes from './frontend/pages/showTimes';
import Booking from './frontend/pages/Booking';
import User from './frontend/pages/user';
import MyTicket from './frontend/pages/MyTicket';
import Prices from './frontend/pages/Prices';
import ImageUpload from './frontend/pages/ImageUpload';
import TheaterDetail from './frontend/pages/TheaterDetail';
import { notification } from 'antd';

// Cấu hình notification mặc định
notification.config({
  placement: 'topRight',
  duration: 3,
  maxCount: 3,
});

const { Content, Footer } = Layout;

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <HeaderMenu />

        <Content style={{ 
          marginTop: '64px',
          padding: '24px 50px',
          flex: '1 0 auto',
          backgroundColor: '#ffffff',
          maxWidth: '1500px',
          width: '100%',
          margin: '64px auto 0 auto'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie" element={<Movie />} />
            <Route path="/showtimes/:movieId" element={<ShowTimes />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/theaters" element={<TheaterDetail />} />
            
            {/* Protected routes */}
            <Route 
              path="/booking/:showTimeId" 
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicket />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user" 
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload-images" 
              element={
                <ProtectedRoute>
                  <ImageUpload />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Content>

        <Footer style={{ 
          textAlign: 'center', 
          background: '#4a2c2a', 
          color: 'white',
          flexShrink: 0,
          marginTop: 'auto',
          width : "auto",
        }}>
          © 2025 Alpha Cinemas. All rights reserved. | Hotline: 1900 123 456 | Email: [Tqtuan136@gmail.com]
          <br />
          WebPhim ©2025 Created by You
        </Footer>
      </Layout>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
