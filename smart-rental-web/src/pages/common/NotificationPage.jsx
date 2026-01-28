import React, { useEffect, useState } from 'react';
import { List, Avatar, Button, Typography, Spin, Empty, Tooltip, Modal, message, Tag } from 'antd';
import { 
    BellOutlined, CheckCircleOutlined, DollarOutlined, 
    CalendarOutlined, CrownOutlined, ArrowRightOutlined,
    SafetyCertificateOutlined, UpCircleOutlined, AlertOutlined,
    TruckOutlined, MessageOutlined, CloseCircleOutlined
} from '@ant-design/icons';
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
            setNotifications(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkIsRead = (item) => {
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
                    await appointmentService.acceptSuggestion(item.referenceId);
                    message.success("Đã chốt lịch hẹn thành công!");
                    fetchData();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra");
                }
            }
        });
    };

    const handleRead = async (item) => {
        const isRead = checkIsRead(item);
        
        if (!isRead) {
            try {
                await notificationService.markAsRead(item.id);
                setNotifications(prev => prev.map(n => 
                    n.id === item.id ? { ...n, isRead: true, read: true } : n
                ));
            } catch (error) {
                console.error(error);
            }
        }

        // 🟢 ĐIỀU HƯỚNG THÔNG MINH (CẬP NHẬT CHAT_NEW)
        switch (item.type) {
            case 'CHAT_NEW':
                // Chuyển sang trang chat và truyền ID người gửi (referenceId) để mở đúng cửa sổ
                navigate('/messages', { state: { partnerId: item.referenceId } });
                break;
            case 'PURCHASE_PACKAGE':
            case 'DEDUCTION':
                navigate('/landlord/finance');
                break;
            case 'ROOM_PUSH_SUCCESS':
            case 'ROOM_EXPIRING':
                navigate('/landlord/room-list');
                break;
            case 'KYC_STATUS':
                navigate('/profile');
                break;
            case 'SERVICE_BOOKED':
                navigate('/landlord/services/history');
                break;
            case 'APPOINTMENT_SUGGESTION':
                // Ở lại trang để người dùng tương tác với nút Đồng ý
                break;
            default:
                if (item.title && (item.title.includes('Lịch') || item.type === 'APPOINTMENT')) {
                    navigate('/landlord/appointments');
                }
                break;
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'CHAT_NEW': return <MessageOutlined className="text-blue-400" />;
            case 'BILL_NEW': return <DollarOutlined className="text-yellow-600" />;
            case 'CONTRACT_SIGN': return <CheckCircleOutlined className="text-green-600" />;
            case 'APPOINTMENT_SUGGESTION': return <CalendarOutlined className="text-orange-500" />;
            case 'PURCHASE_PACKAGE': 
            case 'DEDUCTION': return <CrownOutlined className="text-purple-600" />;
            case 'KYC_STATUS': return <SafetyCertificateOutlined className="text-blue-500" />;
            case 'ROOM_PUSH_SUCCESS': return <UpCircleOutlined className="text-green-500" />;
            case 'ROOM_EXPIRING': return <AlertOutlined className="text-red-500" />;
            case 'SERVICE_BOOKED': return <TruckOutlined className="text-cyan-600" />;
            default: return <BellOutlined className="text-gray-400" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-lg min-h-screen my-4">
            <div className="flex justify-between items-center mb-6">
                <Title level={3} style={{ margin: 0 }}>Thông báo</Title>
                <Button type="link" onClick={fetchData}>Làm mới</Button>
            </div>

            {loading ? <div className="text-center py-10"><Spin size="large" /></div> : (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    locale={{ emptyText: <Empty description="Bạn chưa có thông báo nào" /> }}
                    renderItem={(item) => {
                        const isRead = checkIsRead(item);

                        return (
                            <List.Item
                                className={`cursor-pointer hover:bg-gray-50 transition-colors p-4 rounded-lg mb-3 border border-gray-100 ${!isRead ? 'bg-blue-50/50 border-blue-100' : 'bg-white'}`}
                                onClick={() => handleRead(item)}
                                actions={[
                                    !isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></div>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            size={44}
                                            style={{ 
                                                backgroundColor: isRead ? '#f5f5f5' : '#fff',
                                                border: `1px solid ${isRead ? '#eee' : '#ffd591'}`
                                            }}
                                            icon={getIcon(item.type)}
                                        />
                                    }
                                    title={
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[15px] ${!isRead ? "font-bold text-gray-800" : "text-gray-600"}`}>
                                                {item.title}
                                            </span>
                                            <Text type="secondary" style={{ fontSize: 11 }} className="whitespace-nowrap ml-2">
                                                {dayjs(item.createdAt).fromNow()}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <div className="mt-1">
                                            <div className="text-gray-600 text-[14px] leading-relaxed mb-2">{item.message}</div>

                                            <div className="flex flex-wrap gap-2">
                                                {/* 🟢 TAG CHO TIN NHẮN MỚI */}
                                                {item.type === 'CHAT_NEW' && !isRead && (
                                                    <Tag color="blue" icon={<MessageOutlined />}>Tin nhắn mới</Tag>
                                                )}

                                                {/* Xử lý nhanh lịch hẹn */}
                                                {item.type === 'APPOINTMENT_SUGGESTION' && !isRead && (
                                                    <Button 
                                                        type="primary" size="small" 
                                                        className="bg-orange-500 border-none text-[12px] font-bold h-7"
                                                        onClick={(e) => handleQuickAccept(e, item)}
                                                    >
                                                        CHỐT LỊCH NGAY
                                                    </Button>
                                                )}

                                                {/* Các tag cũ giữ nguyên */}
                                                {item.type === 'ROOM_EXPIRING' && (
                                                    <Tag color="error" icon={<AlertOutlined />}>Sắp ẩn tin</Tag>
                                                )}

                                                {item.type === 'KYC_STATUS' && (
                                                    <Tag color={item.message.includes('thành công') ? "success" : "error"}>
                                                        {item.message.includes('thành công') ? "Đã định danh" : "Cần nộp lại"}
                                                    </Tag>
                                                )}

                                                {item.type === 'ROOM_PUSH_SUCCESS' && (
                                                    <Tag color="green" icon={<CheckCircleOutlined />}>Thành công</Tag>
                                                )}
                                                
                                                {isRead && (
                                                    <Text type="secondary" className="text-[12px] italic">
                                                        Xem chi tiết <ArrowRightOutlined className="text-[10px]" />
                                                    </Text>
                                                )}
                                            </div>
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