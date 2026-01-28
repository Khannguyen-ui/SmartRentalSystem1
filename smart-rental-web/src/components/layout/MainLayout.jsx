import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Space, Badge, Popover, List, Typography, Button, Empty } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, ProfileOutlined, DollarOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';
import notificationService from '../../services/notificationService';
import Footer from './Footer';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State lưu danh sách thông báo và số lượng chưa đọc
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res.data) {
        const data = res.data;
        // 1. Cập nhật số lượng chưa đọc (dùng isRead theo cấu trúc Entity Backend [cite: 573])
        setUnreadCount(data.filter(n => !n.isRead).length);
        // 2. Chỉ lấy 5 thông báo mới nhất để hiển thị ở preview
        setNotifications(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Lỗi tải thông báo", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Hàm lấy icon tương ứng với loại thông báo 
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BILL_NEW': return <Avatar icon={<DollarOutlined />} style={{ backgroundColor: '#52c41a' }} />;
      case 'APPOINTMENT_SUGGESTION': return <Avatar icon={<CalendarOutlined />} style={{ backgroundColor: '#fa8c16' }} />;
      case 'CONTRACT_SIGN': return <Avatar icon={<CheckCircleOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      default: return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#bfbfbf' }} />;
    }
  };

  // --- NỘI DUNG POPOVER THÔNG BÁO ---
  const notificationContent = (
    <div style={{ width: 320 }}>
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <Text strong style={{ fontSize: 16 }}>Thông báo mới nhất</Text>
        <Button type="link" size="small" onClick={() => navigate('/notifications')}>
          Xem tất cả
        </Button>
      </div>

      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item) => (
          <List.Item
            className={`cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors mb-1 ${!item.isRead ? 'bg-blue-50' : ''}`}
            onClick={() => {
              navigate('/notifications'); // Chuyển về trang tổng khi nhấn vào item
            }}
          >
            <List.Item.Meta
              avatar={getNotificationIcon(item.type)}
              title={<span className={`text-xs ${!item.isRead ? 'font-bold' : ''}`}>{item.title}</span>}
              description={
                <div className="flex flex-col">
                  <Text type="secondary" style={{ fontSize: 11 }} ellipsis>{item.message}</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(item.createdAt).fromNow()}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      icon: <ProfileOutlined />,
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <Header className="bg-white flex justify-end items-center px-6 shadow-sm sticky top-0 z-10">
          <Space size="large">

            {/* 1. Icon Thông báo với Popover */}
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              arrow={false}
            >
              <div className="cursor-pointer flex items-center hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Badge count={unreadCount} size="small" offset={[2, 0]}>
                  <BellOutlined style={{ fontSize: '20px', color: '#555' }} />
                </Badge>
              </div>
            </Popover>

            {/* 2. Avatar & Dropdown Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <Avatar
                  icon={<UserOutlined />}
                  src={user?.avatarUrl}
                  className="bg-blue-500"
                />
                <span className="font-medium text-gray-700 select-none">
                  {user?.fullName || 'Người dùng'}
                </span>
              </Space>
            </Dropdown>

          </Space>
        </Header>

        <Content className="bg-[#f0f2f5] min-h-0 flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default MainLayout;