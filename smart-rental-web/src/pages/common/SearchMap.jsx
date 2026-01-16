import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Card, List, Tag, Typography, Spin, Image, Button, Input, message } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios'; // Dùng axios để gọi API bản đồ
import roomService from '../../services/roomService';

// --- CẤU HÌNH ICON MARKER ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CẤU HÌNH ICON CLUSTER ---
const createClusterCustomIcon = function (cluster) {
  return L.divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(33, 33, true),
  });
};

const { Text, Title } = Typography;

// 1. Component con: Xử lý sự kiện kéo thả bản đồ
const MapEvents = ({ onMoveEnd }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
};

// 2. Component con: Tự động bay đến tọa độ mới khi tìm kiếm (QUAN TRỌNG)
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 2 }); // Zoom level 14, hiệu ứng bay 2s
  }, [lat, lng]);
  return null;
};

const SearchMap = () => {
  const navigate = useNavigate();
  
  // State vị trí (Mặc định: TP.HCM)
  const [center, setCenter] = useState({ lat: 10.7769, lng: 106.7009 });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(""); // Từ khóa tìm kiếm địa điểm

  // Load dữ liệu lần đầu
  useEffect(() => {
    fetchRooms(center.lat, center.lng);
  }, []);

  // Hàm gọi Backend tìm phòng
  const fetchRooms = async (lat, lng) => {
    setLoading(true);
    try {
      // Tìm trong bán kính 5km (5000m) - Có thể tăng lên nếu muốn
      const res = await roomService.searchNearby(lat, lng, 5000);
      setRooms(res.data || []);
    } catch (error) {
      console.error("Lỗi tải map:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm Xử lý tìm kiếm địa điểm (Geocoding)
  const handleSearchLocation = async () => {
    if (!keyword.trim()) return;

    message.loading({ content: "Đang tìm địa điểm...", key: "searching" });
    try {
      // Gọi API OpenStreetMap Nominatim (Miễn phí)
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: keyword,
          format: 'json',
          addressdetails: 1,
          limit: 1,
          countrycodes: 'vn' // Giới hạn tìm trong Việt Nam
        }
      });

      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        // Cập nhật tâm bản đồ -> Map sẽ tự bay đến đây -> fetchRooms sẽ tự chạy nhờ logic MapEvents hoặc gọi tay
        setCenter({ lat: newLat, lng: newLng });
        
        // Gọi tìm phòng ngay tại vị trí mới
        fetchRooms(newLat, newLng);

        message.success({ content: `Đã chuyển tới: ${display_name}`, key: "searching" });
      } else {
        message.error({ content: "Không tìm thấy địa điểm này!", key: "searching" });
      }
    } catch (error) {
      console.error(error);
      message.error({ content: "Lỗi kết nối bản đồ", key: "searching" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row">
      
      {/* --- DANH SÁCH BÊN TRÁI --- */}
      <div className="w-full md:w-1/3 bg-white border-r overflow-y-auto p-4 custom-scrollbar flex flex-col">
        <div className="mb-4">
          <Title level={4}>Tìm Trọ Quanh Khu Vực</Title>
          
          {/* Ô INPUT TÌM KIẾM ĐỊA ĐIỂM */}
          <div className="flex gap-2 mb-2">
            <Input 
                prefix={<SearchOutlined />} 
                placeholder="Nhập trường học, công ty, địa danh..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearchLocation} // Bấm Enter để tìm
                allowClear
            />
            <Button type="primary" onClick={handleSearchLocation} icon={<SearchOutlined />}>
                Tìm
            </Button>
          </div>
          
          <Text type="secondary">
            {rooms.length > 0 
                ? `Tìm thấy ${rooms.length} phòng gần vị trí tâm bản đồ` 
                : "Chưa thấy phòng nào quanh đây. Hãy thử kéo bản đồ sang khu vực khác."}
          </Text>
        </div>

        {loading ? (
           <div className="flex justify-center mt-10"><Spin size="large" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto">
             <List
                dataSource={rooms}
                locale={{ emptyText: 'Không có phòng nào trong khu vực này' }} // Text khi trống
                renderItem={(item) => (
                <Card 
                    hoverable 
                    className="mb-4 shadow-sm border-gray-200 mx-1"
                    bodyStyle={{ padding: 12 }}
                    onClick={() => navigate(`/rooms/${item.id}`)}
                >
                    <div className="flex gap-3">
                    <Image 
                        src={item.images?.[0] || 'https://via.placeholder.com/150'} 
                        width={100} height={80} 
                        className="object-cover rounded"
                        preview={false}
                    />
                    <div className="flex-1 overflow-hidden">
                        <Text strong className="text-blue-700 block truncate" title={item.title}>{item.title}</Text>
                        <Text className="text-red-600 font-bold block">{item.price?.toLocaleString()} đ/tháng</Text>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                            <EnvironmentOutlined /> {item.address}
                        </div>
                        <div className="mt-1">
                            <Tag color={item.rentalType === 'WHOLE' ? 'purple' : 'cyan'}>
                                {item.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}
                            </Tag>
                        </div>
                    </div>
                    </div>
                </Card>
                )}
            />
          </div>
        )}
      </div>

      {/* --- BẢN ĐỒ BÊN PHẢI --- */}
      <div className="w-full md:w-2/3 relative h-full">
        <MapContainer 
          center={[center.lat, center.lng]} 
          zoom={14} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Component xử lý sự kiện kéo thả */}
          <MapEvents onMoveEnd={fetchRooms} />
          
          {/* Component xử lý bay đến địa điểm mới khi search */}
          <RecenterMap lat={center.lat} lng={center.lng} />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
          >
            {rooms.map(room => (
              <Marker key={room.id} position={[room.latitude, room.longitude]}>
                <Popup>
                  <div className="w-48 cursor-pointer" onClick={() => navigate(`/rooms/${room.id}`)}>
                     <img 
                        src={room.images?.[0]} 
                        alt="room" 
                        className="w-full h-24 object-cover rounded mb-2"
                     />
                     <div className="font-bold text-blue-700 truncate">{room.title}</div>
                     <div className="text-red-600 font-bold">{room.price?.toLocaleString()} đ</div>
                     <div className="text-xs text-gray-500">{room.address}</div>
                     <Button type="primary" size="small" className="mt-2 w-full bg-blue-600">
                        Xem chi tiết
                     </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        
        {/* Nút định vị tôi */}
        <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded shadow">
           <Button icon={<EnvironmentOutlined />} onClick={() => {
               navigator.geolocation.getCurrentPosition(pos => {
                   const { latitude, longitude } = pos.coords;
                   setCenter({ lat: latitude, lng: longitude });
                   fetchRooms(latitude, longitude);
                   message.success("Đã về vị trí của bạn");
               }, () => message.error("Không thể lấy vị trí. Hãy bật GPS."));
           }}>Vị trí của tôi</Button>
        </div>
      </div>
    </div>
  );
};

export default SearchMap;