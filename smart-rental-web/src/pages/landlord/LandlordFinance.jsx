import React, { useEffect, useState } from 'react';
import {
  Tabs, Card, Statistic, Button, Table, Tag, List,
  Avatar, InputNumber, message, Typography, Row, Col, Badge
} from 'antd';
import {
  WalletOutlined, BellOutlined, HistoryOutlined,
  CheckCircleOutlined, CreditCardOutlined,
  ArrowDownOutlined, ArrowUpOutlined, RocketOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import paymentService from '../../services/paymentService';
import notificationService from '../../services/notificationService';
import useAuth from '../../hooks/useAuth';

dayjs.extend(relativeTime);
const { Title, Text } = Typography;

const LandlordFinance = () => {
  const { user } = useAuth();
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
      const [profileRes, historyRes] = await Promise.all([
        paymentService.getMyWallet(),
        paymentService.getMyHistory()
      ]);

      setBalance(profileRes.data.walletBalance);
      // Sắp xếp giao dịch mới nhất lên đầu
      setTransactions((historyRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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
      const res = await paymentService.createPaymentUrl(depositAmount, user.id);
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      message.error("Không thể tạo giao dịch. Vui lòng thử lại.");
      setLoadingPay(false);
    }
  };

  // 🟢 CẬP NHẬT CỘT GIAO DỊCH ĐỂ NHẬN DIỆN "ĐẨY TIN"
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
        let color = 'default';
        let text = type;
        let icon = null;
        
        if (type === 'DEPOSIT') {
          color = 'green';
          text = 'Nạp tiền vào ví';
        } else if (type === 'PURCHASE_PACKAGE' || type === 'MEMBERSHIP') {
          color = 'purple';
          text = 'Mua gói Hội Viên';
        } else if (type === 'ROOM_PROMOTION' || type === 'PUSH_ROOM') { // 🟢 LOGIC MỚI
          color = 'blue';
          text = 'Đẩy tin lên Top';
          icon = <RocketOutlined className="mr-1"/>;
        } else if (type === 'DEDUCTION' || type === 'POST_FEE') {
          color = 'orange';
          text = 'Phí dịch vụ';
        }

        return <Tag color={color} className="font-medium flex items-center w-fit">{icon} {text}</Tag>;
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={`font-bold ${amount >= 0 ? "text-green-600" : "text-red-600"}`}>
          {amount > 0 ? '+' : ''}
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'SUCCESS' ? 'success' : 'error'} bordered={false}>
          {status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </Tag>
      )
    }
  ];

  // === 2. LOGIC THÔNG BÁO (ĐÃ CẬP NHẬT) ===
  const fetchNotifications = async () => {
    setLoadingNoti(true);
    try {
      const res = await notificationService.getMyNotifications();
      const allData = res.data || [];
      
      // 🟢 CẬP NHẬT BỘ LỌC: Thêm các từ khóa liên quan đến Đẩy tin
      const financialNotis = allData.filter(n => {
        const type = n.type || '';
        const title = (n.title || '').toLowerCase();
        
        // Danh sách các loại thông báo tài chính
        const financialTypes = ['BILL_NEW', 'DEPOSIT', 'PAYMENT', 'PURCHASE_PACKAGE', 'DEDUCTION', 'ROOM_PROMOTION', 'PUSH_ROOM'];
        
        // Danh sách từ khóa tìm kiếm trong tiêu đề
        const keywords = ['nạp tiền', 'thanh toán', 'gói vip', 'trừ tiền', 'đẩy tin', 'lên top', 'gia hạn'];

        return financialTypes.includes(type) || keywords.some(k => title.includes(k));
      });

      setNotifications(financialNotis);
    } catch (error) {
      console.error("Lỗi tải thông báo tài chính", error);
    } finally {
      setLoadingNoti(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchNotifications();
  }, []);

  const items = [
    {
      key: '1',
      label: (<span><WalletOutlined /> Quản lý Ví & Nạp tiền</span>),
      children: (
        <div className="space-y-6">
          <Row gutter={16}>
            <Col span={12}>
              <Card bordered={false} className="bg-blue-50 shadow-sm border-l-4 border-blue-500">
                <Statistic
                  title="Số dư hiện tại"
                  value={balance}
                  precision={0}
                  valueStyle={{ color: '#1677ff', fontWeight: 'bold' }}
                  prefix={<WalletOutlined />}
                  suffix="VNĐ"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Nạp tiền vào ví (Qua VNPay)" bordered={false} className="shadow-sm">
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
                    className="bg-blue-600"
                  >
                    Thanh toán
                  </Button>
                </div>
                <Text type="secondary" className="block mt-2 text-xs italic">
                  * Hệ thống sẽ chuyển hướng sang cổng thanh toán VNPay.
                </Text>
              </Card>
            </Col>
          </Row>

          <Card title={<><HistoryOutlined /> Lịch sử biến động số dư</>} className="shadow-sm rounded-xl">
            <Table
              dataSource={transactions}
              columns={transactionColumns}
              rowKey="id"
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BellOutlined /> Thông báo tài chính <Badge count={notifications.filter(n => !n.read).length} offset={[5, 0]} size="small" />
        </span>
      ),
      children: (
        <Card className="shadow-sm rounded-xl">
          <List
            itemLayout="horizontal"
            loading={loadingNoti}
            dataSource={notifications}
            renderItem={(item) => {
              // 🟢 XÁC ĐỊNH CHIỀU GIAO DỊCH: Đẩy tin (ROOM_PROMOTION) là Chi tiêu (Màu đỏ)
              const isExpense = ['PURCHASE_PACKAGE', 'DEDUCTION', 'POST_FEE', 'ROOM_PROMOTION', 'PUSH_ROOM'].includes(item.type) 
                                || (item.title && (item.title.toLowerCase().includes('trừ') || item.title.toLowerCase().includes('thanh toán')));
              
              return (
                <List.Item
                  actions={[
                    !item.read && (
                      <Button type="link" size="small" onClick={() => handleMarkRead(item.id)}>
                        Đã đọc
                      </Button>
                    )
                  ]}
                  className={`transition-all ${!item.read ? "bg-blue-50/50" : ""} px-4 rounded-lg mb-2`}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={isExpense ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                        style={{ backgroundColor: isExpense ? '#ff4d4f' : '#52c41a' }}
                      />
                    }
                    title={
                      <div className="flex justify-between">
                        <span className={!item.read ? "font-bold" : ""}>{item.title}</span>
                        <Text type="secondary" className="text-xs">
                          {dayjs(item.createdAt).fromNow()}
                        </Text>
                      </div>
                    }
                    description={
                        <div>
                            {item.message}
                            {/* Nếu là đẩy tin, hiện thêm icon tên lửa cho đẹp */}
                            {item.type === 'ROOM_PROMOTION' && <Tag color="blue" className="ml-2 text-[10px]"><RocketOutlined/> Đẩy tin</Tag>}
                        </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Title level={3} className="m-0 text-blue-800">Trung tâm Tài chính</Title>
        <Text type="secondary">Theo dõi số dư, nạp tiền và quản lý các giao dịch nâng cấp VIP.</Text>
      </div>
      <Tabs 
        defaultActiveKey="1" 
        items={items} 
        onChange={setActiveTab} 
        size="large" 
        className="bg-white p-4 rounded-xl shadow-sm"
      />
    </div>
  );
};

export default LandlordFinance;