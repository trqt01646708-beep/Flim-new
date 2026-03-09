import React, { useEffect, useState } from 'react';
import { Dropdown, Avatar, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, VideoCameraOutlined, EnvironmentOutlined, DollarOutlined, TagOutlined, GiftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const HeaderMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserData = async () => {
    if (!token || !user?.id) return;

    try {
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserData(response.data);
    } catch (err) {
      console.error('Lỗi fetch user data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchUserData();
    }
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const userMenuItems = [
    {
      key: 'welcome',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff', marginBottom: '4px' }}>
            Xin chào, {user?.username}!
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {user?.email}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'points',
      label: (
        <div style={{ 
          padding: '12px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white',
          margin: '8px 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Điểm tích lũy</span>
            <strong style={{ fontSize: '18px' }}>{userData?.points || 0}</strong>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/user'),
    },
    {
      key: 'tickets',
      icon: <TagOutlined />,
      label: 'Vé của tôi',
      onClick: () => navigate('/my-tickets'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const styles = {
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      borderBottom: scrolled ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 60px',
      height: scrolled ? '60px' : '70px',
      maxWidth: '1600px',
      margin: '0 auto',
      transition: 'height 0.3s ease',
    },
    logo: {
      fontSize: scrolled ? '26px' : '30px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      cursor: 'pointer',
      letterSpacing: '0.5px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    nav: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    link: {
      fontSize: '15px',
      color: '#333',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 20px',
      borderRadius: '8px',
      fontWeight: '500',
      position: 'relative',
    },
    linkActive: {
      color: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.08)',
    },
    authButtons: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    button: {
      padding: '10px 24px',
      fontSize: '14px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: '600',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    loginButton: {
      backgroundColor: 'white',
      color: '#1890ff',
      border: '2px solid #1890ff',
    },
    registerButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    pointsBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#2d3436',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(253, 203, 110, 0.3)',
    },
    avatar: {
      cursor: 'pointer',
      border: '3px solid transparent',
      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box',
      transition: 'all 0.3s ease',
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <span style={{ fontSize: scrolled ? '28px' : '32px', transition: 'font-size 0.3s ease' }}>🎬</span>
          ALPHA CINEMAS
        </div>

        <nav style={styles.nav}>
          <Link 
            to="/" 
            style={{
              ...styles.link,
              ...(isActive('/') ? styles.linkActive : {})
            }}
            onMouseEnter={(e) => {
              if (!isActive('/')) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <HomeOutlined /> Trang chủ
          </Link>
          <Link 
            to="/movie" 
            style={{
              ...styles.link,
              ...(isActive('/movie') ? styles.linkActive : {})
            }}
            onMouseEnter={(e) => {
              if (!isActive('/movie')) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/movie')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <VideoCameraOutlined /> Phim
          </Link>
          <Link 
            to="/theaters" 
            style={{
              ...styles.link,
              ...(isActive('/theaters') ? styles.linkActive : {})
            }}
            onMouseEnter={(e) => {
              if (!isActive('/theaters')) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/theaters')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <EnvironmentOutlined /> Rạp
          </Link>
          <Link 
            to="/prices" 
            style={{
              ...styles.link,
              ...(isActive('/prices') ? styles.linkActive : {})
            }}
            onMouseEnter={(e) => {
              if (!isActive('/prices')) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/prices')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <DollarOutlined /> Giá vé
          </Link>
        </nav>

        {user && token ? (
          <div style={styles.userSection}>
            <div 
              style={styles.pointsBadge}
              onClick={() => navigate('/user')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 203, 110, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(253, 203, 110, 0.3)';
              }}
            >
              <GiftOutlined />
              {userData?.points || 0} điểm
            </div>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Avatar
                size={44}
                style={styles.avatar}
                icon={<UserOutlined />}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </Dropdown>
          </div>
        ) : (
          <div style={styles.authButtons}>
            <button
              style={{ ...styles.button, ...styles.loginButton }}
              onClick={() => navigate('/login')}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e6f7ff';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            >
              Đăng nhập
            </button>
            <button
              style={{ ...styles.button, ...styles.registerButton }}
              onClick={() => navigate('/register')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            >
              Đăng ký
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderMenu;