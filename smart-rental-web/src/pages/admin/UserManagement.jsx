import React, { useEffect, useState } from 'react';
import { 
  Table, Card, Input, Tag, Button, Avatar, Typography, Tooltip, 
  message, Popconfirm, Space, Modal, Form, Select, Tabs, Image, Row, Col 
} from 'antd';
import { 
  SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, 
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, 
  CheckCircleOutlined, 
  ReloadOutlined
} from '@ant-design/icons';

// --- 1. SỬA IMPORT: Dùng adminService ---
import adminService from '../../services/adminService'; 
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // State KYC
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedKycUser, setSelectedKycUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingKyc, setProcessingKyc] = useState(false);

  // --- LOAD DỮ LIỆU ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Gọi adminService
      const res = await adminService.getAllUsers(); 
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- CRUD USER ---
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({ ...user, password: '' }); 
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (values) => {
    try {
      if (editingUser) {
        if (!values.password) delete values.password;
        // Gọi adminService.updateUser
        await adminService.updateUser(editingUser.id, values);
        message.success("Cập nhật thành công!");
      } else {
        // Gọi adminService.createUser
        await adminService.createUser(values);
        message.success("Thêm người dùng thành công!");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error(editingUser ? "Cập nhật thất bại" : "Thêm mới thất bại");
    }
  };

  const handleDelete = async (id) => {
    try {
      // Gọi adminService.deleteUser
      await adminService.deleteUser(id);
      message.success("Đã xóa tài khoản");
      fetchUsers();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      // Gọi adminService.toggleUserStatus
      await adminService.toggleUserStatus(user.id);
      message.success("Cập nhật trạng thái thành công");
      fetchUsers();
    } catch (error) {
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- LOGIC DUYỆT KYC ---
  const handleOpenKycModal = (user) => {
    setSelectedKycUser(user);
    setRejectReason("");
    setIsKycModalOpen(true);
  };

  const handleProcessKyc = async (approved) => {
    if (!approved && !rejectReason.trim()) {
      return message.warning("Vui lòng nhập lý do từ chối!");
    }

    setProcessingKyc(true);
    try {
      // --- 2. SỬA TÊN HÀM: approveKYC (viết hoa chữ C) để khớp với adminService.js ---
      await adminService.approveKYC(selectedKycUser.id, {
        approved,
        reason: approved ? "Hồ sơ hợp lệ" : rejectReason
      });
      
      message.success(approved ? "Đã duyệt hồ sơ!" : "Đã từ chối hồ sơ!");
      setIsKycModalOpen(false);
      fetchUsers(); 
    } catch (error) {
      // In lỗi ra console để debug nếu cần
      console.log("KYC Error:", error);
      message.error("Xử lý thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    } finally {
      setProcessingKyc(false);
    }
  };

  // --- Render Nội dung Modal KYC ---
  const renderKycContent = () => {
    if (!selectedKycUser) return null;
    const imgs = selectedKycUser.citizenImages || [];

    return (
        <div>
            <div className="bg-gray-50 p-3 rounded mb-4 border">
                <p><strong>Họ tên:</strong> {selectedKycUser.fullName}</p>
                <p><strong>Số CCCD:</strong> <span className="text-blue-600 font-bold">{selectedKycUser.citizenId}</span></p>
                <p><strong>Email:</strong> {selectedKycUser.email}</p>
            </div>
            
            <p className="font-semibold mb-2">Hình ảnh giấy tờ:</p>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <div className="text-center text-xs text-gray-500 mb-1">Mặt trước</div>
                    <Image 
                        src={imgs[0]} 
                        fallback="https://via.placeholder.com/300x200?text=No+Image"
                        className="rounded border object-cover h-40 w-full"
                    />
                </Col>
                <Col span={12}>
                    <div className="text-center text-xs text-gray-500 mb-1">Mặt sau</div>
                    <Image 
                        src={imgs[1]} 
                        fallback="https://via.placeholder.com/300x200?text=No+Image"
                        className="rounded border object-cover h-40 w-full"
                    />
                </Col>
            </Row>

            <div className="mt-4 pt-4 border-t">
                <p className="text-sm mb-1 text-gray-600">Lý do từ chối (Nếu chọn Từ chối):</p>
                <TextArea 
                    rows={2} 
                    placeholder="Nhập lý do..." 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                />
            </div>
        </div>
    );
  };

  // --- CẤU HÌNH CỘT ---
  const userColumns = [
    {
      title: 'Thành viên',
      dataIndex: 'fullName',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} src={record.avatarUrl} />
          <div>
            <Text strong>{text}</Text>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      render: (role) => <Tag color={role === 'ADMIN' ? 'red' : (role === 'LANDLORD' ? 'green' : 'blue')}>{role}</Tag>
    },
    {
      title: 'Định danh (KYC)',
      dataIndex: 'kycStatus',
      render: (status) => {
          let color = status === 'VERIFIED' ? 'success' : (status === 'PENDING' ? 'warning' : 'default');
          return <Tag icon={status === 'VERIFIED' ? <CheckCircleOutlined/> : null} color={color}>{status || 'UNVERIFIED'}</Tag>
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      render: (active) => <Tag color={active ? 'success' : 'error'}>{active ? 'Hoạt động' : 'Đã khóa'}</Tag>
    },
    {
      title: 'Hành động',
      align: 'right',
      render: (_, record) => (
        <Space>
           <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)} /></Tooltip>
           {record.role !== 'ADMIN' && (
             <Popconfirm title="Đổi trạng thái?" onConfirm={() => handleToggleStatus(record)}>
                <Button size="small" danger={record.active} icon={record.active ? <LockOutlined /> : <UnlockOutlined />} />
             </Popconfirm>
           )}
           {record.role !== 'ADMIN' && (
             <Popconfirm title="Xóa vĩnh viễn?" onConfirm={() => handleDelete(record.id)}>
                <Button danger icon={<DeleteOutlined />} size="small" />
             </Popconfirm>
           )}
        </Space>
      ),
    },
  ];

  const kycColumns = [
      { title: 'ID', dataIndex: 'id', width: 60 },
      { 
          title: 'Người yêu cầu', 
          render: (_, r) => <div><b>{r.fullName}</b><br/><span className="text-xs text-gray-500">{r.email}</span></div> 
      },
      { title: 'Số CCCD', dataIndex: 'citizenId', render: t => <Tag color="blue">{t}</Tag> },
      { title: 'Thời gian', dataIndex: 'createdAt', render: d => dayjs(d).format('DD/MM HH:mm') },
      {
          title: 'Thao tác',
          align: 'right',
          render: (_, record) => (
              <Button type="primary" icon={<EyeOutlined />} onClick={() => handleOpenKycModal(record)}>
                  Xem & Duyệt
              </Button>
          )
      }
  ];

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const pendingKycList = users.filter(u => u.kycStatus === 'PENDING');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-4">
            <div>
                <Title level={3} style={{margin:0}}>Quản Trị Hệ Thống</Title>
                <Text type="secondary">Quản lý người dùng và duyệt hồ sơ định danh</Text>
            </div>
            <Space>
                <Input 
                    placeholder="Tìm kiếm..." 
                    prefix={<SearchOutlined/>} 
                    onChange={e => setSearchText(e.target.value)} 
                    style={{width: 250}}
                />
                <Button icon={<ReloadOutlined/>} onClick={fetchUsers}>Làm mới</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>Thêm User</Button>
            </Space>
        </div>

        <Card bordered={false} className="shadow-lg rounded-lg">
            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: (
                        <span>
                            Yêu cầu duyệt KYC 
                            {pendingKycList.length > 0 && <Tag color="red" className="ml-2">{pendingKycList.length}</Tag>}
                        </span>
                    ),
                    children: (
                        <Table 
                            dataSource={pendingKycList} 
                            columns={kycColumns} 
                            rowKey="id" 
                            loading={loading}
                            locale={{ emptyText: 'Hiện không có yêu cầu nào cần duyệt' }}
                        />
                    )
                },
                {
                    key: '2',
                    label: 'Danh sách tất cả người dùng',
                    children: (
                        <Table 
                            dataSource={filteredUsers} 
                            columns={userColumns} 
                            rowKey="id" 
                            loading={loading}
                            pagination={{ pageSize: 8 }}
                        />
                    )
                }
            ]} />
        </Card>

        {/* MODAL USER CRUD */}
        <Modal
            title={editingUser ? "Cập Nhật User" : "Thêm User Mới"}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            okText="Lưu"
        >
            <Form form={form} layout="vertical" onFinish={handleSaveUser}>
                <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input disabled={!!editingUser}/></Form.Item>
                <Form.Item name="phone" label="SĐT"><Input /></Form.Item>
                <Form.Item name="role" label="Vai trò" initialValue="TENANT">
                    <Select>
                        <Option value="TENANT">Người thuê</Option>
                        <Option value="LANDLORD">Chủ trọ</Option>
                        <Option value="ADMIN">Admin</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: !editingUser }]}><Input.Password placeholder={editingUser ? "Nhập nếu muốn đổi" : ""} /></Form.Item>
            </Form>
        </Modal>

        {/* MODAL DUYỆT KYC */}
        <Modal
            title="Duyệt Hồ Sơ Định Danh"
            open={isKycModalOpen}
            onCancel={() => setIsKycModalOpen(false)}
            width={700}
            footer={[
                <Button key="cancel" onClick={() => setIsKycModalOpen(false)}>Thoát</Button>,
                <Button 
                    key="reject" 
                    danger 
                    loading={processingKyc} 
                    onClick={() => handleProcessKyc(false)}
                >
                    Từ chối
                </Button>,
                <Button 
                    key="approve" 
                    type="primary" 
                    className="bg-green-600 hover:bg-green-500"
                    loading={processingKyc} 
                    onClick={() => handleProcessKyc(true)}
                >
                    Duyệt Hồ Sơ
                </Button>
            ]}
        >
            {renderKycContent()}
        </Modal>

      </div>
    </div>
  );
};

export default UserManagement;