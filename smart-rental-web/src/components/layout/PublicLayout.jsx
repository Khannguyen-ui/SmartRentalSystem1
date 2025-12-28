import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, HistoryOutlined, HomeOutlined } from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenu = [
    {
      key: '1',
      label: <Link to="/tenant/schedule">Lịch hẹn của tôi</Link>,
      icon: <HistoryOutlined />,
    },
    {
        key: '2',
        label: <Link to="/tenant/contracts">Hợp đồng của tôi</Link>,
        icon: <HistoryOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: <span onClick={logout}>Đăng xuất</span>,
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-2xl hover:text-blue-500">
            <HomeOutlined /> SMART RENTAL
          </Link>

          {/* User Actions */}
          <div>
            {user ? (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Space className="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition">
                  <Avatar src={user.avatar} icon={<UserOutlined />} className="bg-blue-500" />
                  <span className="hidden md:inline font-medium text-gray-700">{user.fullName}</span>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Link to="/login">
                  <Button type="text">Đăng nhập</Button>
                </Link>
                <Link to="/register-landlord">
                  <Button type="primary" className="bg-blue-600">Đăng ký chủ trọ</Button>
                </Link>
              </Space>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Smart Rental System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;