import React from 'react';
import { Layout, Button, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';

const { Header, Content } = Layout;

const MainLayout = () => {
  const { user, logout } = useAuth();

  const items = [
    {
      key: '1',
      label: <span onClick={logout}>Đăng xuất</span>,
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar bên trái */}
      <Sidebar />
      
      <Layout>
        {/* Header ở trên cùng */}
        <Header className="bg-white flex justify-end items-center px-6 shadow-sm">
          <Dropdown menu={{ items }} placement="bottomRight">
            <Space className="cursor-pointer hover:bg-gray-50 p-2 rounded">
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span className="font-semibold">{user?.fullName || 'Người dùng'}</span>
            </Space>
          </Dropdown>
        </Header>

        {/* Nội dung trang con sẽ hiển thị ở đây */}
        <Content className="m-4 p-6 bg-white rounded-lg shadow overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;