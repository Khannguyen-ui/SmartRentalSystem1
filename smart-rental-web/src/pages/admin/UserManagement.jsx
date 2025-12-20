import React, { useEffect, useState } from 'react';
import { Table, Card, Input, Tag, Button, Avatar, Typography, Tooltip, message, Popconfirm, Space } from 'antd';
import { SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import userService from '../../services/userService';

const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // --- 1. Load dữ liệu ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      // Nếu API chưa có, ta dùng dữ liệu giả để test giao diện
      console.log("Dùng dữ liệu giả do API lỗi: ", error);
      setUsers([
        { id: 1, fullName: 'Nguyễn Văn Admin', email: 'admin@gmail.com', phone: '0909123456', role: 'ADMIN', active: true },
        { id: 2, fullName: 'Trần Chủ Trọ', email: 'chutro@gmail.com', phone: '0912345678', role: 'LANDLORD', active: true },
        { id: 3, fullName: 'Lê Văn Khách', email: 'khach@gmail.com', phone: '0987654321', role: 'USER', active: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- 2. Xử lý Khóa/Mở khóa ---
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.active;
      // Gọi API (Nếu backend đã hỗ trợ)
      // await userService.updateUserStatus(user.id, newStatus);
      
      // Update State tạm thời (Optimistic Update)
      const newUsers = users.map(u => u.id === user.id ? { ...u, active: newStatus } : u);
      setUsers(newUsers);
      
      message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.email}`);
    } catch (error) {
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- 3. Cấu hình Cột bảng ---
  const columns = [
    {
      title: 'Thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar size="large" icon={<UserOutlined />} src={record.avatar} style={{ backgroundColor: '#87d068' }} />
          <div className="flex flex-col">
            <Text strong className="text-gray-800">{text}</Text>
            <span className="text-xs text-gray-400">ID: {record.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'email',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-600">
             <MailOutlined /> <span>{record.email}</span>
          </div>
          {record.phone && (
             <div className="flex items-center gap-2 text-gray-500 text-xs">
                <PhoneOutlined /> <span>{record.phone}</span>
             </div>
          )}
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'ADMIN' },
        { text: 'Chủ trọ', value: 'LANDLORD' },
        { text: 'Người thuê', value: 'USER' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => {
        let color = 'geekblue';
        let label = 'Người thuê';
        if (role === 'ADMIN') { color = 'volcano'; label = 'Quản trị viên'; }
        if (role === 'LANDLORD') { color = 'green'; label = 'Chủ trọ'; }
        return <Tag color={color} className="py-1 px-3 rounded-full font-medium">{label}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'} bordered={false}>
          {active ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
           {/* Không cho phép khóa chính mình (Admin) */}
           {record.role !== 'ADMIN' && (
             <Tooltip title={record.active ? "Khóa tài khoản này" : "Mở khóa tài khoản"}>
                <Popconfirm
                  title={record.active ? "Chặn người dùng này?" : "Mở lại quyền truy cập?"}
                  description={record.active ? "Họ sẽ không thể đăng nhập được nữa." : "Họ sẽ có thể đăng nhập bình thường."}
                  onConfirm={() => handleToggleStatus(record)}
                  okText="Đồng ý"
                  cancelText="Hủy"
                  okButtonProps={{ danger: record.active }}
                >
                  <Button 
                    type={record.active ? 'text' : 'primary'} 
                    danger={record.active} // Nếu đang active thì nút màu đỏ (để khóa)
                    icon={record.active ? <LockOutlined /> : <UnlockOutlined />}
                    className={!record.active ? "bg-green-600" : ""}
                  >
                    {record.active ? "Khóa" : "Mở lại"}
                  </Button>
                </Popconfirm>
             </Tooltip>
           )}
        </Space>
      ),
    },
  ];

  // Logic Search
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Quản Lý Người Dùng</Title>
            <Text type="secondary">Xem danh sách và kiểm soát trạng thái tài khoản</Text>
          </div>
          
          {/* Search Bar */}
          <Input 
            placeholder="Tìm theo tên hoặc email..." 
            prefix={<SearchOutlined className="text-gray-400" />} 
            size="large"
            className="w-full md:w-80 rounded-full shadow-sm"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Card bordered={false} className="shadow-lg rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
          <Table 
            columns={columns} 
            dataSource={filteredUsers} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;