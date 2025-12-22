import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
// 1. Thêm import Link vào đây
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);

      if (success) {
        message.success("Đăng nhập thành công!");
        const role = localStorage.getItem('role');

        if (role === 'ADMIN') {
          navigate('/admin/approve-rooms');
        } else if (role === 'LANDLORD') {
          navigate('/landlord/create-room');
        } else {
          message.warning("Trang web này chỉ dành cho Admin và Chủ trọ.");
          // navigate('/'); 
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <Card 
        className="w-full max-w-md shadow-2xl rounded-xl" 
        variant="borderless" 
      >
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LoginOutlined className="text-3xl text-blue-600" />
          </div>
          <Title level={3} style={{ margin: 0 }}>Smart Rental System</Title>
          <Text type="secondary">Cổng thông tin quản lý</Text>
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
              placeholder="Email đăng nhập" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="Mật khẩu" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 border-none h-12 font-bold text-lg rounded-lg"
              loading={loading}
            >
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
          
          {/* --- CẬP NHẬT PHẦN NÀY --- */}
          <div className="text-center mt-4 flex flex-col gap-2">
            <Text type="secondary">Chưa có tài khoản?</Text>
            <Link to="/register-landlord" className="text-green-600 font-bold hover:underline">
               Đăng ký làm Chủ Trọ ngay!
            </Link>
          </div>
          {/* ------------------------- */}

        </Form>
      </Card>
    </div>
  );
};

export default Login;