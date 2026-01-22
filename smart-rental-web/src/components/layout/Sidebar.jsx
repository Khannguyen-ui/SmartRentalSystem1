import React, { useState, useEffect } from 'react'; 
import { Layout, Menu, Avatar, Typography, Button } from 'antd'; 
import { 
  PieChartOutlined,       
  HomeOutlined, 
  UserOutlined, 
  BellOutlined, 
  SearchOutlined,
  UnorderedListOutlined,  
  WalletOutlined,         
  TeamOutlined,
  ClockCircleOutlined,
  SettingOutlined,      
  LogoutOutlined,       
  QuestionCircleOutlined, 
  FileTextOutlined,     
  LockOutlined,
  CrownOutlined, 
  RocketOutlined,
  MessageOutlined // <--- 1. Import Icon Tin nhắn
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import paymentService from '../../services/paymentService'; 

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định Role
  const isLandlord = user?.role === 'LANDLORD';
  const isTenant = user?.role === 'TENANT'; 

  // State lưu số dư thực tế
  const [realTimeBalance, setRealTimeBalance] = useState(user?.accountBalance || 0);

  // Effect: Gọi API lấy số dư (CHỈ GỌI KHI LÀ LANDLORD)
  useEffect(() => {
    const fetchLatestBalance = async () => {
      if (user?.id && isLandlord) {
        try {
          const res = await paymentService.getMyWallet();
          if (res.data && res.data.walletBalance !== undefined) {
            setRealTimeBalance(res.data.walletBalance);
          }
        } catch (error) {
          console.error("Lỗi cập nhật số dư sidebar:", error);
        }
      }
    };

    fetchLatestBalance();
    
  }, [user, location.pathname, isLandlord]); 

  // --- HÀM HELPER: Định dạng tiền tệ VNĐ ---
  const formatCurrency = (amount) => {
    const value = amount || 0; 
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  // --- 1. Nhóm Menu "Tài khoản" ---
  const accountSettingsGroup = {
    key: 'grp_account',
    label: 'Tài khoản & hỗ trợ', 
    type: 'group',
    children: [
      {
        key: 'sub_account',
        icon: <SettingOutlined />,
        label: 'Tài khoản & thông báo', 
        children: [
          { key: '/profile', icon: <UserOutlined />, label: 'Cài đặt tài khoản' }, 
          { key: '/change-password', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
        ],
      },
      {
        key: 'sub_help',
        icon: <FileTextOutlined />,
        label: 'Báo giá & hướng dẫn', 
        children: [
          { key: '/pricing', label: 'Báo giá' },
          { key: '/payment-guide', label: 'Hướng dẫn thanh toán' },
          { key: '/usage-guide', icon: <QuestionCircleOutlined />, label: 'Hướng dẫn sử dụng' },
        ],
      },
      { 
        key: 'logout', 
        icon: <LogoutOutlined />, 
        label: 'Đăng xuất', 
        danger: true 
      },
    ],
  };

  // --- Các menu role ---
  const adminItems = [
    { type: 'group', label: 'Quản lý', children: [
        { key: '/admin/dashboard', icon: <PieChartOutlined />, label: 'Thống kê hệ thống' },
        { key: '/admin/approve-rooms', icon: <HomeOutlined />, label: 'Duyệt tin đăng' },
        { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
        { key: '/admin/master-data', icon: <BellOutlined />, label: 'Dữ liệu nền (Master)' },
    ]},
    accountSettingsGroup 
  ];

  const landlordItems = [
    { type: 'group', label: 'Quản lý', children: [
        { key: '/landlord/dashboard', icon: <PieChartOutlined />, label: 'Tổng quan' }, 
        { key: '/landlord/create-room', icon: <HomeOutlined />, label: 'Đăng tin mới' },
        { key: '/landlord/room-list', icon: <UnorderedListOutlined />, label: 'Tin đã đăng' },
        { key: '/landlord/customers', icon: <TeamOutlined />, label: 'Khách thuê' },
        { key: '/landlord/appointments', icon: <ClockCircleOutlined />, label: 'Lịch hẹn' },
        
        // --- 2. THÊM MỤC TIN NHẮN CHO CHỦ TRỌ ---
        { key: '/messages', icon: <MessageOutlined />, label: 'Tin nhắn' },

        { key: '/landlord/finance', icon: <WalletOutlined />, label: 'Tài chính & Ví' },
    ]},
    accountSettingsGroup 
  ];

  const tenantItems = [
    { type: 'group', label: 'Tiện ích', children: [
        { key: '/', icon: <SearchOutlined />, label: 'Tìm phòng ngay' },
        { key: '/tenant/appointments', icon: <ClockCircleOutlined />, label: 'Lịch hẹn của tôi' }, 
        
        // --- 3. THÊM MỤC TIN NHẮN CHO KHÁCH ---
        { key: '/messages', icon: <MessageOutlined />, label: 'Tin nhắn' },

        { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
    ]},
    
    // --- 4. MỤC NÂNG CẤP (Dùng key /kyc như bạn yêu cầu) ---
    { type: 'divider' },
    { 
        key: '/kyc', 
        icon: <RocketOutlined style={{ color: '#faad14' }} />, 
        label: <span className="font-semibold text-yellow-600">Đăng tin cho thuê</span> 
    },

    accountSettingsGroup 
  ];

  const getMenuItems = () => {
      switch (user?.role) {
          case 'ADMIN': return adminItems;
          case 'LANDLORD': return landlordItems;
          case 'TENANT': return tenantItems;
          default: return [];
      }
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
        if (logout) logout(); 
        navigate('/login');
    } else {
        navigate(key);
    }
  };

  return (
    <Sider width={260} theme="light" collapsible breakpoint="lg" style={{ borderRight: '1px solid #f0f0f0' }}>
      {/* LOGO */}
      <div 
        className="h-16 flex items-center justify-center font-bold text-xl cursor-pointer border-b border-gray-200"
        onClick={() => navigate('/')} 
        style={{ color: '#E03C31' }} 
      >
        <HomeOutlined className="mr-2" /> SMART RENTAL
      </div>

      {/* --- USER INFO CARD --- */}
      {user && (
        <div className="p-4 flex flex-col items-center bg-gray-50 border-b border-gray-200">
            <Avatar size={64} icon={<UserOutlined />} src={user.avatar} className="mb-2" />
            <Text strong className="text-lg">{user.fullName || 'Người dùng'}</Text>
            
            {/* --- TRƯỜNG HỢP 1: LANDLORD (Hiện ví tiền) --- */}
            {isLandlord && (
              <>
                <Text type="secondary" className="text-xs mb-2">{user.point || 0} điểm</Text>
                
                <div className="w-full bg-white p-2 rounded border border-gray-200 mt-2">
                    <div className="flex justify-between items-center">
                        <Text type="secondary" style={{fontSize: 12}}>Số dư:</Text>
                        <Text strong style={{color: '#E03C31'}}>
                          {formatCurrency(realTimeBalance)} 
                        </Text>
                    </div>
                    <button 
                        className="w-full mt-2 bg-black text-white text-xs py-1 rounded hover:opacity-80 transition"
                        onClick={() => navigate('/landlord/finance')}
                    >
                        <WalletOutlined /> Nạp Tiền
                    </button>
                </div>
              </>
            )}

            {/* --- TRƯỜNG HỢP 2: TENANT (Hiện nút Nâng cấp) --- */}
            {isTenant && (
                <div className="w-full mt-3">
                    <div className="bg-orange-50 p-2 rounded border border-orange-200 text-center">
                        <CrownOutlined className="text-2xl text-orange-500 mb-1" />
                        <Text strong className="block text-xs text-orange-800 mb-2">Bạn có phòng cho thuê?</Text>
                        <Button 
                            type="primary" 
                            size="small" 
                            className="bg-orange-500 border-orange-500 hover:bg-orange-600 w-full text-xs font-bold"
                            onClick={() => navigate('/kyc')} // Key trỏ về trang KYC
                        >
                            Đăng ký Chủ trọ ngay
                        </Button>
                    </div>
                </div>
            )}
        </div>
      )}
      
      {/* MENU */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['grp_account', 'sub_account']} 
        items={getMenuItems()}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;