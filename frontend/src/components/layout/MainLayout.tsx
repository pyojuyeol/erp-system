import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  DollarOutlined,
  InboxOutlined,
  AccountBookOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../features/auth/api/authApi';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '대시보드' },
  { key: '/employees', icon: <TeamOutlined />, label: '인사관리' },
  { key: '/departments', icon: <ApartmentOutlined />, label: '부서관리' },
  { key: '/salaries', icon: <DollarOutlined />, label: '급여관리' },
  { key: '/inventory', icon: <InboxOutlined />, label: '재고관리' },
  { key: '/accounting', icon: <AccountBookOutlined />, label: '회계관리' },
  { key: '/attendance', icon: <ClockCircleOutlined />, label: '근태관리' },
];

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 백엔드 로그아웃 실패해도 클라이언트 상태는 정리
    }
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '로그아웃' }],
    onClick: handleLogout,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            color: '#fff',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {collapsed ? 'ERP' : 'ERP System'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {collapsed ? (
            <MenuUnfoldOutlined onClick={() => setCollapsed(false)} />
          ) : (
            <MenuFoldOutlined onClick={() => setCollapsed(true)} />
          )}
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar>{user?.name?.[0] ?? 'U'}</Avatar>
              <span>{user?.name ?? '사용자'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, background: colorBgContainer, minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
