import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const { Title, Text } = Typography;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth(); // Lấy thêm logout để kick nếu sai role
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);

      if (success) {
        const role = localStorage.getItem('role');
        
        // CHỈ CHO PHÉP ADMIN
        if (role === 'ADMIN') {
          message.success("Xin chào Quản trị viên!");
          navigate('/admin/approve-rooms');
        } else {
          // Nếu Tenant/Landlord cố tình đăng nhập ở đây -> Đăng xuất ngay
          logout(); 
          message.error("Trang này chỉ dành cho Quản trị viên!");
        }
      } else {
         message.error("Sai thông tin đăng nhập!");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card 
        className="w-full max-w-sm shadow-xl rounded-lg border border-gray-700 bg-gray-800" 
        bordered={false}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <SafetyCertificateFilled className="text-5xl text-blue-500" />
          </div>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Admin Portal</Title>
          <Text className="text-gray-400">Hệ thống quản trị Smart Rental</Text>
        </div>

        <Form
          name="admin_login"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Nhập email quản trị!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email Quản trị viên" 
              className="bg-gray-700 text-white border-gray-600 placeholder-gray-400 hover:bg-gray-600 focus:bg-gray-600"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu" 
              className="bg-gray-700 text-white border-gray-600 placeholder-gray-400 hover:bg-gray-600 focus:bg-gray-600"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 border-none h-11 font-bold"
              loading={loading}
            >
              ĐĂNG NHẬP HỆ THỐNG
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center mt-4">
            <Text className="text-gray-500 text-xs">Truy cập trái phép sẽ bị ghi lại IP.</Text>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;