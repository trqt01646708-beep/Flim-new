import { Layout, Avatar, Typography, Dropdown, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  VideoCameraOutlined,
  PlusOutlined,
  FileDoneOutlined,
  UserOutlined,
  LogoutOutlined,
  PictureOutlined,
  DollarOutlined,
  BarChartOutlined,
  BankOutlined,
  DownOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

const AdminSidebar = ({ role, onLogout, adminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const bannerMenuItems = [
    {
      key: 'banner-adv',
      icon: <PictureOutlined />,
      label: 'Banner Quảng Cáo',
      onClick: () => navigate('/admin/banner-management'),
    },
    {
      key: 'banner-ticket-price',
      icon: <DollarOutlined />,
      label: 'Banner Giá Vé',
      onClick: () => navigate('/admin/ticket-price-banner-management'),
    },
    {
      key: 'banner-theater-intro',
      icon: <BankOutlined />,
      label: 'Banner Giới Thiệu Rạp',
      onClick: () => navigate('/admin/theater-intro-banner-management'),
    },
  ];

  const userMenuItems = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: 'tài khoản',
      onClick: () => navigate('/admin/account'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: onLogout,
      danger: true,
    },
  ];

  const isOnBannerPage = location.pathname.includes('banner');

  const mainMenuItems = [
    {
      key: 'movies',
      icon: <VideoCameraOutlined />,
      label: 'Quản lý phim',
      onClick: () =>
        navigate(role === 'super_admin' ? '/admin/movies' : '/admin/theater/movies'),
    },
    {
      key: 'revenue',
      icon: <BarChartOutlined />,
      label: 'Thống kê doanh thu',
      onClick: () => navigate('/admin/revenue'),
    },
  ];

  const theaterItems =
    role === 'theater_admin'
      ? [
          {
            key: 'showtimes',
            icon: <VideoCameraOutlined />,
            label: 'Lịch chiếu phim',
            onClick: () => navigate('/admin/showtimes'),
          },
          {
            key: 'suggest',
            icon: <PlusOutlined />,
            label: 'Gửi yêu cầu phim',
            onClick: () => navigate('/admin/suggest-movie'),
          },
        ]
      : [];

  const superItems =
    role === 'super_admin'
      ? [
          {
            key: 'showtimes',
            icon: <VideoCameraOutlined />,
            label: 'Lịch chiếu các rạp',
            onClick: () => navigate('/admin/showtimes'),
          },
          {
            key: 'requests',
            icon: <FileDoneOutlined />,
            label: 'Duyệt yêu cầu phim',
            onClick: () => navigate('/admin/movie-suggestions'),
          },
          {
            key: 'create-admin',
            icon: <UserOutlined />,
            label: 'Quản lý khoản admin',
            onClick: () => navigate('/admin/create-admin'),
          },
        ]
      : [];

  const menuItems = [...mainMenuItems, ...theaterItems, ...superItems];

  return (
    <Header
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        position: 'fixed',
        width: '100%',
        top: 0,
        zIndex: 1000,
        lineHeight: 'normal',
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '200px',
          height: '64px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          🎬
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text
            style={{
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              lineHeight: '1.2',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            Beta Cineplex
          </Text>
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              margin: 0,
              lineHeight: '1.2',
            }}
          >
            Admin Dashboard
          </Text>
        </div>
      </div>

      {/* Navigation Menu */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          height: '64px',
          padding: '0 16px',
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={item.onClick}
            style={{
              padding: '8px 14px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background:
                location.pathname.includes(item.key) && !isOnBannerPage
                  ? 'rgba(255, 255, 255, 0.25)'
                  : 'transparent',
              color: '#fff',
              fontWeight: '500',
              fontSize: '13px',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              border:
                location.pathname.includes(item.key) && !isOnBannerPage
                  ? '1px solid rgba(255, 255, 255, 0.3)'
                  : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!location.pathname.includes(item.key) || isOnBannerPage) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!location.pathname.includes(item.key) || isOnBannerPage) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            <span style={{ lineHeight: '1' }}>{item.label}</span>
          </div>
        ))}

        {/* Banner Dropdown */}
        <Dropdown
          menu={{ items: bannerMenuItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <div
            style={{
              padding: '8px 14px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isOnBannerPage
                ? 'rgba(255, 255, 255, 0.25)'
                : 'transparent',
              color: '#fff',
              fontWeight: '500',
              fontSize: '13px',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              border: isOnBannerPage
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isOnBannerPage) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOnBannerPage) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <AppstoreOutlined style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }} />
            <span style={{ lineHeight: '1' }}>Quản lý Banner</span>
            <DownOutlined style={{ fontSize: '9px', display: 'flex', alignItems: 'center' }} />
          </div>
        </Dropdown>
      </div>

      {/* User Profile */}
      <Dropdown
        menu={{ items: userMenuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            height: '48px',
            borderRadius: '10px',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s',
            minWidth: '160px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          <Badge dot color="#52c41a" offset={[-4, 4]}>
            <Avatar
              size={34}
              icon={<UserOutlined />}
              style={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontWeight: '600',
              }}
            />
          </Badge>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text
              style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              {adminInfo?.username || 'Admin'}
            </Text>
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                lineHeight: '1.2',
                margin: 0,
              }}
            >
              {role === 'super_admin' ? 'Super Admin' : 'Theater Admin'}
            </Text>
          </div>
          <DownOutlined style={{ color: '#fff', fontSize: '9px' }} />
        </div>
      </Dropdown>
    </Header>
  );
};

export default AdminSidebar;