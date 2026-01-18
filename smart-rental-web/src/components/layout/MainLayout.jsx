import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Space, Badge, Button } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, ProfileOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';
import notificationService from '../../services/notificationService'; // Import service để lấy số lượng

const { Header, Content } = Layout;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State đếm số thông báo chưa đọc
  const [unreadCount, setUnreadCount] = useState(0);

  // Gọi API lấy số thông báo chưa đọc khi component load
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getMyNotifications();
        if (res.data) {
          // Đếm số lượng item có isRead = false
          const count = res.data.filter(n => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (error) {
        console.error("Lỗi tải thông báo", error);
      }
    };

    // Chỉ gọi nếu đã đăng nhập
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Cấu hình menu khi bấm vào Avatar
  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      icon: <ProfileOutlined />,
      onClick: () => navigate('/profile'), // Chuyển hướng đến trang Profile
    },
    {
      type: 'divider', // Đường kẻ ngang phân cách
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: logout,
    },
  ];

  // Xử lý khi bấm vào chuông thông báo
  const handleNotificationClick = () => {
    // Bất kể là ai (Tenant hay Landlord) đều vào trang thông báo chung này
    // Vì LandlordFinance chỉ quản lý tiền, còn đây là thông báo lịch hẹn, hệ thống...
    navigate('/notifications');
  };


  return (
    <Layout className="min-h-screen">
      {/* Sidebar bên trái */}
      <Sidebar />

      <Layout>
        {/* Header ở trên cùng */}
        <Header className="bg-white flex justify-end items-center px-6 shadow-sm sticky top-0 z-10">
          <Space size="large">

            {/* 1. Icon Thông báo */}
            <div
              className="cursor-pointer flex items-center hover:bg-gray-100 p-2 rounded-full transition-colors"
              onClick={handleNotificationClick}
            >
              <Badge count={unreadCount} size="small" offset={[0, 0]}>
                <BellOutlined style={{ fontSize: '20px', color: '#555' }} />
              </Badge>
            </div>

            {/* 2. Avatar & Dropdown Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <Avatar
                  icon={<UserOutlined />}
                  src={user?.avatarUrl} // Sửa thành avatarUrl cho khớp với API UserEntity
                  className="bg-blue-500"
                />
                <span className="font-medium text-gray-700 select-none">
                  {user?.fullName || 'Người dùng'}
                </span>
              </Space>
            </Dropdown>

          </Space>
        </Header>

        {/* Nội dung trang con */}
        <Content className="m-4 p-6 bg-white rounded-lg shadow overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;