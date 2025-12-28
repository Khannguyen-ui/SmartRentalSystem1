import React, { useEffect, useState } from 'react';
import { 
  Tabs, Card, Statistic, Button, Table, Tag, List, 
  Avatar, InputNumber, message, Modal, Typography, Row, Col, Badge 
} from 'antd';
import { 
  WalletOutlined, BellOutlined, HistoryOutlined, 
  CheckCircleOutlined, DollarOutlined, CreditCardOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import paymentService from '../../services/paymentService';
import notificationService from '../../services/notificationService';
import useAuth from '../../hooks/useAuth'; 

const { Title, Text } = Typography;

const LandlordFinance = () => {
  const { user } = useAuth(); // Lấy thông tin user đăng nhập
  const [activeTab, setActiveTab] = useState('1');

  // --- STATE VÍ TIỀN ---
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [loadingPay, setLoadingPay] = useState(false);

  // --- STATE THÔNG BÁO ---
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);

  // === 1. LOGIC VÍ & THANH TOÁN ===
  const fetchWalletData = async () => {
    try {
      // Gọi song song lấy Profile (số dư) và Lịch sử
      const [profileRes, historyRes] = await Promise.all([
        paymentService.getMyWallet(),
        paymentService.getMyHistory()
      ]);
      
      setBalance(profileRes.data.walletBalance);
      setTransactions(historyRes.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu ví", error);
    }
  };

  const handleDeposit = async () => {
    if (depositAmount < 10000) {
      return message.warning("Số tiền nạp tối thiểu là 10,000 VNĐ");
    }
    setLoadingPay(true);
    try {
      // Gọi API tạo link VNPay
      const res = await paymentService.createPaymentUrl(depositAmount, user.id);
      if (res.data && res.data.url) {
        // Chuyển hướng sang trang VNPay
        window.location.href = res.data.url;
      }
    } catch (error) {
      message.error("Không thể tạo giao dịch. Vui lòng thử lại.");
      setLoadingPay(false);
    }
  };

  const transactionColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = type === 'DEPOSIT' ? 'green' : 'volcano';
        let text = type === 'DEPOSIT' ? 'Nạp tiền' : 'Phí đăng tin';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={amount > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'SUCCESS' ? 'success' : 'error'}>
          {status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </Tag>
      )
    }
  ];

  // === 2. LOGIC THÔNG BÁO ===
  const fetchNotifications = async () => {
    setLoadingNoti(true);
    try {
      const res = await notificationService.getMyNotifications();
      setNotifications(res.data);
    } catch (error) {
      console.error("Lỗi tải thông báo", error);
    } finally {
      setLoadingNoti(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      // Cập nhật lại state local để đổi màu
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error(error);
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    fetchWalletData();
    fetchNotifications();
  }, []);

  // === RENDER ===
  const items = [
    {
      key: '1',
      label: (
        <span>
          <WalletOutlined /> Quản lý Ví & Nạp tiền
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Card Số dư & Nạp tiền */}
          <Row gutter={16}>
            <Col span={12}>
              <Card bordered={false} className="bg-blue-50 shadow-sm">
                <Statistic
                  title="Số dư hiện tại"
                  value={balance}
                  precision={0}
                  valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                  prefix={<WalletOutlined />}
                  suffix="VNĐ"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Nạp tiền vào ví (Qua VNPay)" bordered={false} className="shadow-sm h-full">
                <div className="flex gap-4">
                  <InputNumber
                    className="w-full"
                    addonAfter="VNĐ"
                    defaultValue={50000}
                    step={10000}
                    min={10000}
                    onChange={(val) => setDepositAmount(val)}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                  <Button 
                    type="primary" 
                    icon={<CreditCardOutlined />} 
                    loading={loadingPay}
                    onClick={handleDeposit}
                  >
                    Thanh toán ngay
                  </Button>
                </div>
                <Text type="secondary" className="block mt-2 text-xs">
                  * Hệ thống sẽ chuyển hướng sang cổng thanh toán VNPay.
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Bảng lịch sử giao dịch */}
          <Card title={<><HistoryOutlined /> Lịch sử giao dịch</>} className="shadow-sm">
            <Table 
              dataSource={transactions} 
              columns={transactionColumns} 
              rowKey="id"
              pagination={{ pageSize: 5 }} 
            />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BellOutlined /> Thông báo <Badge count={notifications.filter(n => !n.read).length} offset={[5, 0]} size="small" />
        </span>
      ),
      children: (
        <Card className="shadow-sm">
          <List
            itemLayout="horizontal"
            loading={loadingNoti}
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                actions={[
                  !item.read && (
                    <Button type="link" size="small" onClick={() => handleMarkRead(item.id)}>
                      Đã đọc
                    </Button>
                  )
                ]}
                className={!item.read ? "bg-blue-50 rounded mb-2 px-4" : "px-4"}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                        icon={item.type === 'BILL_NEW' ? <DollarOutlined /> : <BellOutlined />} 
                        style={{ backgroundColor: item.read ? '#ccc' : '#1890ff' }} 
                    />
                  }
                  title={
                    <div className="flex justify-between">
                        <span className={!item.read ? "font-bold" : ""}>{item.title}</span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.createdAt).fromNow()}
                        </Text>
                    </div>
                  }
                  description={item.message}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="p-2">
      <Title level={3}>Trung tâm Tài chính & Thông báo</Title>
      <Tabs defaultActiveKey="1" items={items} onChange={setActiveTab} size="large" />
    </div>
  );
};

export default LandlordFinance;