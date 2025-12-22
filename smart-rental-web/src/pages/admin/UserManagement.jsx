import React, { useEffect, useState } from 'react';
import { Table, Card, Input, Tag, Button, Avatar, Typography, Tooltip, message, Popconfirm, Space, Modal, Form, Select } from 'antd';
import { SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, MailOutlined, PhoneOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import userService from '../../services/userService';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // --- State cho Modal Thêm/Sửa ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Nếu null => Thêm mới
  const [form] = Form.useForm();

  // --- 1. Load dữ liệu ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- 2. Xử lý Thêm / Sửa ---
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      // Nếu là sửa: Fill dữ liệu vào form (bỏ password vì ko hiển thị pass cũ)
      form.setFieldsValue({
          ...user,
          password: '' // Reset pass để trống
      }); 
    } else {
      // Nếu là thêm mới: Reset sạch form
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (values) => {
    try {
      if (editingUser) {
        // --- LOGIC SỬA (PUT) ---
        // Nếu không nhập pass mới thì xóa trường password khỏi payload để backend không đổi pass
        if (!values.password) delete values.password;
        
        await userService.updateUser(editingUser.id, values);
        message.success("Cập nhật thành công!");
      } else {
        // --- LOGIC THÊM MỚI (POST) ---
        await userService.createUser(values);
        message.success("Thêm người dùng thành công!");
      }
      setIsModalOpen(false);
      fetchUsers(); // Load lại bảng
    } catch (error) {
      console.error(error);
      message.error(editingUser ? "Cập nhật thất bại" : "Thêm mới thất bại (Email có thể đã tồn tại)");
    }
  };

  // --- 3. Xử lý Xóa (DELETE) ---
  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      message.success("Đã xóa tài khoản vĩnh viễn");
      fetchUsers();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  // --- 4. Xử lý Khóa/Mở khóa (PUT Status) ---
  const handleToggleStatus = async (user) => {
    // Optimistic Update
    const newStatus = !user.active;
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, active: newStatus } : u);
    setUsers(updatedUsers);

    try {
      await userService.updateUserStatus(user.id);
      message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.email}`);
    } catch (error) {
      message.error("Lỗi cập nhật trạng thái");
      fetchUsers(); // Rollback nếu lỗi
    }
  };

  // --- Cấu hình Cột bảng ---
  const columns = [
    {
      title: 'Thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar size="large" icon={<UserOutlined />} src={record.avatar} style={{ backgroundColor: record.active ? '#87d068' : '#ccc' }} />
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
          {record.phone ? (
             <div className="flex items-center gap-2 text-gray-500 text-xs">
                <PhoneOutlined /> <span>{record.phone}</span>
             </div>
          ) : <span className="text-xs text-gray-400 italic">Chưa có SĐT</span>}
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'geekblue';
        let label = 'Người thuê';
        if (role === 'ADMIN') { color = 'volcano'; label = 'Quản trị viên'; }
        if (role === 'LANDLORD') { color = 'green'; label = 'Chủ trọ'; }
        return <Tag color={color} className="rounded-full font-medium">{label}</Tag>;
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
           {/* Nút Sửa */}
           <Tooltip title="Sửa thông tin">
              <Button 
                icon={<EditOutlined />} 
                size="small"
                className="text-blue-600 border-blue-600"
                onClick={() => handleOpenModal(record)}
              />
           </Tooltip>

           {/* Nút Khóa / Mở Khóa */}
           {record.role !== 'ADMIN' && (
             <Tooltip title={record.active ? "Khóa tài khoản" : "Mở khóa"}>
                <Popconfirm
                  title={record.active ? "Khóa tài khoản này?" : "Mở lại quyền truy cập?"}
                  onConfirm={() => handleToggleStatus(record)}
                  okButtonProps={{ danger: record.active }}
                >
                  <Button 
                    size="small"
                    type={record.active ? 'text' : 'primary'} 
                    danger={record.active} 
                    icon={record.active ? <LockOutlined /> : <UnlockOutlined />}
                    className={!record.active ? "bg-green-600 border-none" : ""}
                  />
                </Popconfirm>
             </Tooltip>
           )}

           {/* Nút Xóa Vĩnh Viễn */}
           {record.role !== 'ADMIN' && (
             <Tooltip title="Xóa vĩnh viễn">
                <Popconfirm
                  title="Xóa vĩnh viễn người dùng này?"
                  description="Hành động này không thể hoàn tác!"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa ngay"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
             </Tooltip>
           )}
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header + Search + Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Quản Lý Người Dùng</Title>
            <Text type="secondary">Tổng số: {users.length} tài khoản</Text>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Input 
                placeholder="Tìm tên hoặc email..." 
                prefix={<SearchOutlined className="text-gray-400" />} 
                size="large"
                className="w-full md:w-64 rounded-lg"
                onChange={(e) => setSearchText(e.target.value)}
            />
            <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                className="bg-blue-600 font-medium rounded-lg"
                onClick={() => handleOpenModal(null)}
            >
                Thêm Mới
            </Button>
          </div>
        </div>

        <Card bordered={false} className="shadow-lg rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
          <Table 
            columns={columns} 
            dataSource={filteredUsers} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
        </Card>

        {/* --- MODAL FORM THÊM / SỬA --- */}
        <Modal
            title={editingUser ? "Cập Nhật Thông Tin" : "Thêm Người Dùng Mới"}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            okText={editingUser ? "Lưu thay đổi" : "Tạo mới"}
            centered
        >
            <Form form={form} layout="vertical" onFinish={handleSaveUser}>
                <Form.Item 
                    name="fullName" 
                    label="Họ và tên" 
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Nhập họ tên đầy đủ" />
                </Form.Item>

                <Form.Item 
                    name="email" 
                    label="Email" 
                    rules={[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="example@gmail.com" disabled={!!editingUser} />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item 
                        name="phone" 
                        label="Số điện thoại"
                        rules={[{ pattern: /^[0-9]{10,11}$/, message: 'SĐT không hợp lệ' }]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" />
                    </Form.Item>

                    <Form.Item 
                        name="role" 
                        label="Vai trò" 
                        initialValue="USER"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="USER">Người thuê (User)</Option>
                            <Option value="LANDLORD">Chủ trọ (Landlord)</Option>
                            <Option value="ADMIN">Quản trị viên (Admin)</Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item 
                    name="password" 
                    label={editingUser ? "Mật khẩu mới (Bỏ trống nếu không đổi)" : "Mật khẩu"}
                    rules={[
                        // Nếu là thêm mới -> Bắt buộc nhập. Nếu là sửa -> Không bắt buộc
                        { required: !editingUser, message: 'Vui lòng nhập mật khẩu' },
                        { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="********" />
                </Form.Item>
            </Form>
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;