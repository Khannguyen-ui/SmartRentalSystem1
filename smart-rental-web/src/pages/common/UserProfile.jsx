import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Form, Input, Button, message, Upload, 
  Tabs, Row, Col, Statistic, InputNumber, Table, Tag, Typography 
} from 'antd';
import { 
  UserOutlined, UploadOutlined, SaveOutlined, 
  WalletOutlined, HistoryOutlined, CreditCardOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import paymentService from '../../services/paymentService'; 
import useAuth from '../../hooks/useAuth'; 

const { Text } = Typography;

const UserProfile = () => {
  const { user } = useAuth(); 
  const [form] = Form.useForm();
  
  // State chung
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // State cho Ví & Giao dịch
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [loadingPay, setLoadingPay] = useState(false);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        paymentService.getMyWallet(),
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
      // Gọi API update (nếu có)
      message.success("Cập nhật thông tin thành công!");
    } catch (error) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (depositAmount < 10000) {
      return message.warning("Số tiền nạp tối thiểu là 10,000 VNĐ");
    }
    setLoadingPay(true);
    try {
      const res = await paymentService.createPaymentUrl(depositAmount, user.id);
      if (res.data && res.data.url) {
        window.location.href = res.data.url; 
      }
    } catch (error) {
      message.error("Lỗi tạo giao dịch");
    } finally {
      setLoadingPay(false);
    }
  };

  const transactionColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (type) => (
        <Tag color={type === 'DEPOSIT' ? 'green' : 'volcano'}>
          {type === 'DEPOSIT' ? 'Nạp tiền' : 'Trừ phí'}
        </Tag>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      render: (amount) => (
        <span className={amount > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'SUCCESS' ? 'success' : 'default'}>{status}</Tag>
      )
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: <span><UserOutlined /> Thông tin chung</span>,
      children: (
        <Form form={form} layout="vertical" onFinish={handleUpdateInfo} className="mt-4">
          <div className="flex flex-col items-center mb-6">
            {/* SỬA LỖI 2: Thêm || null cho src */}
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
              <Form.Item label="CCCD" name="citizenId">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} className="mt-2">
            Lưu thay đổi
          </Button>
        </Form>
      ),
    },
    {
      key: '2',
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
                    onClick={handleDeposit}
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
            columns={transactionColumns} 
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
    <div className="max-w-4xl mx-auto">
      {/* SỬA LỖI 1: Thay bordered={false} bằng variant="borderless" */}
      <Card className="shadow-md" variant="borderless">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Hồ Sơ Cá Nhân</h2>
        <Tabs defaultActiveKey="1" items={tabItems} size="large" centered />
      </Card>
    </div>
  );
};

export default UserProfile;