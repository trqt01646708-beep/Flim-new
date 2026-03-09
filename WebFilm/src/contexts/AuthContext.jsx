// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load từ sessionStorage khi app khởi động
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      const storedToken = sessionStorage.getItem('token');
      const storedAdminToken = sessionStorage.getItem('admin_token');
      const storedAdminInfo = sessionStorage.getItem('admin_info');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }

      if (storedAdminToken && storedAdminInfo) {
        setAdminToken(storedAdminToken);
        setAdminInfo(JSON.parse(storedAdminInfo));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // User login
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', userToken);
  };

  // User logout
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  // Admin login
  const adminLogin = (admin, token) => {
    setAdminInfo(admin);
    setAdminToken(token);
    sessionStorage.setItem('admin_info', JSON.stringify(admin));
    sessionStorage.setItem('admin_token', token);
  };

  // Admin logout
  const adminLogout = () => {
    setAdminInfo(null);
    setAdminToken(null);
    sessionStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
  };

  // Update user data
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    adminInfo,
    adminToken,
    adminLogin,
    adminLogout,
    loading,
    isAuthenticated: !!token,
    isAdminAuthenticated: !!adminToken,
  };

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Đang tải...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};