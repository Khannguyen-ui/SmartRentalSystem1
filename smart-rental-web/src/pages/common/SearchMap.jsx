import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Card, List, Tag, Typography, Spin, Image, Button, message, Empty } from 'antd';
import { 
    EnvironmentOutlined, ArrowLeftOutlined, AimOutlined, 
    FullscreenOutlined, FullscreenExitOutlined, DoubleLeftOutlined, DoubleRightOutlined 
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import roomService from '../../services/roomService';

const { Text, Title } = Typography;

// --- CẤU HÌNH ICON (Giữ nguyên) ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
        map.flyTo([lat, lng], 14, { duration: 1.5 });
        // Cập nhật lại kích thước khi container thay đổi
        setTimeout(() => map.invalidateSize(), 500); 
    }
  }, [lat, lng]);
  return null;
};

const SearchMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State điều khiển mở rộng bản đồ
  const [isExpanded, setIsExpanded] = useState(false);

  const initialLat = parseFloat(searchParams.get('lat')) || 10.7769;
  const initialLng = parseFloat(searchParams.get('lng')) || 106.7009;
  const initialRadius = parseInt(searchParams.get('radius')) || 5000;

  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms(initialLat, initialLng);
  }, [searchParams]);

  const fetchRooms = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await roomService.searchRooms({
        lat, lng, radius: initialRadius, size: 50
      });
      setRooms(res.data?.content || []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Sử dụng overflow-hidden để tránh hiện thanh cuộn ngang khi đang transition
    <div className="flex h-[calc(100vh-64px)] flex-row bg-white overflow-hidden font-sans">
      
      {/* --- PANEL DANH SÁCH (Sẽ bị đẩy sang trái) --- */}
      <div 
        className={`transition-all duration-500 ease-in-out border-r flex flex-col shadow-2xl z-20 bg-white
          ${isExpanded ? 'w-[0px] md:w-[80px] opacity-0 md:opacity-100' : 'w-full md:w-[420px]'}`}
      >
        <div className={`p-4 border-b whitespace-nowrap ${isExpanded ? 'hidden' : 'block'}`}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-2 p-0">Quay lại</Button>
          <Title level={4} className="m-0 uppercase text-sm tracking-widest text-orange-600">Phòng gần bạn</Title>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-gray-50">
          {loading ? (
             <div className="flex justify-center items-center h-40"><Spin /></div>
          ) : isExpanded ? (
             // Khi mở rộng, chỉ hiện các icon nhỏ hoặc thumbnail tối giản
             <div className="flex flex-col items-center gap-4 py-4">
                {rooms.slice(0, 5).map(r => <Avatar key={r.id} src={r.images?.[0]} size={50} className="border-2 border-orange-500 shadow-md cursor-pointer" onClick={() => setIsExpanded(false)} />)}
                <div className="text-[10px] font-bold text-gray-400 rotate-90 mt-4 whitespace-nowrap uppercase tracking-tighter">Danh sách đang ẩn</div>
             </div>
          ) : (
             <List
                dataSource={rooms}
                renderItem={(item) => (
                    <Card 
                        hoverable 
                        className="mb-3 rounded-xl overflow-hidden border-none shadow-sm hover:shadow-md"
                        bodyStyle={{ padding: 10 }}
                        onClick={() => navigate(`/rooms/${item.id}`)}
                    >
                        <div className="flex gap-3">
                            <Image src={item.images?.[0]} width={100} height={80} className="object-cover rounded-lg" preview={false} />
                            <div className="flex-1 min-w-0">
                                <Text strong className="text-gray-800 block truncate text-[13px]">{item.title}</Text>
                                <Text className="text-red-600 font-bold block">{item.price?.toLocaleString()} đ</Text>
                                <div className="text-[10px] text-gray-400 truncate mt-1"><EnvironmentOutlined /> {item.address}</div>
                            </div>
                        </div>
                    </Card>
                )}
            />
          )}
        </div>
      </div>

      {/* --- BẢN ĐỒ (Sẽ chiếm hết góc phải) --- */}
      <div className="flex-1 relative transition-all duration-500">
        {/* NÚT ĐIỀU KHIỂN MỞ RỘNG (FLOATING ACTION BUTTON) */}
        <div className="absolute top-1/2 -left-4 z-[1000] -translate-y-1/2 hidden md:block">
            <Button 
                shape="circle" 
                type="primary"
                className="bg-orange-600 border-white border-2 w-10 h-10 shadow-2xl flex items-center justify-center hover:bg-orange-500 transition-all"
                icon={isExpanded ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
            />
        </div>

        <MapContainer 
          center={[center.lat, center.lng]} 
          zoom={14} 
          style={{ height: "100%", width: "100%" }}
          zoomControl={false} // Tắt zoom mặc định để tự tùy biến vị trí
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap lat={center.lat} lng={center.lng} />

          <MarkerClusterGroup chunkedLoading>
            {rooms.map(room => (
              <Marker key={room.id} position={[room.latitude, room.longitude]}>
                <Popup>
                  <div className="w-52" onClick={() => navigate(`/rooms/${room.id}`)}>
                     <img src={room.images?.[0]} className="w-full h-24 object-cover rounded-md mb-2" />
                     <div className="font-bold text-gray-800 line-clamp-1">{room.title}</div>
                     <div className="text-red-600 font-bold">{room.price?.toLocaleString()} đ</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        
        {/* Nút định vị & Zoom */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button 
                size="large" icon={<AimOutlined />} 
                className="shadow-md font-bold text-orange-600 bg-white"
                onClick={() => {
                    navigator.geolocation.getCurrentPosition(pos => {
                        const { latitude, longitude } = pos.coords;
                        setCenter({ lat: latitude, lng: longitude });
                        fetchRooms(latitude, longitude);
                    });
                }}
            />
            <Button 
                size="large" 
                icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                className="shadow-md font-bold text-gray-700 bg-white"
                onClick={() => setIsExpanded(!isExpanded)}
            />
        </div>
      </div>
    </div>
  );
};

export default SearchMap;