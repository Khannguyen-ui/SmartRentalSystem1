import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  HomeOutlined, 
  CheckCircleOutlined, 
  UserOutlined, 
  DatabaseOutlined,
  ClockCircleOutlined,
  BellOutlined, // Thêm icon chuông
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const { Sider } = Layout;

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Menu dành cho ADMIN
  const adminItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Thống kê' },
    { key: '/admin/approve-rooms', icon: <CheckCircleOutlined />, label: 'Duyệt tin đăng' },
    { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
    { key: '/admin/master-data', icon: <DatabaseOutlined />, label: 'Quản lý Dữ liệu' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' }, // Thêm thông báo
  ];

  // 2. Menu dành cho CHỦ TRỌ (LANDLORD)
  const landlordItems = [
    { key: '/landlord/create-room', icon: <HomeOutlined />, label: 'Đăng tin mới' },
    { key: '/landlord/room-list', icon: <DashboardOutlined />, label: 'Quản lý tin đăng' },
    { key: '/landlord/appointments', icon: <ClockCircleOutlined />, label: 'Quản lý Lịch hẹn' },
    { key: '/landlord/finance', icon: <DatabaseOutlined />, label: 'Tài chính & Ví' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' }, 
  ];

  // 3. Menu dành cho KHÁCH THUÊ (TENANT) - (Mới bổ sung)
  const tenantItems = [
    { key: '/', icon: <SearchOutlined />, label: 'Tìm phòng' },
    // Cần đảm bảo AppRoutes có route /tenant/appointments trỏ về AppointmentManagement
    { key: '/tenant/appointments', icon: <ClockCircleOutlined />, label: 'Lịch hẹn của tôi' }, 
    { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
  ];

  // Hàm chọn menu dựa trên Role
  const getMenuItems = () => {
      switch (user?.role) {
          case 'ADMIN': return adminItems;
          case 'LANDLORD': return landlordItems;
          case 'TENANT': return tenantItems;
          default: return [];
      }
  };

  return (
    <Sider width={240} theme="dark" collapsible breakpoint="lg">
      <div 
        className="h-16 flex items-center justify-center text-white font-bold text-xl bg-blue-600 cursor-pointer hover:bg-blue-500 transition-colors"
        onClick={() => navigate('/')} 
      >
        SMART RENTAL
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()} // Gọi hàm lấy menu chuẩn
        onClick={(e) => navigate(e.key)}
      />
    </Sider>
  );
};

export default Sidebar;