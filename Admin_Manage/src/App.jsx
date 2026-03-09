import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { useState } from 'react';

import AdminSidebar from './frontend/components/AdminSidebar';
import AdminLogin from './frontend/pages/AdminLogin';
import AdminMovies from './frontend/pages/AdminMovies';
import TheaterMovies from './frontend/pages/TheaterMovies';
import SuperAdminMovieSuggestions from './frontend/pages/SuperAdminMovieSuggestions';
import AdminAccount from './frontend/pages/AdminAccount';
import CreateAdmin from './frontend/pages/CreateAdmin';
import TheaterSuggestMovie from './frontend/pages/TheaterSuggestMovie';
import AdminShowtimesSuper from './frontend/pages/AdminShowtimesSuper';
import AdminShowtimesTheater from './frontend/pages/AdminShowtimesTheater';
import AdminAdvManagement from './frontend/pages/AdminAdvManagement';
import AdminTicketPriceManagement from './frontend/pages/AdminTicketPriceManagement';
import AdminTheaterIntroManagement from './frontend/pages/AdminTheaterIntroManagement'; // THÊM DÒ NÀY
import SuperAdminRevenueManagement from './frontend/pages/SuperAdminRevenueManagement';
import TheaterRevenueManagement from './frontend/pages/TheaterRevenueManagement';

const { Content } = Layout;

const getAdminFromStorage = () => {
  const token = localStorage.getItem('admin_token');
  const admin = localStorage.getItem('admin_info');
  return token && admin ? JSON.parse(admin) : null;
};

const ProtectedRoute = ({ children }) => {
  const admin = getAdminFromStorage();
  return admin ? children : <Navigate to="/admin/login" replace />;
};

const AppLayout = ({ children }) => {
  const admin = getAdminFromStorage();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (location.pathname === '/admin/login') return children;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    window.location.href = '/admin/login';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <AdminSidebar
        role={admin?.role}
        adminInfo={admin}
        onLogout={handleLogout}
      />
      <Layout style={{ marginTop: '64px', padding: '24px' }}>
        <Content
          style={{
            width: '97vw',
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  const admin = getAdminFromStorage();

  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/movies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminMovies />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/theater/movies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TheaterMovies />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/movie-suggestions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SuperAdminMovieSuggestions />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/account"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminAccount />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/create-admin"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateAdmin />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/suggest-movie"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TheaterSuggestMovie />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Route cho quản lý banner quảng cáo */}
        <Route
          path="/admin/banner-management"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminAdvManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Route cho banner giá vé */}
        <Route
          path="/admin/ticket-price-banner-management"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminTicketPriceManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* THÊM MỚI: Route cho banner giới thiệu rạp */}
        <Route
          path="/admin/theater-intro-banner-management"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminTheaterIntroManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Route cho lịch chiếu phim */}
        <Route
          path="/admin/showtimes"
          element={
            <ProtectedRoute>
              <AppLayout>
                {admin?.role === 'super_admin' ? (
                  <AdminShowtimesSuper />
                ) : (
                  <AdminShowtimesTheater />
                )}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/revenue"
          element={
            <ProtectedRoute>
              <AppLayout>
                {admin?.role === 'super_admin' ? (
                  <SuperAdminRevenueManagement />
                ) : (
                  <TheaterRevenueManagement />
                )}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<h1 style={{ padding: 40 }}>404 - Không tìm thấy trang</h1>} />
      </Routes>
    </Router>
  );
};

export default App;