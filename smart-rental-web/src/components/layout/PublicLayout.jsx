import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Avatar, Badge, message, Modal } from 'antd';
import { 
  UserOutlined, LogoutOutlined, HistoryOutlined, HomeOutlined, 
  HeartOutlined, MessageOutlined, BellOutlined, PlusCircleOutlined,
  ExclamationCircleOutlined, IdcardOutlined // Thêm icon ID Card cho Modal KYC
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService'; 

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Xử lý khi nhấn nút Đăng tin
  const handlePostAd = () => {
    // 1. Kiểm tra đăng nhập
    if (!user) {
      message.info("Vui lòng đăng nhập để đăng tin!");
      navigate('/login');
      return;
    }

    // 2. Kiểm tra Role
    if (user.role === 'LANDLORD') {
      // Nếu là Chủ trọ -> Cho phép vào trang đăng tin
      navigate('/landlord/create-room');
    } else if (user.role === 'ADMIN') {
      message.warning("Admin không đăng tin trực tiếp.");
    } else {
      // 3. Trường hợp là Tenant (Khách thuê)
            if (user.kycStatus !== 'VERIFIED') {
        Modal.confirm({
          title: 'Yêu cầu xác minh danh tính',
          icon: <IdcardOutlined style={{ color: '#faad14' }} />, // Icon màu vàng cảnh báo
          content: (
            <div>
              <p>Để đảm bảo tin cậy, bạn cần <b>xác minh danh tính (eKYC)</b> trước khi có thể đăng tin cho thuê.</p>
              <p className="text-gray-500 text-xs">Quá trình này giúp xác thực bạn là người dùng thật.</p>
            </div>
          ),
          okText: 'Xác minh ngay',
          cancelText: 'Để sau',
          onOk: () => {
            navigate('/kyc'); // Chuyển hướng sang trang KYC
          }
        });
        return; // Dừng hàm lại, không chạy logic nâng cấp bên dưới
      }

      // --- BƯỚC 3.2: NẾU ĐÃ KYC -> GỢI Ý NÂNG CẤP ---
      Modal.confirm({
        title: 'Kích hoạt quyền Chủ trọ',
        icon: <ExclamationCircleOutlined />,
        content: 'Tài khoản của bạn đã được xác thực. Bạn cần nâng cấp lên "Chủ trọ" để bắt đầu đăng tin. Bạn có muốn nâng cấp ngay không?',
        okText: 'Nâng cấp ngay',
        cancelText: 'Để sau',
        onOk: async () => {
            try {
                [cite_start]// Gọi API nâng cấp quyền [cite: 1221]
                await userService.upgradeToLandlord();
                message.success("Nâng cấp thành công! Vui lòng đăng nhập lại để hệ thống cập nhật quyền.");
                
                // Đăng xuất để user đăng nhập lại nhận role mới
                logout(); 
            } catch (error) {
                console.error(error);
                message.error("Lỗi nâng cấp: " + (error.response?.data?.message || "Vui lòng thử lại sau"));
            }
        }
      });
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