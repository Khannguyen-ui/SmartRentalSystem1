import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  HomeOutlined, 
  CheckCircleOutlined, 
  UserOutlined, 
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const { Sider } = Layout;

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu dành cho Admin
  const adminItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Thống kê' },
    { key: '/admin/approve-rooms', icon: <CheckCircleOutlined />, label: 'Duyệt tin đăng' },
    { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
    { key: '/admin/master-data', icon: <DatabaseOutlined />, label: 'Quản lý Dữ liệu' },
    
  
  ];

  // Menu dành cho Chủ trọ
  const landlordItems = [
    { key: '/landlord/create-room', icon: <HomeOutlined />, label: 'Đăng phòng mới' },
    { key: '/landlord/rooms', icon: <DashboardOutlined />, label: 'Phòng của tôi' },
    
  ];

  return (
    <Sider width={240} theme="dark" collapsible breakpoint="lg">
      <div className="h-16 flex items-center justify-center text-white font-bold text-xl bg-blue-600">
        SMART RENTAL
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={user?.role === 'ADMIN' ? adminItems : landlordItems}
        onClick={(e) => navigate(e.key)}
      />
    </Sider>
  );
};

export default Sidebar;