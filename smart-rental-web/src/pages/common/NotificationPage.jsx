import React, { useEffect, useState } from 'react';
import { List, Avatar, Button, Typography, Spin, Empty, Tooltip, Modal, message, Tag } from 'antd';
import { BellOutlined, CheckCircleOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import notificationService from '../../services/notificationService';
import appointmentService from '../../services/appointmentService';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await notificationService.getMyNotifications();
            console.log("Dữ liệu thông báo:", res.data); // <--- BẠN HÃY XEM LOG NÀY ĐỂ BIẾT TÊN BIẾN LÀ 'read' HAY 'isRead'
            setNotifications(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm phụ trợ để lấy trạng thái đọc an toàn (xử lý cả 'read' và 'isRead')
    const checkIsRead = (item) => {
        // Nếu backend trả về 'read', cái này sẽ bắt được. Nếu trả 'isRead', cũng bắt được.
        return item.isRead || item.read || false;
    };

    const handleQuickAccept = (e, item) => {
        e.stopPropagation();

        Modal.confirm({
            title: 'Xác nhận đổi lịch',
            content: 'Bạn có chắc chắn đồng ý với thời gian chủ trọ đề xuất không?',
            okText: 'Đồng ý ngay',
            cancelText: 'Để sau',
            onOk: async () => {
                try {
                    // Gọi API (Backend đã tự động đánh dấu đã đọc bên trong hàm này rồi)
                    await appointmentService.acceptSuggestion(item.referenceId);

                    message.success("Đã chốt lịch hẹn thành công!");

                    // ❌ BỎ DÒNG NÀY: await handleRead(item); -> Không cần thiết nữa
                    
                    // Load lại dữ liệu để cập nhật giao diện (Nút sẽ mất đi)
                    fetchData();
                } catch (error) {
                    console.error(error);
                    message.error(error.response?.data?.message || "Có lỗi xảy ra");
                }
            }
        });
    };

    const handleRead = async (item) => {
        const isRead = checkIsRead(item); // Dùng hàm kiểm tra an toàn
        
        if (!isRead) {
            try {
                await notificationService.markAsRead(item.id);
                // Update state thông minh: Giữ nguyên các trường khác, chỉ đổi isRead/read
                setNotifications(prev => prev.map(n => 
                    n.id === item.id ? { ...n, isRead: true, read: true } : n
                ));
            } catch (error) {
                console.error(error);
            }
        }

        if (item.type !== 'APPOINTMENT_SUGGESTION') {
            if (item.title && item.title.includes('Lịch')) {
                navigate('/landlord/appointments');
            }
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'BILL_NEW': return <DollarOutlined className="text-yellow-600" />;
            case 'CONTRACT_SIGN': return <CheckCircleOutlined className="text-green-600" />;
            case 'APPOINTMENT_SUGGESTION': return <CalendarOutlined className="text-orange-500" />;
            default: return <BellOutlined className="text-blue-600" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Title level={3} style={{ margin: 0 }}>Thông báo của bạn</Title>
                <Button onClick={fetchData}>Làm mới</Button>
            </div>

            {loading ? <div className="text-center py-10"><Spin size="large" /></div> : (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    locale={{ emptyText: <Empty description="Bạn chưa có thông báo nào" /> }}
                    renderItem={(item) => {
                        const isRead = checkIsRead(item); // <--- Lấy trạng thái đã đọc chuẩn xác

                        return (
                            <List.Item
                                className={`cursor-pointer hover:bg-gray-50 transition-colors p-4 rounded-md mb-2 border-b border-gray-100 ${!isRead ? 'bg-blue-50' : ''}`}
                                onClick={() => handleRead(item)}
                                actions={[
                                    !isRead && <Tooltip title="Đánh dấu đã đọc" key="read"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></Tooltip>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            style={{ backgroundColor: isRead ? '#f0f0f0' : '#fff7e6' }}
                                            icon={getIcon(item.type)}
                                        />
                                    }
                                    title={
                                        <div className="flex justify-between items-start">
                                            <span className={!isRead ? "font-bold text-gray-800" : "text-gray-600"}>{item.title}</span>
                                            <Text type="secondary" style={{ fontSize: 12 }} className="whitespace-nowrap ml-2">
                                                {dayjs(item.createdAt).fromNow()}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <div className="text-gray-600 mt-1 mb-2">{item.message}</div>

                                            {/* SỬA LOGIC CHECK: Dùng biến isRead đã xử lý ở trên */}
                                            {item.type === 'APPOINTMENT_SUGGESTION' && !isRead && (
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    className="bg-orange-500 hover:bg-orange-600 border-none shadow-sm font-bold"
                                                    onClick={(e) => handleQuickAccept(e, item)}
                                                >
                                                    ĐỒNG Ý LỊCH MỚI NGAY
                                                </Button>
                                            )}

                                            {item.type === 'APPOINTMENT_SUGGESTION' && isRead && (
                                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                                    Đã chốt lịch thành công
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            )}
        </div>
    );
};

export default NotificationPage;