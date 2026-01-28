import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Tag, Badge, Avatar, Skeleton, Empty } from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    CrownOutlined,
    FireFilled,
    InfoCircleFilled,
    BulbFilled,
    PlusOutlined,
    RightOutlined,
    CheckCircleOutlined,
    EyeInvisibleOutlined,
    GiftOutlined,
    HeartFilled,
    AimOutlined,
    PictureOutlined,
    ReadOutlined,
    PlusCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import roomService from '../../services/roomService';
import appointmentService from '../../services/appointmentService';

const { Title, Text } = Typography;

const LandlordDashboard = () => {
    const navigate = useNavigate();

    // 1. STATE QUẢN LÝ TAB HIỂN THỊ ('ALL' hoặc 'HIDDEN')
    const [activeTab, setActiveTab] = useState('ALL');

    // State lưu thống kê
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activePosts: 0,
        totalPosts: 0,
        contacts: 0,
        newContacts: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [roomRes, apptRes] = await Promise.all([
                    roomService.getMyRooms(),
                    appointmentService.getMyCalendar()
                ]);

                const rooms = roomRes.data || [];
                const activeCount = rooms.filter(r => r.status === 'ACTIVE').length;
                const allAppts = apptRes.data || [];
                const incomingAppts = allAppts.filter(a => a.myRequest === false);

                const thirtyDaysAgo = dayjs().subtract(30, 'day');
                const recentAppts = incomingAppts.filter(a => dayjs(a.createdAt).isAfter(thirtyDaysAgo));
                const uniquePeople = new Set(recentAppts.map(a => a.partnerId)).size;
                const startOfToday = dayjs().startOf('day');
                const newTodayCount = incomingAppts.filter(a => dayjs(a.createdAt).isAfter(startOfToday)).length;

                setStats({
                    totalPosts: rooms.length,
                    activePosts: activeCount,
                    contacts: uniquePeople,
                    newContacts: newTodayCount
                });
            } catch (error) {
                console.error("Lỗi tải dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div className="p-6 bg-white min-h-screen">

            {/* --- PHẦN 1: TỔNG QUAN TÀI KHOẢN (Luôn hiển thị) --- */}
            <Title level={4} className="mb-4">Tổng quan tài khoản</Title>

            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} md={8}>
                    <Card bordered={false} className="bg-gray-50 h-full shadow-sm rounded-lg hover:shadow-md transition">
                        <Skeleton loading={loading} active avatar paragraph={{ rows: 2 }}>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-200 p-2 rounded-full">
                                    <FileTextOutlined className="text-xl text-gray-600" />
                                </div>
                                <div>
                                    <Text strong className="block">Tin đăng</Text>
                                    <div className="mt-2">
                                        <Title level={2} style={{ margin: 0 }}>{stats.activePosts}</Title>
                                        <Text type="secondary">tin đang hiển thị</Text>
                                    </div>
                                    <Text type="secondary" className="block text-xs mt-1">
                                        / Tổng {stats.totalPosts} tin đã tạo
                                    </Text>
                                    <Button type="link" className="p-0 mt-2 text-red-600 font-semibold" onClick={() => navigate('/landlord/create-room')}>
                                        Đăng tin <RightOutlined style={{ fontSize: 10 }} />
                                    </Button>
                                </div>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card bordered={false} className="bg-gray-50 h-full shadow-sm rounded-lg hover:shadow-md transition">
                        <Skeleton loading={loading} active avatar paragraph={{ rows: 2 }}>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-200 p-2 rounded-full">
                                    <UserOutlined className="text-xl text-gray-600" />
                                </div>
                                <div>
                                    <Text strong className="block">Liên hệ trong 30 ngày</Text>
                                    <div className="mt-2">
                                        <Title level={2} style={{ margin: 0 }}>{stats.contacts}</Title>
                                        <Text type="secondary">người</Text>
                                    </div>
                                    {stats.newContacts > 0 ? (
                                        <Text type="success" className="block text-xs mt-1 font-bold">+ {stats.newContacts} mới vào hôm nay</Text>
                                    ) : (
                                        <Text type="secondary" className="block text-xs mt-1">Chưa có liên hệ mới hôm nay</Text>
                                    )}
                                </div>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>

        
                <Col xs={24} md={8}>
                    <Card bordered={false} className="bg-red-50 h-full shadow-sm rounded-lg border border-red-100">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <CrownOutlined className="text-xl text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <Text strong className="block">Gói Hội Viên</Text>
                                    <Tag color="#f50" className="m-0 rounded-full border-0">Tiết kiệm 39%</Tag>
                                </div>
                                <Text type="secondary" className="block mt-2 text-xs mb-3">
                                    Thảnh thơi đăng tin/đẩy tin không lo biến động giá
                                </Text>

                                {/* 🟢 CẬP NHẬT: Nhấn vào dẫn sang trang VIP vừa tạo */}
                                <Button
                                    shape="round"
                                    className="border-gray-400 text-gray-600 text-xs font-semibold hover:border-red-500 hover:text-red-500"
                                    onClick={() => navigate('/landlord/vip-packages')}
                                >
                                    Tìm hiểu ngay
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* --- PHẦN 2: THÔNG TIN DÀNH RIÊNG CHO BẠN --- */}
            <Title level={4} className="mb-4">Thông tin dành riêng cho bạn</Title>

            {/* 2. CỤM NÚT ĐIỀU KHIỂN HIỂN THỊ */}
            <div className="flex gap-2 mb-4">
                <Button
                    shape="round"
                    className={activeTab === 'ALL' ? "bg-gray-800 text-white border-gray-800 hover:bg-black hover:text-white" : "text-gray-500"}
                    onClick={() => setActiveTab('ALL')}
                >
                    <div className="flex items-center gap-1"><FireFilled /> Tất cả</div>
                </Button>

                <Button
                    shape="round"
                    className={activeTab === 'HIDDEN' ? "bg-gray-800 text-white border-gray-800 hover:bg-black hover:text-white" : "text-gray-500"}
                    onClick={() => setActiveTab('HIDDEN')}
                >
                    <div className="flex items-center gap-1"><EyeInvisibleOutlined /> Đã tạm ẩn</div>
                </Button>
            </div>

            {/* 3. ĐIỀU KIỆN RENDER NỘI DUNG */}
            {activeTab === 'ALL' ? (
                <Row gutter={[24, 24]}>
                    {/* CỘT 1: QUAN TRỌNG */}
                    <Col xs={24} md={8}>
                        <div className="flex items-center gap-2 mb-2">
                            <FireFilled className="text-red-600" />
                            <Text strong>Quan trọng</Text>
                            <Badge count={1} style={{ backgroundColor: '#D0021B' }} />
                        </div>
                        <Card bordered={false} className="rounded-xl overflow-hidden text-center text-white relative shadow-lg bg-[#D0021B] min-h-[300px]">
                            <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center p-6">
                                <div className="mb-4 bg-white/20 p-4 rounded-full">
                                    <GiftOutlined style={{ fontSize: '48px', color: '#fff' }} />
                                </div>
                                <Title level={4} style={{ color: 'white' }}>Quà tặng 1 tin thường</Title>
                                <Text className="text-white/80 mb-6 block">Tiếp cận hơn 6 triệu khách hàng tiềm năng mỗi tháng.</Text>
                                <Button size="large" icon={<PlusOutlined />} className="border-0 font-bold text-red-700 bg-white rounded-full shadow-lg" onClick={() => navigate('/landlord/create-room')}>
                                    Tạo tin đăng đầu tiên
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    {/* CỘT 2: THÔNG TIN */}
                    <Col xs={24} md={8}>
                        <div className="flex items-center gap-2 mb-2">
                            <InfoCircleFilled className="text-green-600" />
                            <Text strong>Thông tin</Text>
                            <Badge count={0} style={{ backgroundColor: '#ccc' }} />
                        </div>
                        <Card bordered={false} className="bg-gray-50 rounded-xl shadow-sm min-h-[150px]">
                            <div className="flex items-start gap-3">
                                <Avatar style={{ backgroundColor: '#000' }} icon={<CheckCircleOutlined />} />
                                <div><Text>Bạn đã cập nhật tất cả thông tin của ngày hôm nay 👋</Text></div>
                            </div>
                        </Card>
                    </Col>

                    {/* CỘT 3: GỢI Ý */}
                    <Col xs={24} md={8}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <HeartFilled className="text-teal-700 text-xl" />
                                <Text strong className="text-base">Gợi ý</Text>
                            </div>
                            <div className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</div>
                        </div>

                        <Card bordered={false} className="bg-white rounded-xl shadow-sm mb-4">
                            <Title level={5} className="mt-0 mb-2">Làm quen với trang Tổng quan!</Title>
                            <Text type="secondary" className="text-sm mb-4 block">
                                Hướng dẫn bạn làm quen và thao tác với một số nội dung chính, giúp bạn có trải nghiệm tốt hơn.
                            </Text>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3">
                                    <AimOutlined className="text-xl mt-0.5 text-gray-700" />
                                    <span className="text-sm font-medium text-gray-800">Thông tin tổng quan về tài khoản của bạn</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <UserOutlined className="text-xl mt-0.5 text-gray-700" />
                                    <span className="text-sm font-medium text-gray-800">Thông tin cá nhân hoá dành riêng cho bạn</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <EyeInvisibleOutlined className="text-xl mt-0.5 text-gray-700" />
                                    <span className="text-sm font-medium text-gray-800">Ẩn những thông tin mà bạn thấy không hữu ích</span>
                                </div>
                            </div>
                            <Button block shape="round" className="bg-gray-100 border-gray-300 font-semibold text-gray-700 h-10 hover:bg-gray-200">
                                Xem hướng dẫn
                            </Button>
                        </Card>

                        <Card bordered={false} className="bg-white rounded-xl shadow-sm">
                            <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-500 mb-3">
                                <span className="w-2 h-2 rounded-full bg-teal-600 block"></span>
                                Gợi ý
                            </div>
                            <Title level={5} className="mt-0 mb-4">Làm quen với Batdongsan.com.vn</Title>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between cursor-pointer group" onClick={() => navigate('/profile')}>
                                    <div className="flex gap-4">
                                        <PictureOutlined className="text-2xl text-gray-800 mt-1" />
                                        <div>
                                            <Text strong className="block text-sm mb-1 group-hover:text-red-600 transition">Cập nhật tên và hình ảnh đại diện</Text>
                                            <Text type="secondary" className="text-xs block leading-relaxed">
                                                Tên và hình ảnh sẽ xuất hiện ở tất cả các tin đăng của bạn, điều đó sẽ giúp bạn cận người mua dễ dàng hơn.
                                            </Text>
                                        </div>
                                    </div>
                                    <RightOutlined className="text-gray-400 text-sm" />
                                </div>
                                <div className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex gap-4">
                                        <ReadOutlined className="text-2xl text-gray-800 mt-1" />
                                        <div>
                                            <Text strong className="block text-sm mb-1 group-hover:text-red-600 transition">Khám phá sổ tay đăng tin</Text>
                                        </div>
                                    </div>
                                    <RightOutlined className="text-gray-400 text-sm" />
                                </div>
                                <div className="flex items-center justify-between cursor-pointer group" onClick={() => navigate('/landlord/create-room')}>
                                    <div className="flex gap-4">
                                        <PlusCircleOutlined className="text-2xl text-gray-800 mt-1" />
                                        <div>
                                            <Text strong className="block text-sm mb-1 group-hover:text-red-600 transition">Và bạn đã sẵn sàng để đăng tin đầu tiên. Bắt đầu ngay!</Text>
                                            <Text type="secondary" className="text-xs block leading-relaxed">
                                                Batdongsan.com.vn tặng bạn một tin thường 15 ngày để bắt đầu đăng tin.
                                            </Text>
                                        </div>
                                    </div>
                                    <RightOutlined className="text-gray-400 text-sm" />
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            ) : (
                /* 4. TRẠNG THÁI EMPTY KHI CHỌN 'ĐÃ TẠM ẨN' */
                <div className="py-12 bg-gray-50 rounded-lg flex justify-center items-center border border-dashed border-gray-300">
                    <Empty description="Bạn chưa ẩn mục thông tin nào" />
                </div>
            )}
        </div>
    );
};

export default LandlordDashboard;