import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const AdminLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', color: 'white' }}>
        <h2 style={{ color: 'white' }}>Admin Panel</h2>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center' }}>Admin Panel ©2025</Footer>
    </Layout>
  );
};

export default AdminLayout;
