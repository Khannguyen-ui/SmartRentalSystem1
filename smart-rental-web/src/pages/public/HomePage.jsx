import React, { useEffect, useState, useRef } from 'react';
import {
  Input, Button, Card, Row, Col, Tag, Spin, Empty, Select, message,
  ConfigProvider, Popover, Tabs, Typography, Skeleton
} from 'antd';
import {
  SearchOutlined, EnvironmentFilled, HomeFilled, CheckOutlined,
  AimOutlined, DownOutlined, HeartOutlined, PictureOutlined, RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomService from '../../services/roomService';
import { formatCurrency } from '../../utils/format';
import searchHistoryService from '../../services/searchHistoryService';

const { Option } = Select;
const { Title } = Typography;

// --- CẤU HÌNH DANH SÁCH TỈNH THÀNH ---
const LOCATION_CONFIG = [
  { id: 1, name: 'Tp Hồ Chí Minh', lat: 10.7769, lng: 106.7009, img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1000&auto=format&fit=crop', colSpan: 2, rowSpan: 2 },
  { id: 2, name: 'Hà Nội', lat: 21.0285, lng: 105.8542, img: 'https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=1000&auto=format&fit=crop', colSpan: 1, rowSpan: 1 },
  { id: 3, name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop', colSpan: 1, rowSpan: 1 },
  { id: 4, name: 'Cần Thơ', lat: 10.0452, lng: 105.7469, img: 'https://images.unsplash.com/photo-1623950137785-334338d9dc2c?q=80&w=1000&auto=format&fit=crop', colSpan: 1, rowSpan: 1 },
  { id: 5, name: 'Bình Dương', lat: 10.9804, lng: 106.6519, img: 'https://images.unsplash.com/photo-1605834571992-693db474a896?q=80&w=1000&auto=format&fit=crop', colSpan: 1, rowSpan: 1 },
];

// --- POPOVER KHU VỰC ---
const LocationSelectContent = ({ onClose, onApply }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [tempProv, setTempProv] = useState(null);
  const [tempDist, setTempDist] = useState(null);
  const [tempWard, setTempWard] = useState(null);

  useEffect(() => { axios.get('https://provinces.open-api.vn/api/?depth=1').then(res => setProvinces(res.data)); }, []);

  const handleProvChange = async (val, opt) => {
    setTempProv({ code: val, name: opt.children }); setTempDist(null); setTempWard(null);
    const res = await axios.get(`https://provinces.open-api.vn/api/p/${val}?depth=2`); setDistricts(res.data.districts);
  };
  const handleDistChange = async (val, opt) => {
    setTempDist({ code: val, name: opt.children }); setTempWard(null);
    const res = await axios.get(`https://provinces.open-api.vn/api/d/${val}?depth=2`); setWards(res.data.wards);
  };
  const handleApply = () => {
    const fullText = [tempWard?.name, tempDist?.name, tempProv?.name].filter(Boolean).join(', ');
    onApply({ province: tempProv, district: tempDist, ward: tempWard, fullText, displayName: fullText || "Toàn quốc" }); onClose();
  };

  return (
    <div className="w-[320px] p-1">
      <h4 className="font-bold mb-3 text-center text-gray-700">Chọn khu vực tìm kiếm</h4>
      <div className="flex flex-col gap-3">
        <Select showSearch placeholder="Tỉnh/Thành" className="w-full" onChange={handleProvChange} optionFilterProp="children">{provinces.map(p => <Option key={p.code} value={p.code}>{p.name}</Option>)}</Select>
        <Select showSearch placeholder="Quận/Huyện" className="w-full" onChange={handleDistChange} disabled={!tempProv} value={tempDist?.code} optionFilterProp="children">{districts.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}</Select>
        <Select showSearch placeholder="Phường/Xã" className="w-full" onChange={(val, opt) => setTempWard({ code: val, name: opt.children })} disabled={!tempDist} value={tempWard?.code} optionFilterProp="children">{wards.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}</Select>
        <Button type="primary" className="mt-2 font-bold h-10 w-full rounded-md" onClick={handleApply}>Áp dụng</Button>
      </div>
    </div>
  );
};

// --- POPOVER LOẠI HÌNH ---
const TypeSelectContent = ({ currentType, onClose, onApply }) => {
  const options = [
    { label: 'Tất cả phòng trọ', value: 'ALL' },
    { label: 'Thuê nguyên căn', value: 'WHOLE' },
    { label: 'Ở ghép (KTX)', value: 'SHARED' }
  ];
  return (
    <div className="w-[200px] p-1">
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <div key={opt.value} className="flex justify-between cursor-pointer p-2 hover:bg-gray-50 rounded" onClick={() => { onApply(opt.value); onClose(); }}>
            <span className={currentType === opt.value ? "font-bold text-[#f96302]" : "text-gray-600"}>{opt.label}</span>
            {currentType === opt.value && <CheckOutlined className="text-[#f96302]" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- TRANG CHỦ CHÍNH ---
const HomePage = () => {
  const navigate = useNavigate();

  // State Dữ liệu chính
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Tin Mới Đăng
  const [newListings, setNewListings] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);

  // State Thống kê Khu vực & Tab hiện tại
  const [locationStats, setLocationStats] = useState(LOCATION_CONFIG);
  const [activeTabType, setActiveTabType] = useState('ALL'); // 'ALL' | 'WHOLE' | 'SHARED'

  // State Popover
  const [openLocation, setOpenLocation] = useState(false);
  const [openType, setOpenType] = useState(false);

  const [filters, setFilters] = useState({ keyword: '', type: 'ALL', locationName: 'Toàn quốc', locationCoords: { lat: 10.7769, lng: 106.7009 }, radius: 20000 });
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // --- STATE LỊCH SỬ TÌM KIẾM ---
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);;

  // --- INIT DATA ---
  useEffect(() => {
    fetchRooms();
    fetchNewListings();
    fetchLocationCounts('ALL');
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await searchHistoryService.getMyHistory();
        setHistoryList(res.data);
      }
    } catch (error) {
      console.log("Không tải được lịch sử (có thể chưa đăng nhập)");
    }
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation(); // Ngăn click vào item cha
    try {
      await searchHistoryService.deleteHistory(id);
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      message.error("Lỗi xóa lịch sử");
    }
  };
  const handleSelectHistory = (item) => {
    const searchParams = {
      keyword: item.queryText,
      type: 'ALL', // Hoặc lưu type vào DB nếu muốn
      locationName: item.queryText, // Dùng tạm queryText làm tên hiển thị
      locationCoords: { lat: item.latitude, lng: item.longitude },
      radius: item.radius
    };
    setShowHistory(false);
    navigate('/filter', { state: searchParams });
  };
  // --- API 1: TÌM KIẾM CHÍNH ---
  const fetchRooms = async (overrideParams = {}) => {
    setLoading(true); setRooms([]);
    const currentParams = { ...filtersRef.current, ...overrideParams };


    try {
      const res = await roomService.searchRooms({
        lat: currentParams.locationCoords.lat,
        lng: currentParams.locationCoords.lng,
        radius: currentParams.radius,
        keyword: currentParams.keyword, 
        type: currentParams.type      
      });

         if (currentParams.keyword && currentParams.keyword.trim() !== '') {
          fetchHistory();
      }
      let data = res.data || [];
    
      if (currentParams.type !== 'ALL') data = data.filter(r => r.rentalType === currentParams.type);
      setRooms(data);
    } catch (error) { 
      console.error(error);
     } finally { 
      setLoading(false); }
  };

  // --- API 2: TIN MỚI ĐĂNG ---
  const fetchNewListings = async () => {
    try {
      const res = await roomService.searchRooms({ lat: 16.0, lng: 108.0, radius: 2000000 });
      const allRooms = res.data || [];
      const sorted = allRooms.sort((a, b) => b.id - a.id);
      setNewListings(sorted.slice(0, 10));
    } catch (error) { console.error(error); } finally { setLoadingNew(false); }
  };

  // --- API 3: ĐẾM SỐ LƯỢNG (UPDATE LOGIC) ---
  const fetchLocationCounts = async (typeFilter) => {
    // Clone mảng config để cập nhật số lượng
    const updatedStats = [...LOCATION_CONFIG];

    // Dùng Promise.all để gọi song song cho 5 thành phố
    await Promise.all(updatedStats.map(async (loc) => {
      try {
        // Gọi API tìm kiếm theo bán kính 20km
        const res = await roomService.searchRooms({
          lat: loc.lat,
          lng: loc.lng,
          radius: 20000
        });

        let data = res.data || [];

        // QUAN TRỌNG: Lọc theo loại hình nếu không phải là ALL
        if (typeFilter !== 'ALL') {
          data = data.filter(r => r.rentalType === typeFilter);
        }

        // Gán số lượng đã lọc vào biến count
        loc.count = data.length;
      } catch (e) {
        loc.count = 0;
      }
    }));

    setLocationStats(updatedStats);
  };

  // --- XỬ LÝ KHI CHUYỂN TAB ---
  const handleTabChange = (key) => {
    let type = 'ALL';
    if (key === '2') type = 'WHOLE';  // Map key='2' với Nhà nguyên căn
    if (key === '3') type = 'SHARED'; // Map key='3' với Ký túc xá

    setActiveTabType(type);

    // Gọi hàm đếm lại với loại hình mới
    fetchLocationCounts(type);
  };

  const handleApplyLocation = async (locData) => {
    if (!locData.fullText) {
      const defaultCoords = { lat: 10.7769, lng: 106.7009 };
      setFilters(prev => ({ ...prev, locationName: "Toàn quốc", locationCoords: defaultCoords, radius: 5000000 }));
      fetchRooms({ locationCoords: defaultCoords, radius: 5000000 });
      return;
    }
    message.loading({ content: `Đang tìm vị trí...`, key: 'geo' });
    try {
      const geocode = async (q) => (await axios.get(`https://nominatim.openstreetmap.org/search`, { params: { q, format: 'json', limit: 1, countrycodes: 'vn' } })).data?.[0];
      let result = await geocode(locData.fullText);
      if (!result && locData.district) result = await geocode(`${locData.district.name}, ${locData.province.name}`);
      if (!result && locData.province) result = await geocode(locData.province.name);

      if (result) {
        const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setFilters(prev => ({ ...prev, locationName: locData.displayName, locationCoords: newCoords, radius: 10000 }));
        message.success({ content: `Đã chọn vị trí: ${locData.displayName}`, key: 'geo' });
        // fetchRooms({ locationCoords: newCoords, radius: 10000 }); // Xoá dòng này nếu muốn bấm Tìm mới chạy
      } else { message.warning({ content: 'Không tìm thấy tọa độ!', key: 'geo' }); }
    } catch (e) { message.error({ content: 'Lỗi bản đồ', key: 'geo' }); }
  };

  // =========================================================
  // 👇👇👇 1. HÀM MỚI: CHUYỂN HƯỚNG SANG TRANG FILTER 👇👇👇
  // =========================================================
  // =========================================================
  // 👇 HÀM XỬ LÝ TÌM KIẾM THÔNG MINH (GEOCODING) 👇
  // =========================================================
  const handleSearchNavigate = async () => {
    // 1. Nếu không có từ khóa, chuyển trang luôn với bộ lọc hiện tại
    if (!filters.keyword || !filters.keyword.trim()) {
      navigate('/filter', { state: filters });
      return;
    }

    // Hiển thị loading nhẹ để người dùng biết hệ thống đang xử lý
    const hideLoading = message.loading('Đang xác định vị trí...', 0);

    try {
      // 2. Gọi API Nominatim để kiểm tra xem từ khóa có phải là địa điểm không
      // Giới hạn tìm kiếm trong Việt Nam (countrycodes=vn)
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: filters.keyword,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'vn'
        }
      });

      let nextFilters = { ...filters };

      // 3. Phân tích kết quả
      if (res.data && res.data.length > 0) {
        const place = res.data[0];

        // Logic: Nếu tìm thấy địa điểm, ta dời tâm bản đồ về đó
        // Ví dụ: Nhập "Hà Nội" -> Dời lat/lng về Hà Nội
        const newCoords = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };

        // Cập nhật bộ lọc mới
        nextFilters.locationCoords = newCoords;
        nextFilters.locationName = place.name || place.display_name.split(',')[0]; // Lấy tên ngắn gọn

        // Reset bán kính về mức hợp lý (VD: 5km) để kết quả chính xác hơn
        nextFilters.radius = 5000;

        // Mẹo UX: Có thể giữ keyword để backend lưu lịch sử, 
        // hoặc xóa keyword để backend tìm tất cả phòng tại vị trí mới (tùy bạn chọn).
        // Ở đây mình giữ nguyên keyword để lưu lịch sử chính xác.
      } else {
        // 4. Nếu không phải địa điểm (VD: user nhập "Phòng trọ giá rẻ", "Wifi mạnh")
        // -> Giữ nguyên tọa độ cũ, tìm theo text bình thường.
        console.log("Không tìm thấy địa điểm, tìm theo từ khóa văn bản.");
      }

      // 5. Chuyển trang với bộ lọc đã được cập nhật (hoặc giữ nguyên)
      navigate('/filter', { state: nextFilters });

    } catch (error) {
      console.error("Lỗi định vị:", error);
      // Nếu lỗi mạng, cứ chuyển trang với dữ liệu cũ
      navigate('/filter', { state: filters });
    } finally {
      hideLoading(); // Tắt loading
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#f96302', borderRadius: 8 }, components: { Button: { colorPrimary: '#f96302', colorPrimaryHover: '#d85502' } } }}>
      {/* Đóng lịch sử khi click ra ngoài */}
      <div className="min-h-screen bg-[#f4f4f4] pb-20 font-sans relative" onClick={() => setShowHistory(false)}>

        {/* HEADER SEARCH */}
        <div className="bg-[#f96302] py-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white p-1.5 rounded-lg flex flex-col md:flex-row items-center gap-2 relative" >
              <Input
                prefix={<SearchOutlined className="text-gray-400 text-lg mr-2" />}
                placeholder="Tìm phòng trọ, căn hộ..."
                bordered={false}
                className="flex-grow text-base"
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onPressEnter={handleSearchNavigate}
                onFocus={(e) => { e.stopPropagation(); setShowHistory(true); }} // Mở lịch sử khi focus
                onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              />
              {/* --- DROPDOWN LỊCH SỬ --- */}
              {showHistory && historyList.length > 0 && (
                <div className="absolute top-full left-0 w-full md:w-[60%] bg-white rounded-md shadow-xl mt-2 z-[100] border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-semibold border-b flex justify-between items-center">
                    <span>LỊCH SỬ TÌM KIẾM</span>
                    <span className="cursor-pointer hover:text-red-500" onClick={async () => { await searchHistoryService.clearAll(); setHistoryList([]); }}>Xóa tất cả</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {historyList.map(item => (
                      <div
                        key={item.id}
                        className="px-4 py-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center group border-b border-gray-50 last:border-none"
                        onClick={() => handleSelectHistory(item)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <HistoryOutlined className="text-gray-400" />
                          <div className="truncate">
                            <div className="text-sm font-medium text-gray-700">{item.queryText}</div>
                            {/* <div className="text-xs text-gray-400">Bán kính: {item.radius < 1000 ? item.radius + 'm' : (item.radius/1000) + 'km'}</div> */}
                          </div>
                        </div>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          size="small"
                          className="text-gray-300 hover:text-red-500 hover:bg-transparent"
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="hidden md:block w-[1px] h-6 bg-gray-200"></div>

              <Popover content={<LocationSelectContent onClose={() => setOpenLocation(false)} onApply={handleApplyLocation} />} trigger="click" open={openLocation} onOpenChange={setOpenLocation} placement="bottom" arrow={false}>
                <Button className="border-none shadow-none text-gray-700 font-medium hover:bg-gray-50 flex items-center">
                  <EnvironmentFilled className="text-[#f96302]" /> <span className="truncate max-w-[120px]">{filters.locationName}</span> <DownOutlined className="text-xs text-gray-400" />
                </Button>
              </Popover>

              <Popover content={<TypeSelectContent currentType={filters.type} onClose={() => setOpenType(false)} onApply={(val) => { setFilters(prev => ({ ...prev, type: val })); fetchRooms({ type: val }); }} />} trigger="click" open={openType} onOpenChange={setOpenType} placement="bottom" arrow={false}>
                <Button className="border-none shadow-none text-gray-700 font-medium hover:bg-gray-50 bg-gray-100 flex items-center h-9 rounded">
                  <HomeFilled className="text-[#f96302]" /> <span>Loại phòng</span> <DownOutlined className="text-xs text-gray-400" />
                </Button>
              </Popover>

              {/* 👇 3. Cập nhật nút Tìm Ngay */}
              <Button type="primary" className="px-6 font-bold h-9" onClick={handleSearchNavigate}>Tìm ngay</Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6 space-y-8">

          {/* SECTION 1: TIN MỚI */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <Title level={4} style={{ margin: 0 }}>Tin cho thuê mới đăng</Title>
              <Button type="link" className="text-gray-500 hover:text-[#f96302]">Xem tất cả <RightOutlined /></Button>
            </div>
            {loadingNew ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map(i => <Skeleton.Image key={i} active style={{ width: 220, height: 160 }} />)}
              </div>
            ) : newListings.length === 0 ? (
              <Empty description="Chưa có tin đăng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {newListings.map((item) => (
                  <div key={item.id} className="min-w-[220px] max-w-[220px] group cursor-pointer" onClick={() => navigate(`/rooms/${item.id}`)}>
                    <div className="relative h-[160px] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.images?.[0] || 'https://via.placeholder.com/200'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt="room"
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] text-white font-medium drop-shadow-md">Mới đăng</div>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-[#f96302] transition-colors">{item.title}</h3>
                    <div className="text-red-600 font-bold text-base mb-1">{formatCurrency(item.price)}/tháng</div>
                    <div className="text-xs text-gray-400 flex items-center truncate"><EnvironmentFilled className="mr-1 text-gray-300" /> {item.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: KHU VỰC NỔI BẬT */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>Khu vực cho thuê nổi bật</Title>
              </div>
              {/* Tabs với onChange handler để cập nhật state activeTabType */}
              <Tabs
                defaultActiveKey="1"
                items={[
                  { key: '1', label: 'Tất cả' },
                  { key: '2', label: 'Nhà nguyên căn' },
                  { key: '3', label: 'Ký túc xá / Ở ghép' }
                ]}
                className="custom-tabs-no-bar"
                onChange={handleTabChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-auto md:h-[350px]">
              {locationStats.map((loc) => (
                <div
                  key={loc.id}
                  className={`relative rounded-lg overflow-hidden cursor-pointer group ${loc.colSpan === 2 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'} h-[160px] md:h-auto`}
                  // 👇 4. Cập nhật sự kiện click vào khu vực -> Chuyển trang kèm tham số
                  onClick={() => {
                    navigate('/filter', {
                      state: {
                        locationName: loc.name,
                        locationCoords: { lat: loc.lat, lng: loc.lng },
                        radius: 20000,
                        type: activeTabType, // Lấy loại hình đang chọn
                        keyword: ''
                      }
                    });
                  }}
                >
                  <img src={loc.img} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-bold mb-0">{loc.name}</h3>
                    {/* HIỂN THỊ SỐ LƯỢNG ĐÃ ĐẾM */}
                    <span className="text-sm opacity-90 font-medium">
                      {loc.count > 0 ? `${loc.count} tin đăng` : 'Chưa có tin'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: DANH SÁCH CHÍNH (Vẫn giữ nguyên để hiển thị mặc định) */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Tin dành cho bạn tại {filters.locationName}</Title>
              <Button icon={<AimOutlined />} onClick={() => navigate('/search')}>Xem trên bản đồ</Button>
            </div>
            {loading ? <div className="text-center py-20"><Spin size="large" /></div> : rooms.length === 0 ? <Empty description="Không tìm thấy tin đăng nào" className="py-10" /> : (
              <Row gutter={[16, 16]}>
                {rooms.map(room => (
                  <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                    <Card
                      hoverable
                      className="rounded-lg overflow-hidden border border-gray-200 shadow-none hover:shadow-lg transition-all h-full flex flex-col"
                      bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
                      cover={<div className="relative h-48 overflow-hidden"><img alt={room.title} src={room.images?.[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" /><Tag color="#f96302" className="absolute top-2 left-2 border-none font-semibold text-xs">{room.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}</Tag></div>}
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    >
                      <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2 h-10" title={room.title}>{room.title}</h3>
                      <div className="text-xs text-gray-500 mb-2 truncate"><EnvironmentFilled className="mr-1 text-gray-400" />{room.address}</div>
                      <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex justify-between items-end"><span className="text-[#f96302] font-bold text-base">{formatCurrency(room.price)}/tháng</span><span className="text-xs text-gray-400">{room.area} m²</span></div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
};

export default HomePage;