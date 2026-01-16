import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Avatar, Badge, message } from 'antd';
import { 
  UserOutlined, LogoutOutlined, HistoryOutlined, HomeOutlined, 
  HeartOutlined, MessageOutlined, BellOutlined, PlusCircleOutlined 
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Xử lý khi nhấn nút Đăng tin
  const handlePostAd = () => {
    if (!user) {
      message.info("Vui lòng đăng nhập để đăng tin!");
      navigate('/login');
      return;
    }

    if (user.role === 'LANDLORD') {
      navigate('/landlord/create-room');
    } else if (user.role === 'ADMIN') {
      message.warning("Admin không đăng tin trực tiếp.");
    } else {
      // Trường hợp là Tenant (Khách thuê)
      message.warning("Tài khoản của bạn là Khách thuê. Vui lòng đăng ký tài khoản Chủ trọ.");
      navigate('/register-landlord');
    }
  };

  const userMenu = [
    // Menu cho Tenant
    ...(user?.role === 'TENANT' ? [
      {
        key: '1',
        label: <Link to="/tenant/schedule">Lịch hẹn của tôi</Link>,
        icon: <HistoryOutlined />,
      },
      {
        key: '2',
        label: <Link to="/tenant/contracts">Hợp đồng của tôi</Link>,
        icon: <HistoryOutlined />,
      }
    ] : []),
    
    // Menu cho Landlord
    ...(user?.role === 'LANDLORD' ? [
        {
          key: 'landlord-1',
          label: <Link to="/landlord/rooms">Quản lý phòng trọ</Link>,
          icon: <HomeOutlined />,
        },
        {
            key: 'landlord-2',
            label: <Link to="/landlord/appointments">Lịch hẹn xem phòng</Link>,
            icon: <HistoryOutlined />,
        }
    ] : []),

    {
      type: 'divider',
    },
    {
      key: 'logout',
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
          <Link to="/" className="flex items-center gap-2 text-[#f96302] font-bold text-2xl hover:text-orange-600">
            <HomeOutlined /> SMART RENTAL
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            
            {/* Các icon tiện ích (Chỉ hiện khi đã đăng nhập) */}
            {user && (
                <div className="hidden md:flex gap-4 mr-2">
                    <HeartOutlined className="text-xl text-gray-600 hover:text-[#f96302] cursor-pointer"/>
                    <MessageOutlined className="text-xl text-gray-600 hover:text-[#f96302] cursor-pointer"/>
                    <Badge count={7} size="small">
                        <BellOutlined className="text-xl text-gray-600 hover:text-[#f96302] cursor-pointer"/>
                    </Badge>
                </div>
            )}

            {/* --- PHẦN TÁCH BIỆT CHO CHỦ TRỌ --- */}
            
            {/* Nút Quản lý tin (Chỉ hiện cho Landlord) */}
            {user?.role === 'LANDLORD' && (
                <Link to="/landlord/room-list">
                    <Button className="rounded-full font-medium border-gray-300 hover:border-[#f96302] hover:text-[#f96302]">
                        Quản lý tin
                    </Button>
                </Link>
            )}

            {/* Nút Đăng Tin (Luôn hiện để kích thích user click vào) */}
            <Button 
                type="primary" 
                className="bg-black hover:bg-gray-800 border-none rounded-full font-bold px-6"
                icon={<PlusCircleOutlined />}
                onClick={handlePostAd}
            >
                Đăng tin
            </Button>

            {/* User Dropdown hoặc Nút Đăng nhập/Đăng ký */}
            {user ? (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Space className="cursor-pointer hover:bg-gray-100 p-1 pr-3 rounded-full transition border border-gray-200">
                  <Avatar src={user.avatar} icon={<UserOutlined />} className="bg-orange-500" />
                  <span className="hidden md:inline font-medium text-gray-700 max-w-[100px] truncate">
                    {user.fullName}
                  </span>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Link to="/login">
                  <Button type="text" className="font-medium hover:bg-gray-100 rounded-full">Đăng nhập</Button>
                </Link>
                {/* Nút đăng ký cho Landlord tách riêng nếu chưa có tk */}
                <Link to="/register-landlord">
                  <Button type="text" className="font-medium hover:bg-gray-100 rounded-full">Đăng ký Chủ trọ</Button>
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