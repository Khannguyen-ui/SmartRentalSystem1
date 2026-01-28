import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, HomeFilled, QuestionCircleOutlined } from '@ant-design/icons';
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
      const email = values.email.trim();
      const success = await login(email, values.password);

      if (success) {
        const role = localStorage.getItem('role'); 

        // 1. Chặn Admin ở cổng người dùng
        if (role === 'ADMIN') {
          await logout();
          message.warning("Cổng này dành cho Người dùng. Đang chuyển hướng...");
          setTimeout(() => navigate('/admin/login'), 1500);
          return;
        } 
        
        // 2. Điều hướng Landlord
        if (role === 'LANDLORD') {
          message.success("Chào mừng Chủ trọ quay trở lại!");
          navigate('/landlord/room-list');
        } 
        // 3. Điều hướng Tenant
        else if (role === 'TENANT') {
          message.success("Đăng nhập thành công!");
          navigate('/');
        }
        else {
           navigate('/');
        }

      } else {
         message.error("Sai email hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50"></div>

      <Card 
        className="w-full max-w-md shadow-2xl rounded-2xl relative z-10 border-none" 
        bordered={false}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
             <div className="bg-orange-100 p-3 rounded-full">
                <HomeFilled className="text-4xl text-[#f96302]" />
             </div>
          </div>
          <Title level={2} style={{ margin: 0, color: '#f96302' }}>Đăng Nhập</Title>
          <Text type="secondary">Chào mừng bạn đến với Smart Rental</Text>
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
              { required: true, message: 'Vui lâu nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="Email của bạn" 
              className="rounded-lg h-12"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            style={{ marginBottom: 8 }} // Giảm margin để nhường chỗ cho link quên mật khẩu
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="Mật khẩu" 
              className="rounded-lg h-12"
            />
          </Form.Item>

          {/* 🟢 KHỐI QUÊN MẬT KHẨU ĐÃ CẬP NHẬT */}
          <div className="flex justify-end mb-6">
            <Link 
              to="/forgot-password" 
              className="text-[#f96302] hover:text-[#d85502] transition-colors flex items-center gap-1 font-medium"
            >
              <QuestionCircleOutlined /> Quên mật khẩu?
            </Link>
          </div>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-[#f96302] hover:bg-[#d85502] border-none h-12 font-bold text-lg rounded-lg shadow-md uppercase transition-all"
              loading={loading}
            >
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
          
          <Divider plain className="text-gray-400">Hoặc</Divider>

          <div className="text-center flex flex-col gap-4">
             <div className="text-sm text-gray-600">
                Bạn chưa có tài khoản? <Link to="/register" className="text-blue-500 hover:text-blue-600 font-bold">Đăng ký ngay</Link>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 transition-all hover:bg-orange-100/50">
                <Text type="secondary" className="text-xs block mb-1">Bạn là chủ bất động sản?</Text>
                <Link to="/register-landlord" className="text-[#f96302] font-extrabold flex items-center justify-center gap-2 uppercase tracking-wide">
                   Hợp tác cùng chúng tôi <HomeFilled />
                </Link>
            </div>
          </div>

        </Form>
      </Card>
    </div>
  );
};

export default Login;