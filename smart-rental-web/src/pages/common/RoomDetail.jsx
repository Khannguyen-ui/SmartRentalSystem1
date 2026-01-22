import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Spin, Button, Card, Tag, Image, Row, Col, message, Avatar,
    Breadcrumb, Input, Tooltip, Modal, Form, DatePicker, TimePicker,
    Typography
} from 'antd';
import {
    ShareAltOutlined, MoreOutlined, EnvironmentOutlined, ClockCircleOutlined,
    ColumnWidthOutlined, AppstoreOutlined, DollarOutlined, HeartOutlined,
    UserOutlined, CheckCircleOutlined, PhoneOutlined, MessageOutlined,
    CalendarOutlined,// Thêm icon lịch
    HomeFilled,
    AppstoreAddOutlined,
    AimOutlined,
    RightOutlined
} from '@ant-design/icons';

import { 
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, Legend 

} from 'recharts';
import { InfoCircleFilled, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';

// --- 1. IMPORT CÁC THƯ VIỆN BẢN ĐỒ ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import Services & Hooks
import roomService from '../../services/roomService';
import useAuth from '../../hooks/useAuth';
import chatService from '../../services/chatService';
import searchHistoryService from '../../services/searchHistoryService';

const { Text } = Typography;

// --- 2. FIX LỖI ICON CỦA LEAFLET TRONG REACT ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Config thời gian tiếng Việt
dayjs.extend(relativeTime);
dayjs.locale('vi');

const ZaloIcon = () => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/Zalo_Authors_Logo.svg" alt="Zalo" width={20} height={20} />
);
const priceData = [
  { name: 'T1/25', highest: 68, popular: 30, lowest: 18 },
  { name: 'T2/25', highest: 56, popular: 36, lowest: 25 },
  { name: 'T3/25', highest: 65, popular: 36, lowest: 22 },
  { name: 'T4/25', highest: 75, popular: 33, lowest: 16 },
  { name: 'T5/25', highest: 75, popular: 38, lowest: 20 },
  { name: 'T6/25', highest: 73, popular: 36, lowest: 15 },
  { name: 'T7/25', highest: 74, popular: 36, lowest: 20 },
  { name: 'T8/25', highest: 55, popular: 34, lowest: 23 },
  { name: 'T9/25', highest: 75, popular: 37, lowest: 23 },
  { name: 'T10/25', highest: 72, popular: 36, lowest: 20 },
  { name: 'T11/25', highest: 76, popular: 41, lowest: 24 },
  { name: 'T12/25', highest: 77, popular: 42, lowest: 20 },
  { name: 'T12/25 ', highest: 73, popular: 32, lowest: 19 },
];

const RoomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    // --- STATE CHO BOOKING ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [form] = Form.useForm();
    const [recommendedRooms, setRecommendedRooms] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await roomService.getRoomById(id);
                setRoom(res.data);
                // Sau khi có dữ liệu phòng hiện tại, bắt đầu lấy phòng gợi ý
                fetchRecommendations();
            } catch (error) {
                message.error("Không tìm thấy phòng!");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            // 1. Lấy lịch sử tìm kiếm gần nhất
            const historyRes = await searchHistoryService.getMyHistory();
            const history = historyRes.data;

            let searchParams = { lat: 10.7769, lng: 106.7009, radius: 20000 }; // Mặc định HCM

            if (history && history.length > 0) {
                // Lấy bản ghi tìm kiếm mới nhất có tọa độ
                const lastSearch = history[0];
                searchParams = {
                    lat: lastSearch.latitude,
                    lng: lastSearch.longitude,
                    radius: lastSearch.radius || 5000,
                    keyword: lastSearch.queryText
                };
            }

            // 2. Gọi API search phòng dựa trên lịch sử đó
            const roomsRes = await roomService.searchRooms(searchParams);
            
            // 3. Lọc bỏ phòng hiện tại đang xem và lấy tối đa 4 phòng
            const filtered = (roomsRes.data || [])
                .filter(r => r.id.toString() !== id)
                .slice(0, 4);
                
            setRecommendedRooms(filtered);
        } catch (error) {
            console.error("Lỗi lấy gợi ý:", error);
        } finally {
            setLoadingRecs(false);
        }
    };


    // --- XỬ LÝ CHAT VỚI CHỦ NHÀ ---
    const handleChat = async () => {
        if (!user) {
            message.warning("Vui lòng đăng nhập để chat!");
            navigate('/login');
            return;
        }

        // Không cho phép tự chat với chính mình
        if (user.id === room.landlordId) {
            message.info("Đây là bài đăng của bạn.");
            return;
        }

        try {
            message.loading({ content: "Đang kết nối...", key: 'chat_loading' });

            // 1. Gọi API tạo hội thoại (hoặc lấy hội thoại cũ nếu có)
            await chatService.startConversation(room.landlordId);

            message.success({ content: "Đã kết nối!", key: 'chat_loading' });

            // 2. Chuyển hướng sang trang tin nhắn
            navigate('/messages');

        } catch (error) {
            console.error(error);
            message.error({ content: "Lỗi kết nối server chat.", key: 'chat_loading' });
        }
    };

    const handleZalo = () => {
        const phone = room?.landlordPhone;
        if (phone) window.open(`https://zalo.me/${phone}`, '_blank');
        else message.warning("Chủ trọ chưa cập nhật số điện thoại");
    };

    // --- XỬ LÝ ĐẶT LỊCH ---
    const handleBooking = async (values) => {
        if (!user) {
            message.warning("Vui lòng đăng nhập để đặt lịch!");
            navigate('/login');
            return;
        }
        setBookingLoading(true);
        try {
            // Giả lập gọi API đặt lịch
            // await appointmentService.create({...values, roomId: room.id});
            setTimeout(() => {
                message.success("Đã gửi yêu cầu xem phòng thành công!");
                setBookingLoading(false);
                setIsModalOpen(false);
                form.resetFields();
            }, 1000);
        } catch (error) {
            message.error("Có lỗi xảy ra, vui lòng thử lại");
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
    if (!room) return null;

    const position = [room.latitude || 10.7769, room.longitude || 106.7009];

    const missingData = {
        furnitureStatus: room.furnitureStatus || "Nội thất đầy đủ",
        avatar: "https://joesch.moe/api/v1/random",
        joinDate: "Tham gia 1 năm trước",
        responseRate: "100%",
        activeTime: "Hoạt động 30 phút trước"
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-24 md:pb-10 font-sans text-gray-800 relative">
            {/* Thêm pb-24 để tránh nội dung bị che bởi Bottom Bar trên mobile */}

            {/* Breadcrumb */}
            <div className="max-w-6xl mx-auto px-4 py-3 text-sm">
                <Breadcrumb items={[
                    { title: <a href="/">Trang chủ</a> },
                    { title: 'Thuê phòng trọ' },
                    { title: <span className="text-gray-500 truncate max-w-[200px]">{room.title}</span> }
                ]} />
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <Row gutter={[20, 20]}>

                    {/* ================= CỘT TRÁI (GIỮ NGUYÊN) ================= */}
                    <Col xs={24} lg={16}>
                        {/* Slider Ảnh */}
                        <div className="bg-black rounded-lg overflow-hidden relative mb-2 h-[400px] flex items-center justify-center group">
                            {room.images && room.images.length > 0 ? (
                                <Image.PreviewGroup>
                                    <Image src={room.images[0]} className="object-contain max-h-[400px] w-full" preview={{ visible: false }} />
                                    <div className="hidden">
                                        {room.images.slice(1).map((img, idx) => <Image key={idx} src={img} />)}
                                    </div>
                                </Image.PreviewGroup>
                            ) : <div className="text-white">Chưa có hình ảnh</div>}

                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button shape="circle" icon={<ShareAltOutlined />} className="bg-white/80 border-none" />
                                <Button shape="circle" icon={<MoreOutlined />} className="bg-white/80 border-none" />
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                1/{room.images?.length || 0}
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="flex gap-2 overflow-x-auto mb-6 pb-2 scrollbar-hide">
                            {room.images?.map((img, index) => (
                                <div key={index} className="w-20 h-14 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border border-gray-200 hover:border-orange-500 transition-all">
                                    <img src={img} className="w-full h-full object-cover" alt="thumb" />
                                </div>
                            ))}
                        </div>

                        {/* Thông tin chính */}
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <h1 className="text-xl font-bold text-gray-800 mb-1 uppercase">{room.title}</h1>
                            <div className="text-sm text-gray-500 mb-4">{missingData.furnitureStatus}</div>

                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-red-600 font-bold text-2xl">{room.price?.toLocaleString()} đ/tháng</span>
                                    <span className="text-gray-600 text-sm font-medium">{room.area} m²</span>
                                </div>
                                <Button shape="round" icon={<HeartOutlined />} size="small" className="text-red-500 border-red-300 bg-red-50 hover:bg-red-100 font-medium">Lưu tin</Button>
                            </div>

                            <div className="flex items-start gap-2 text-gray-600 text-sm mb-2">
                                <EnvironmentOutlined className="mt-1 text-gray-400" />
                                <span>{room.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-xs border-t pt-3 mt-3">
                                <ClockCircleOutlined />
                                <span>Cập nhật {dayjs(room.createdAt || new Date()).fromNow()}</span>
                            </div>
                        </Card>

                        {/* Đặc điểm */}
                        {/* Đặc điểm chi tiết căn hộ/phòng */}
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">Đặc điểm chi tiết</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                
                                {/* Cột 1 */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <ColumnWidthOutlined className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Diện tích</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.area} m²</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <HomeFilled className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Số phòng ngủ</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.numBedrooms || 0} phòng</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <CheckCircleOutlined className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Nhà vệ sinh</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.numBathrooms || 0} phòng</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <AppstoreAddOutlined className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Tầng số</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.floorNumber ? `Tầng ${room.floorNumber}` : "Tầng trệt"}</span>
                                    </div>
                                </div>

                                {/* Cột 2 */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <DollarOutlined className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Tiền cọc</span>
                                        </div>
                                        <span className="text-red-600 font-semibold text-sm">{room.deposit ? `${room.deposit.toLocaleString()} đ` : "Thỏa thuận"}</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <Tooltip title="Tình trạng pháp lý của bất động sản">
                                                <CalendarOutlined className="text-lg mr-3 text-orange-500" />
                                            </Tooltip>
                                            <span className="text-sm">Pháp lý</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.legalStatus || "Đang cập nhật"}</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <AimOutlined className="text-lg mr-3 text-orange-500" />
                                            <span className="text-sm">Hướng nhà</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.direction || "Không xác định"}</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="flex items-center text-gray-500">
                                            <Tooltip title="Tình trạng trang bị nội thất">
                                                <AppstoreOutlined className="text-lg mr-3 text-orange-500" />
                                            </Tooltip>
                                            <span className="text-sm">Nội thất</span>
                                        </div>
                                        <span className="text-gray-800 font-semibold text-sm">{room.furnitureStatus || "Cơ bản"}</span>
                                    </div>
                                </div>

                            </div>
                        </Card>

                        {/* Mô tả */}
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-3">Mô tả chi tiết</h3>
                            <div className="whitespace-pre-line text-gray-700 leading-relaxed text-sm">{room.description}</div>
                            {room.amenities && room.amenities.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="font-semibold mb-2">Tiện ích:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {room.amenities.map((ame, i) => (
                                            ame && (
                                                <Tag key={i} color="blue" className="rounded-full px-3">
                                                    {ame}
                                                </Tag>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                       <Card className="shadow-sm border-none rounded-lg mt-4">
                            <div className="mb-4">
                                <h3 className="font-bold text-lg mb-1">Lịch sử giá cho thuê</h3>
                                <Text type="secondary" className="text-xs">Tại khu vực {room.address?.split(',').slice(-2).join(',')}</Text>
                            </div>

                            {/* 3 Ô thống kê bên trên */}
                            <Row gutter={[12, 12]} className="mb-6">
                                <Col span={8}>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 h-full">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold">32</span>
                                            <span className="text-xs text-gray-500">tr/tháng</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">Giá thuê phổ biến nhất T12/25</div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 h-full">
                                        <div className="text-[#10b981] font-bold text-lg flex items-center gap-1">
                                            <ArrowUpOutlined /> 10,3%
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">Giá thuê đã tăng trong 1 năm qua</div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 h-full">
                                        <div className="text-[#ef4444] font-bold text-lg flex items-center gap-1">
                                            <ArrowDownOutlined /> 23,8%
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">Thấp hơn đỉnh 42tr (T11/25)</div>
                                    </div>
                                </Col>
                            </Row>

                            {/* Biểu đồ */}
                            <div className="h-64 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={priceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                                        <ChartTooltip />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        <Line type="monotone" dataKey="highest" name="Giá cao nhất" stroke="#a855f7" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="popular" name="Giá phổ biến nhất" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="lowest" name="Giá thấp nhất" stroke="#facc15" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Disclaimer Footer */}
                            <div className="mt-6 bg-purple-50 p-3 rounded-lg flex gap-3 items-start">
                                <InfoCircleFilled className="text-purple-400 mt-1" />
                                <p className="text-[10px] text-purple-700 m-0 leading-relaxed">
                                    Dữ liệu giá được tổng hợp và xử lý từ các tin đăng trên hệ thống Smart Rental. 
                                    Bạn hãy lưu ý về tin đăng nằm ngoài khoảng giá chúng tôi gợi ý để cân nhắc kỹ trước khi giao dịch.
                                </p>
                            </div>
                        </Card>

                        {/* Map */}
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg">Xem trên bản đồ</h3>
                                <Button
                                    type="link"
                                    size="small"
                                    icon={<EnvironmentOutlined />}
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`, '_blank')}
                                >
                                    Chỉ đường
                                </Button>
                            </div>

                            <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 z-0 relative">
                                <MapContainer
                                    center={position}
                                    zoom={15}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='© OpenStreetMap contributors'
                                    />
                                    <Marker position={position}>
                                        <Popup>
                                            <b>{room.title}</b> <br /> {room.address}
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </Card>

                    </Col>

                    {/* ================= CỘT PHẢI (CHỈNH SỬA UX) ================= */}
                    <Col xs={24} lg={8}>
                        <div className="sticky top-4 space-y-4">

                            {/* --- [MỚI] CARD ĐẶT LỊCH XEM PHÒNG (CHO DESKTOP) --- */}
                            {/* Ẩn trên mobile vì mobile đã có Bottom Bar */}
                            <Card className="hidden lg:block shadow-md border-t-4 border-t-orange-500 rounded-lg">
                                <div className="text-center mb-4">
                                    <div className="text-gray-500 text-xs">Giá thuê phòng</div>
                                    <div className="text-red-600 font-bold text-2xl">{room.price?.toLocaleString()} đ/tháng</div>
                                </div>
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    className="bg-orange-600 hover:bg-orange-500 font-bold h-12 mb-3"
                                    icon={<CalendarOutlined />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    ĐẶT LỊCH XEM PHÒNG
                                </Button>
                                <div className="text-center text-xs text-gray-400">
                                    Hoàn toàn miễn phí & Gặp trực tiếp chủ trọ
                                </div>
                            </Card>

                            {/* CARD THÔNG TIN CHỦ TRỌ (GIỮ NGUYÊN) */}
                            <Card className="shadow-sm border-none rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar size={50} src={missingData.avatar} icon={<UserOutlined />} className="border border-gray-200" />
                                    <div>
                                        <div className="font-bold text-gray-800 text-base flex items-center gap-1">
                                            {room.landlordName || "Chủ trọ"}
                                            <Tooltip title="Đã xác thực"><CheckCircleOutlined className="text-green-500 text-sm" /></Tooltip>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> {missingData.activeTime}
                                        </div>
                                    </div>
                                </div>
                                <Row gutter={8} className="mb-3">
                                    <Col span={12}><Button block className="bg-blue-50 text-blue-600 border-blue-100 font-semibold flex items-center justify-center gap-1 h-10" onClick={handleZalo}><ZaloIcon /> Zalo</Button></Col>
                                    <Col span={12}><Button block className="bg-gray-50 text-gray-700 border-gray-200 font-semibold h-10" onClick={handleChat}>Chat</Button></Col>
                                </Row>
                                <Button block size="large" type="primary" className="bg-green-600 hover:bg-green-500 border-none font-bold text-lg flex items-center justify-center gap-2 h-12 shadow-md shadow-green-100" icon={<PhoneOutlined />} onClick={() => setShowPhone(!showPhone)}>
                                    {showPhone ? (room.landlordPhone || "09xxxxxx") : "BẤM ĐỂ HIỆN SỐ"}
                                </Button>
                            </Card>

                            <Card className="shadow-sm border-none rounded-lg min-h-[150px]">
                                <h4 className="font-bold mb-4">Bình luận</h4>
                                <div className="flex flex-col items-center justify-center text-gray-300 h-20">
                                    <MessageOutlined style={{ fontSize: 30, marginBottom: 10 }} />
                                    <p className="text-xs">Chưa có bình luận nào.</p>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <Input placeholder="Viết bình luận..." className="rounded-full bg-gray-50 border-gray-200 text-sm" />
                                    <Button shape="circle" icon={<ShareAltOutlined />} />
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
                <div className="mt-12 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Phòng dành cho bạn
                        </h3>
                        <Button type="link" onClick={() => navigate('/filter')} className="text-orange-500 font-medium">
                            Xem thêm <RightOutlined />
                        </Button>
                    </div>

                    {loadingRecs ? (
                        <div className="flex justify-center py-10"><Spin /></div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {recommendedRooms.length > 0 ? (
                                recommendedRooms.map(item => (
                                    <Col xs={24} sm={12} md={6} key={item.id}>
                                        <Card
                                            hoverable
                                            className="rounded-lg overflow-hidden border-none shadow-sm h-full flex flex-col"
                                            cover={
                                                <div className="h-40 overflow-hidden relative">
                                                    <img 
                                                        src={item.images?.[0] || 'https://via.placeholder.com/300'} 
                                                        className="w-full h-full object-cover"
                                                        alt="rec"
                                                    />
                                                    <Tag color="orange" className="absolute top-2 left-2 border-none text-[10px]">
                                                        {item.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}
                                                    </Tag>
                                                </div>
                                            }
                                            onClick={() => {
                                                navigate(`/rooms/${item.id}`);
                                                window.scrollTo(0, 0);
                                            }}
                                        >
                                            <div className="font-bold text-sm line-clamp-2 h-10 mb-2">{item.title}</div>
                                            <div className="text-red-600 font-bold text-base mb-1">
                                                {item.price?.toLocaleString()} đ
                                            </div>
                                            <div className="flex items-center text-gray-400 text-xs truncate">
                                                <EnvironmentOutlined className="mr-1" /> {item.address}
                                            </div>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Empty description="Chưa có gợi ý phù hợp" />
                                </Col>
                            )}
                        </Row>
                    )}
                </div>
            </div>

            {/* --- [MỚI] FIXED BOTTOM BAR (CHO MOBILE) --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div>
                    <div className="text-xs text-gray-500">Giá thuê</div>
                    <div className="text-red-600 font-bold text-lg">{room.price?.toLocaleString()} đ</div>
                </div>
                <Button
                    type="primary"
                    className="bg-orange-600 border-none font-bold px-6 h-10 shadow-md"
                    onClick={() => setIsModalOpen(true)}
                >
                    ĐẶT LỊCH NGAY
                </Button>
            </div>

            {/* --- [MỚI] MODAL ĐẶT LỊCH --- */}
            <Modal
                title="Đặt lịch xem phòng"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
            >
                <div className="mb-4 bg-gray-50 p-3 rounded border">
                    <h4 className="font-bold text-gray-700">{room.title}</h4>
                    <p className="text-orange-600 font-bold">{room.price?.toLocaleString()} đ/tháng</p>
                </div>
                <Form form={form} layout="vertical" onFinish={handleBooking}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Ngày xem" name="date" rules={[{ required: true, message: 'Chọn ngày!' }]}>
                            <DatePicker className="w-full" disabledDate={(c) => c && c < dayjs().endOf('day')} />
                        </Form.Item>
                        <Form.Item label="Giờ xem" name="time" rules={[{ required: true, message: 'Chọn giờ!' }]}>
                            <TimePicker className="w-full" format="HH:mm" />
                        </Form.Item>
                    </div>
                    <Form.Item label="Ghi chú" name="note">
                        <Input.TextArea rows={3} placeholder="Ví dụ: Tôi muốn xem phòng vào buổi chiều..." />
                    </Form.Item>
                    <Form.Item label="Thông tin liên hệ">
                        <Input value={user?.fullName || ''} disabled prefix="Tên:" className="mb-2" />
                        <Input value={user?.phone || ''} disabled prefix="SĐT:" />
                        <div className="text-xs text-gray-500 mt-1">*Lấy từ hồ sơ cá nhân của bạn</div>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={bookingLoading} block size="large" className="bg-orange-600 hover:bg-orange-500 border-none">
                        Xác nhận đặt lịch
                    </Button>
                </Form>
            </Modal>

        </div>
    );
};

export default RoomDetail;