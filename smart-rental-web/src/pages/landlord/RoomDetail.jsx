import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Spin, Button, Card, Tag, Image, Row, Col, message, Avatar,
    Breadcrumb, Input, Tooltip
} from 'antd';
import {
    ShareAltOutlined, MoreOutlined, EnvironmentOutlined, ClockCircleOutlined,
    ColumnWidthOutlined, AppstoreOutlined, DollarOutlined, HeartOutlined,
    UserOutlined, CheckCircleOutlined, PhoneOutlined, MessageOutlined
} from '@ant-design/icons';
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

const RoomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await roomService.getRoomById(id);
                setRoom(res.data);
            } catch (error) {
                message.error("Không tìm thấy phòng hoặc tin đã bị xóa!");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleChat = () => {
        if (!user) {
            message.warning("Vui lòng đăng nhập để chat!");
            return navigate('/login');
        }
        message.info("Chức năng chat đang được nâng cấp.");
    };

    const handleZalo = () => {
        const phone = room?.landlordPhone;
        if (phone) window.open(`https://zalo.me/${phone}`, '_blank');
        else message.warning("Chủ trọ chưa cập nhật số điện thoại");
    };

    if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
    if (!room) return null;

    // Lấy tọa độ từ API (nếu null thì fallback về mặc định TP.HCM)
    const position = [room.latitude || 10.7769, room.longitude || 106.7009];

    // Dữ liệu Mock
    const missingData = {
        furnitureStatus: room.furnitureStatus || "Nội thất đầy đủ",
        avatar: "https://joesch.moe/api/v1/random",
        joinDate: "Tham gia 1 năm trước",
        responseRate: "100%",
        activeTime: "Hoạt động 30 phút trước"
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-10 font-sans text-gray-800">

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

                    {/* ================= CỘT TRÁI ================= */}
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
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <div className="grid grid-cols-1 gap-y-4">
                                <div className="flex items-center border-b border-gray-100 pb-3">
                                    <ColumnWidthOutlined className="text-xl text-gray-400 mr-3" />
                                    <span className="text-gray-500 w-40 text-sm">Diện tích</span>
                                    <span className="text-gray-800 font-medium text-sm">{room.area} m²</span>
                                </div>
                                <div className="flex items-center border-b border-gray-100 pb-3">
                                    <AppstoreOutlined className="text-xl text-gray-400 mr-3" />
                                    <span className="text-gray-500 w-40 text-sm">Tình trạng nội thất</span>
                                    <span className="text-gray-800 font-medium text-sm">{missingData.furnitureStatus}</span>
                                </div>
                                <div className="flex items-center border-b border-gray-100 pb-3 last:border-none last:pb-0">
                                    <DollarOutlined className="text-xl text-gray-400 mr-3" />
                                    <span className="text-gray-500 w-40 text-sm">Tiền cọc</span>
                                    <span className="text-gray-800 font-medium text-sm">{room.deposit ? `${room.deposit.toLocaleString()} đ` : "Thỏa thuận"}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Mô tả */}
                        <Card className="shadow-sm border-none mb-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-3">Mô tả chi tiết</h3>
                            <div className="whitespace-pre-line text-gray-700 leading-relaxed text-sm">{room.description}</div>
                            {/* List tiện ích từ API */}
                            {room.amenities && room.amenities.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="font-semibold mb-2">Tiện ích:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {room.amenities.map((ame, i) => (
                                            // KIỂM TRA: Chỉ render nếu 'ame' khác null
                                            ame && (
                                                <Tag key={i} color="blue" className="rounded-full px-3">
                                                    {/* Backend trả về String nên hiển thị trực tiếp 'ame', bỏ '.name' */}
                                                    {ame}
                                                </Tag>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* --- 3. PHẦN BẢN ĐỒ MỚI (REACT LEAFLET) --- */}
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
                                    scrollWheelZoom={false} // Tắt zoom bằng lăn chuột để tránh phiền khi cuộn trang
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
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

                    {/* ================= CỘT PHẢI ================= */}
                    <Col xs={24} lg={8}>
                        <div className="sticky top-4 space-y-4">
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
                                <Button block size="large" type="primary" className="bg-orange-600 hover:bg-orange-500 border-none font-bold text-lg flex items-center justify-center gap-2 h-12 shadow-md shadow-orange-100" icon={<PhoneOutlined />} onClick={() => setShowPhone(!showPhone)}>
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
            </div>
        </div>
    );
};

export default RoomDetail;