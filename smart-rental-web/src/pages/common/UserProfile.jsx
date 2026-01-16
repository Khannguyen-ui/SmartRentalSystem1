import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Form, Input, Button, message, Upload, 
  Tabs, Row, Col, Statistic, InputNumber, Table, Tag, Typography, Modal, Alert 
} from 'antd';
import { 
  UserOutlined, UploadOutlined, SaveOutlined, 
  WalletOutlined, HistoryOutlined, CreditCardOutlined, 
  SafetyCertificateOutlined, ArrowUpOutlined, IdcardOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import paymentService from '../../services/paymentService'; 
import userService from '../../services/userService'; // Cần thêm userService
import useAuth from '../../hooks/useAuth'; 
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const UserProfile = () => {
  const { user, logout, refreshProfile } = useAuth(); // refreshProfile để load lại user sau khi nâng cấp
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // State chung
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // State cho Ví & Giao dịch
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [loadingPay, setLoadingPay] = useState(false);

  // State cho Nâng cấp
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    if (user) {
        fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        paymentService.getMyWallet(), // Hoặc userService.getProfile()
        paymentService.getMyHistory()
      ]);

      const userData = profileRes.data;
      
      // 1. Fill thông tin cá nhân
      setAvatarUrl(userData.avatarUrl);
      setBalance(userData.walletBalance); 
      form.setFieldsValue({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        citizenId: userData.citizenId
      });

      // 2. Fill lịch sử giao dịch
      setTransactions(historyRes.data);

    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateInfo = async (values) => {
    setLoading(true);
    try {
      await userService.updateProfile(values); // API update
      message.success("Cập nhật thông tin thành công!");
      refreshProfile(); // Load lại Context
    } catch (error) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    Modal.confirm({
        title: 'Xác nhận nâng cấp tài khoản',
        icon: <ArrowUpOutlined style={{ color: '#1890ff' }} />,
        content: (
            <div>
                <p>Bạn có chắc muốn trở thành <b>Chủ trọ</b>?</p>
                <p className="text-gray-500 text-xs">Bạn sẽ cần đăng nhập lại để hệ thống cập nhật quyền hạn.</p>
            </div>
        ),
        okText: 'Đồng ý',
        cancelText: 'Hủy',
        onOk: async () => {
            setLoadingUpgrade(true);
            try {
                await userService.upgradeToLandlord();
                message.success("Nâng cấp thành công! Đang chuyển về trang đăng nhập...");
                
                await logout(); // Logout để xóa Token cũ
                setTimeout(() => navigate('/login'), 1500);
            } catch (error) {
                message.error(error.response?.data?.message || "Có lỗi xảy ra");
            } finally {
                setLoadingUpgrade(false);
            }
        }
    });
  };

  // --- TAB 3: LOGIC HIỂN THỊ KYC ---
  const renderKycStatus = () => {
      const status = user?.kycStatus || 'UNVERIFIED';
      
      let color = 'default';
      let text = 'Chưa xác minh';
      let desc = 'Vui lòng xác minh danh tính để đảm bảo an toàn và sử dụng các tính năng nâng cao.';

      if (status === 'VERIFIED') {
          color = 'success';
          text = 'Đã xác minh';
          desc = 'Tài khoản của bạn đã được xác minh chính chủ.';
      } else if (status === 'PENDING') {
          color = 'warning';
          text = 'Đang chờ duyệt';
          desc = 'Hồ sơ của bạn đang được Admin kiểm tra. Vui lòng chờ.';
      } else if (status === 'REJECTED') {
          color = 'error';
          text = 'Bị từ chối';
          desc = 'Hồ sơ không hợp lệ. Vui lòng kiểm tra lại ảnh và gửi lại.';
      }

      return (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-gray-700">Trạng thái định danh</span>
                  <Tag color={color} style={{ fontSize: '14px', padding: '4px 10px' }}>
                      {text.toUpperCase()}
                  </Tag>
              </div>
              <p className="text-gray-600 mb-6">{desc}</p>

              {/* Nút gửi yêu cầu (Chỉ hiện khi chưa verified hoặc bị từ chối) */}
              {(status === 'UNVERIFIED' || status === 'REJECTED') && (
                  <Button 
                    type="primary" 
                    icon={<IdcardOutlined />} 
                    onClick={() => navigate('/kyc')} // Chuyển sang trang KycVerification.jsx đã làm ở câu trước
                  >
                      Gửi hồ sơ xác minh ngay
                  </Button>
              )}
          </div>
      );
  };

  const tabItems = [
    {
      key: '1',
      label: <span><UserOutlined /> Thông tin chung</span>,
      children: (
        <Form form={form} layout="vertical" onFinish={handleUpdateInfo} className="mt-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar 
              size={100} 
              src={avatarUrl || null} 
              icon={<UserOutlined />} 
              className="mb-4 bg-gray-200" 
            />
            <Upload showUploadList={false}>
              <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
            </Upload>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input disabled className="bg-gray-50 text-gray-500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="SĐT" name="phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CCCD (Tự động điền khi KYC)" name="citizenId">
                <Input disabled /> 
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} className="mt-2">
            Lưu thay đổi
          </Button>

          {/* --- PHẦN NÂNG CẤP CHỦ TRỌ --- */}
          {user?.role === 'TENANT' && (
             <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                <Alert
                    message="Bạn có phòng trống muốn cho thuê?"
                    description={
                        <div className="mt-2">
                            <p className="mb-2 text-sm text-gray-600">Nâng cấp tài khoản lên <b>Chủ trọ</b> để đăng tin và quản lý phòng trọ ngay hôm nay.</p>
                            <Button 
                                type="primary" 
                                ghost 
                                icon={<ArrowUpOutlined />} 
                                onClick={handleUpgrade}
                                loading={loadingUpgrade}
                                disabled={user.kycStatus !== 'VERIFIED'} // (Tùy chọn) Bắt buộc KYC mới cho nâng cấp
                            >
                                Kích hoạt Chế độ Chủ trọ
                            </Button>
                            {user.kycStatus !== 'VERIFIED' && (
                                <div className="text-red-500 text-xs mt-1">* Bạn cần xác minh danh tính trước khi nâng cấp.</div>
                            )}
                        </div>
                    }
                    type="info"
                    showIcon
                    icon={<HomeOutlined />}
                />
             </div>
          )}
        </Form>
      ),
    },
    {
      key: '2',
      label: <span><SafetyCertificateOutlined /> Bảo mật & Định danh</span>,
      children: renderKycStatus(),
    },
    {
      key: '3',
      label: <span><WalletOutlined /> Ví & Giao dịch</span>,
      children: (
        <div className="mt-4">
          <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-100">
            <Row gutter={24} align="middle">
              <Col span={10} className="border-r border-gray-300">
                <Statistic
                  title="Số dư khả dụng"
                  value={balance}
                  precision={0}
                  valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: '2rem' }}
                  prefix={<WalletOutlined />}
                  suffix="VNĐ"
                />
              </Col>
              <Col span={14}>
                <Text strong className="block mb-2">Nạp tiền (VNPay):</Text>
                <div className="flex gap-3">
                  <InputNumber
                    className="w-full max-w-xs"
                    addonAfter="VNĐ"
                    defaultValue={50000}
                    step={10000}
                    min={10000}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    onChange={setDepositAmount}
                  />
                  <Button 
                    type="primary" 
                    icon={<CreditCardOutlined />} 
                    loading={loadingPay}
                    onClick={() => {/* Hàm nạp tiền cũ */}} // Bạn tự điền lại hàm handleDeposit
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    Thanh toán ngay
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          <h3 className="font-bold text-lg mb-3 flex items-center">
            <HistoryOutlined className="mr-2" /> Lịch sử giao dịch
          </h3>
          <Table 
            columns={[
                /* Copy lại columns từ code cũ */
                { title: 'Thời gian', dataIndex: 'createdAt', render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm') },
                { title: 'Loại', dataIndex: 'type', render: (type) => <Tag color={type === 'DEPOSIT' ? 'green' : 'volcano'}>{type}</Tag> },
                { title: 'Số tiền', dataIndex: 'amount', render: (amount) => <span>{amount.toLocaleString()} đ</span> },
                { title: 'Trạng thái', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> }
            ]} 
            dataSource={transactions} 
            rowKey="id"
            pagination={{ pageSize: 5 }}
            bordered
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-md" bordered={false}>
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Hồ Sơ Cá Nhân</h2>
        <Tabs defaultActiveKey="1" items={tabItems} size="large" centered />
      </Card>
    </div>
  );
};

// Nhớ import HomeOutlined nếu dùng trong Alert
import { HomeOutlined } from '@ant-design/icons';

export default UserProfile;