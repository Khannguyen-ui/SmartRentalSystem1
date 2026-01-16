import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, HomeFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth(); 
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Trim khoảng trắng thừa ở email để tránh lỗi nhập liệu
      const email = values.email.trim();
      const success = await login(email, values.password);

      if (success) {
        // Lấy role được lưu trong localStorage sau khi login thành công
        const role = localStorage.getItem('role'); 

        // --- 1. LOGIC CHẶN ADMIN ---
        if (role === 'ADMIN') {
          await logout(); // Đăng xuất ngay lập tức
          message.warning("Cổng này dành cho Người dùng. Đang chuyển sang cổng Admin...");
          
          // Chuyển hướng sang trang đăng nhập Admin sau 1.5s
          setTimeout(() => {
             navigate('/admin/login');
          }, 1500);
          return;
        } 
        
        // --- LOGIC ĐIỀU HƯỚNG THEO QUYỀN (ROLE) ---
        
        // --- 2. LOGIC CHO CHỦ TRỌ (LANDLORD) ---
        if (role === 'LANDLORD') {
          message.success("Chào mừng Chủ trọ quay trở lại!");
          navigate('/landlord/room-list'); // Chuyển về trang quản lý tin đăng
        } 
        
        // --- 3. LOGIC CHO NGƯỜI THUÊ (TENANT) - PHẦN BẠN YÊU CẦU ---
        else if (role === 'TENANT') {
          message.success("Đăng nhập thành công! Bắt đầu tìm phòng nào.");
          // Bạn có thể đổi đường dẫn này thành bất kỳ đâu, ví dụ: '/search', '/profile'
          navigate('/'); // Chuyển về trang chủ
        }

        // --- 4. TRƯỜNG HỢP KHÁC (Fallback) ---
        else {
           navigate('/');
        }

      } else {
         message.error("Đăng nhập thất bại. Sai email hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 bg-[url('https://source.unsplash.com/random/1920x1080/?house')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40"></div>

      <Card 
        className="w-full max-w-md shadow-2xl rounded-xl relative z-10" 
        bordered={false}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
             <HomeFilled className="text-4xl text-[#f96302]" />
          </div>
          <Title level={3} style={{ margin: 0, color: '#333' }}>Đăng Nhập</Title>
          <Text type="secondary">Smart Rental System</Text>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="Email" 
              className="rounded-md"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="Mật khẩu" 
              className="rounded-md"
            />
          </Form.Item>

          <div className="flex justify-end mb-4">
            <Link to="/forgot-password" style={{ fontSize: '14px', color: '#f96302' }}>
                Quên mật khẩu?
            </Link>
          </div>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-[#f96302] hover:bg-orange-600 border-none h-11 font-bold text-lg rounded-md"
              loading={loading}
            >
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
          
          <Divider plain>Hoặc</Divider>

          <div className="text-center flex flex-col gap-3">
             <div className="text-sm">
                Bạn chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline font-medium">Đăng ký tìm phòng</Link>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-2">
                <Text type="secondary" className="text-xs">Bạn muốn đăng tin cho thuê?</Text>
                <div className="mt-1">
                    <Link to="/register-landlord" className="text-[#f96302] font-bold hover:underline flex items-center justify-center gap-1">
                       Đăng ký làm Chủ Trọ ngay <HomeFilled />
                    </Link>
                </div>
            </div>
          </div>

        </Form>
      </Card>
    </div>
  );
};

export default Login;