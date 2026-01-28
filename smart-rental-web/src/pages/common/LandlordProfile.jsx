// File: smart-rental-web/src/pages/public/LandlordProfile.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Thêm useLocation
import {
  Avatar, Button, Card, Col, Row, Tag, Typography,
  Spin, Statistic, Empty, Rate, Breadcrumb, Tooltip, message // Thêm message
} from 'antd';
import {
  UserOutlined, PhoneOutlined,
  EnvironmentOutlined, ClockCircleOutlined, HeartOutlined,
  SafetyCertificateFilled, HomeOutlined, CheckCircleFilled,
  CameraFilled, IdcardFilled, CrownFilled, FireFilled
} from '@ant-design/icons';
import { Select } from 'antd';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import userService from '../../services/userService';
import roomService from '../../services/roomService';
import { formatCurrency } from '../../utils/format';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

const LandlordProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Hook lấy vị trí hiện tại

  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('newest');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resProfile = await userService.getLandlordPublicProfile(id);
      setProfile(resProfile.data);

      const resRooms = await roomService.getRoomsByLandlord(id);
      setRooms(resRooms.data || []);
    } catch (error) {
      console.error("Lỗi tải profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ NHẮN TIN (MỚI) ---
  const handleStartChat = () => {
    // 1. Kiểm tra Token (giả sử bạn lưu token là 'token' hoặc 'accessToken')
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

    if (!token) {
      message.warning("Vui lòng đăng nhập để nhắn tin với chủ nhà!");
      // Chuyển hướng sang login, kèm state 'from' để login xong quay lại đây
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // 2. Kiểm tra xem có đang tự nhắn tin cho chính mình không
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser && currentUser.id === profile.id) {
      message.info("Đây là trang cá nhân của bạn.");
      return;
    }

    
    navigate('/messages', { state: { partnerId: profile.id } });
  };

  const getLastActiveText = (dateString) => {
    if (!dateString) return "Chưa hoạt động";
    const lastActive = dayjs(dateString);
    const diffMins = dayjs().diff(lastActive, 'minute');

    if (diffMins < 5) return <span className="text-green-600 font-bold">● Đang hoạt động</span>;
    if (diffMins < 60) return `Online ${diffMins} phút trước`;
    return `Online ${lastActive.fromNow()}`;
  };

  const isRented = (room) => {
    if (room.status === 'FULL') return true;
    if (room.rentalType === 'WHOLE' && (room.currentTenants > 0)) return true;
    return false;
  };

  const getSortedRooms = () => {
    let sorted = [...rooms];

    if (sortType === 'newest') {
      // 🟢 LOGIC MỚI: Ưu tiên VIP (Priority cao) -> Sau đó mới đến Ngày tạo
      sorted.sort((a, b) => {
        const priorityA = a.priorityLevel || 0;
        const priorityB = b.priorityLevel || 0;

        // Nếu khác độ ưu tiên, đưa VIP lên trước
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        // Nếu cùng độ ưu tiên, tin mới hơn lên trước
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    } else if (sortType === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  };

  if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
  if (!profile) return <div className="text-center mt-10">Không tìm thấy người dùng</div>;

  const isVerified = profile.isIdentityVerified === true || profile.identityVerified === true;
  const isOnline = dayjs().diff(dayjs(profile.lastActiveAt), 'minute') < 5;

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans">

      {/* 1. BREADCRUMB */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <Breadcrumb
          items={[
            { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
            { title: <Link to="/search">Tìm phòng</Link> },
            { title: <span className="text-gray-800 font-medium">Hồ sơ: {profile.fullName}</span> },
          ]}
        />
      </div>

      {/* 2. HEADER PROFILE */}
      <div className="max-w-6xl mx-auto px-4 mt-2">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">

          {/* BANNER */}
          <div
            className="h-[250px] w-full bg-cover bg-center relative"
            style={{
              backgroundImage: `url('${profile.bannerUrl || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop"}')`
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* INFO USER */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-4 gap-6">

              <div className="relative z-10 group cursor-pointer">
                <Avatar
                  size={140}
                  src={profile.avatarUrl}
                  icon={<UserOutlined />}
                  className="border-[5px] border-white shadow-md bg-white object-cover"
                />

                {isVerified && (
                  <Tooltip title="Tài khoản đã xác minh (eKYC)">
                    <div className="absolute bottom-2 right-2 z-30 bg-white rounded-full flex items-center justify-center p-0.5 shadow-sm">
                      <CheckCircleFilled className="text-blue-500 text-3xl border-2 border-white rounded-full bg-white" />
                    </div>
                  </Tooltip>
                )}

                {isOnline && (
                  <Tooltip title="Đang hoạt động">
                    <div
                      className={`absolute bottom-2 ${isVerified ? 'right-12' : 'right-4'} bg-green-500 border-4 border-white w-6 h-6 rounded-full z-20`}
                    ></div>
                  </Tooltip>
                )}
              </div>

              <div className="flex-grow text-center md:text-left mb-2 md:mb-0">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Title level={2} style={{ margin: 0, color: '#333' }}>
                    {profile.fullName}
                  </Title>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-2 mt-1 mb-2">
                  {isVerified && (
                    <Tag color="success" icon={<IdcardFilled />}>Đã xác minh</Tag>
                  )}
                  {profile.successfulDeals >= 5 && (
                    <Tag color="gold" icon={<CheckCircleFilled />}>Chủ trọ uy tín</Tag>
                  )}
                </div>

                <div className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1 text-sm">
                  <ClockCircleOutlined /> {getLastActiveText(profile.lastActiveAt)}
                  <span className="mx-1">|</span>
                  <span>Tham gia: {dayjs(profile.joinDate).format('DD/MM/YYYY')}</span>
                </div>
              </div>

              <div className="flex gap-3 mb-4 md:mb-0">
                {/* --- NÚT NHẮN TIN ĐÃ GẮN SỰ KIỆN --- */}
                <Button
                  size="large"
                  className="rounded-full border-gray-300"
                  onClick={handleStartChat} // <--- Thêm sự kiện ở đây
                >
                  Nhắn tin
                </Button>
                {/* ----------------------------------- */}

                <Button type="primary" size="large" icon={<PhoneOutlined />} className="bg-[#f96302] hover:bg-orange-600 rounded-full font-bold px-6">
                  Liên hệ
                </Button>
              </div>
            </div>

            <hr className="border-gray-100 my-4" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-orange-50/50">
                <Statistic
                  title={<span className="text-gray-500 text-xs uppercase font-bold">Đánh giá</span>}
                  value={profile.averageRating || 0}
                  precision={1}
                  suffix="/ 5"
                  valueStyle={{ color: '#f96302', fontWeight: 'bold' }}
                  prefix={<Rate disabled defaultValue={1} count={1} className="text-[#f96302] mr-1" />}
                />
                <div className="text-xs text-gray-400 mt-1">{profile.totalReviews || 0} lượt</div>
              </div>

              <div className="text-center p-3 rounded-lg hover:bg-gray-50">
                <Statistic
                  title={<span className="text-gray-500 text-xs uppercase font-bold">Giao dịch</span>}
                  value={profile.successfulDeals || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<SafetyCertificateFilled />}
                />
                <div className="text-xs text-gray-400 mt-1">Hợp đồng thành công</div>
              </div>

              <div className="text-center p-3 rounded-lg hover:bg-gray-50">
                <Statistic
                  title={<span className="text-gray-500 text-xs uppercase font-bold">Tổng tin đăng</span>}
                  value={profile.totalRooms || rooms.length}
                />
                <div className="text-xs text-gray-400 mt-1">Phòng trọ</div>
              </div>

              <div className="text-center p-3 rounded-lg hover:bg-gray-50">
                <div className="ant-statistic">
                  <div className="ant-statistic-title text-gray-500 text-xs uppercase font-bold">Khu vực hoạt động</div>
                  <div className="ant-statistic-content mt-1">
                    <div className="flex flex-wrap justify-center gap-1">
                      {profile.activeDistricts && profile.activeDistricts.length > 0 ? (
                        profile.activeDistricts.slice(0, 2).map((d, i) => (
                          <Tag key={i} color="geekblue" className="m-0 border-none bg-blue-50 text-blue-600 font-medium">{d}</Tag>
                        ))
                      ) : (
                        <span className="text-sm font-bold text-gray-400">Toàn quốc</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Hoạt động chính</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BODY: DANH SÁCH TIN ĐĂNG */}
      <div className="max-w-6xl mx-auto px-4 mt-8">

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800 m-0 border-l-4 border-[#f96302] pl-3">
              Tin đăng của {profile.fullName}
            </h2>
            <Tag color="#f96302" className="rounded-full px-2">{rooms.length}</Tag>
          </div>

          <Select
            defaultValue="newest"
            bordered={false}
            className="font-medium text-gray-600"
            onChange={setSortType}
          >
            <Select.Option value="newest">Mới nhất</Select.Option>
            <Select.Option value="price_asc">Giá thấp đến cao</Select.Option>
            <Select.Option value="price_desc">Giá cao đến thấp</Select.Option>
          </Select>
        </div>

        {rooms.length === 0 ? (
          <Empty description="Người này hiện không có tin đăng nào." className="bg-white p-10 rounded-lg shadow-sm" />
        ) : (
          <Row gutter={[20, 20]}>
            {getSortedRooms().map(room => {
              const rented = isRented(room);

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                  <Card
                    hoverable={!rented}
                    // 🟢 VIỀN CAM NẾU LÀ VIP (Đồng bộ HomePage)
                    className={`overflow-hidden border shadow-sm transition-all rounded-lg h-full flex flex-col group ${
                      rented
                        ? 'bg-gray-100 opacity-90 border-gray-200'
                        : ((room.priorityLevel && room.priorityLevel > 0) ? 'border-orange-200 border-2 bg-white hover:shadow-lg' : 'border-gray-200 bg-white hover:shadow-lg')
                    }`}
                    bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
                    cover={
                      <div className="relative h-44 w-full overflow-hidden">
                        <img
                          src={room.images?.[0] || 'https://via.placeholder.com/300'}
                          className={`h-full w-full object-cover transition-transform duration-500 ${rented ? 'grayscale filter blur-[1px]' : 'group-hover:scale-105'}`}
                          alt="room"
                        />

                        {/* 🟢 NHÃN VIP: Chỉ hiện khi chưa thuê & Có priority */}
                        {!rented && room.priorityLevel > 0 && (
                          <Tag color="#fadb14" className="absolute top-2 right-2 border-none font-bold text-[10px] m-0 flex items-center gap-1 shadow-sm text-black px-1.5 py-0.5 z-10">
                            <CrownFilled /> VIP
                          </Tag>
                        )}

                        {/* 🟢 ICON LỬA: Nếu priority >= 50 */}
                        {!rented && room.priorityLevel >= 50 && (
                           <div className="absolute bottom-2 left-2 text-[#fadb14] animate-bounce drop-shadow-md z-10">
                             <FireFilled style={{ fontSize: '18px' }} />
                           </div>
                        )}

                        {/* OVERLAY KHI ĐÃ THUÊ */}
                        {rented && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                            <div className="border-2 border-white text-white font-bold text-lg px-3 py-1 transform -rotate-12 tracking-wider shadow-lg">
                              ĐÃ CHO THUÊ
                            </div>
                            {room.status === 'FULL' && (
                              <div className="text-white text-xs mt-2 font-medium bg-red-600 px-2 rounded">Hết phòng</div>
                            )}
                          </div>
                        )}

                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                          <CameraFilled /> {room.images?.length || 0}
                        </div>
                      </div>
                    }
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <div className="flex-grow">
                      {/* 🟢 TIÊU ĐỀ: Có icon Crown nếu là VIP */}
                      <h3 className={`text-[15px] font-bold line-clamp-2 mb-2 min-h-[44px] leading-snug transition-colors flex items-start gap-1 ${
                        rented ? 'text-gray-500' : ((room.priorityLevel > 0) ? 'text-[#f96302]' : 'text-gray-800')
                      }`}>
                         {!rented && room.priorityLevel > 0 && <CrownFilled className="mt-1 flex-shrink-0" />} {room.title}
                      </h3>

                      <div className="flex items-end gap-2 mb-2">
                        <span className={`font-bold text-lg leading-none ${rented ? 'text-gray-500 decoration-slate-400' : 'text-[#d0021b]'}`}>
                          {formatCurrency(room.price)}
                        </span>
                        <span className="text-gray-400 text-xs pb-0.5">/ tháng</span>
                      </div>

                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <EnvironmentOutlined /> {room.address}
                      </div>

                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>{room.area} m²</span>
                        <span className="w-[1px] bg-gray-300 h-3 self-center"></span>

                        {room.rentalType === 'SHARED' ? (
                          <span className={room.currentTenants >= room.capacity ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                            {room.currentTenants || 0}/{room.capacity} người
                          </span>
                        ) : (
                          <span>{room.capacity} ngủ</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-400">{dayjs(room.createdAt).fromNow()}</span>
                      {!rented && <HeartOutlined className="text-gray-400 hover:text-red-500 transition-colors" />}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
};

export default LandlordProfile;