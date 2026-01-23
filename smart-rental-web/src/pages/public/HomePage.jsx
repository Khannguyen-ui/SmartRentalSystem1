import React, { useEffect, useState, useRef } from 'react';
import {
  Input, Button, Card, Row, Col, Tag, Spin, Empty, Select, message,
  ConfigProvider, Popover, Tabs, Typography, Skeleton
} from 'antd';
import {
  SearchOutlined, EnvironmentFilled, HomeFilled, CheckOutlined,
  AimOutlined, DownOutlined, HeartOutlined, PictureOutlined, RightOutlined,
  HistoryOutlined,
  CloseOutlined
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pageSize = 8;
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
      // 🟢 SỬA TẠI ĐÂY: Đổi 'token' thành 'accessToken'
      const token = localStorage.getItem('accessToken');

      if (token) {
        const res = await searchHistoryService.getMyHistory();
        setHistoryList(res.data);
      }
    } catch (error) {
      console.log("Lỗi tải lịch sử:", error);
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
    // Tạo state từ dữ liệu lịch sử
    const searchParams = {
      keyword: item.queryText, // Từ khóa cũ
      type: 'ALL',
      locationName: item.queryText, // Hoặc lấy address nếu DB có lưu
      locationCoords: {
        lat: item.latitude || 10.7769, // Fallback nếu lịch sử cũ ko có tọa độ
        lng: item.longitude || 106.7009
      },
      radius: item.radius || 20000
    };

    setShowHistory(false);

    // 👇 Chuyển hướng ngay lập tức
    navigate('/filter', { state: searchParams });
  };

  // --- API 1: TÌM KIẾM CHÍNH (CẬP NHẬT NGẮT Ở 12 TIN) ---
  const fetchRooms = async (isLoadMore = false) => {
    setLoading(true);
    if (!isLoadMore) {
      setRooms([]);
      setPage(0);
    }

    const nextPage = isLoadMore ? page + 1 : 0;
    const currentParams = filtersRef.current;

    try {
      const res = await roomService.searchRooms({
        lat: currentParams.locationCoords.lat,
        lng: currentParams.locationCoords.lng,
        radius: currentParams.radius,
        keyword: currentParams.keyword,
        type: currentParams.type,
        page: nextPage,
        size: isLoadMore ? 4 : 8
      });

      if (currentParams.keyword?.trim()) fetchHistory();


      const newData = res.data.content || [];

      setRooms(prev => isLoadMore ? [...prev, ...newData] : newData);
      setPage(nextPage);
      setHasMore(newData.length === (isLoadMore ? 4 : 8));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // --- API 2: TIN MỚI ĐĂNG ---
  const fetchNewListings = async () => {
    try {
      const res = await roomService.searchRooms({ lat: 16.0, lng: 108.0, radius: 2000000, size: 10 });

      // 🟢 SỬA TẠI ĐÂY: Lấy content
      const allRooms = res.data.content || [];

      const sorted = [...allRooms].sort((a, b) => b.id - a.id);
      setNewListings(sorted.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNew(false);
    }
  };

  // --- API 3: ĐẾM SỐ LƯỢNG (UPDATE LOGIC) ---
  const fetchLocationCounts = async (typeFilter) => {
    const updatedStats = [...LOCATION_CONFIG];

    await Promise.all(updatedStats.map(async (loc) => {
      try {
        const res = await roomService.searchRooms({
          lat: loc.lat,
          lng: loc.lng,
          radius: 20000,
          size: 1, // Chỉ lấy 1 tin để lấy được totalElements
          type: typeFilter !== 'ALL' ? typeFilter : undefined
        });

        // 🟢 SỬA TẠI ĐÂY: Dùng totalElements từ Backend trả về
        loc.count = res.data.totalElements || 0; 
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

      } else { message.warning({ content: 'Không tìm thấy tọa độ!', key: 'geo' }); }
    } catch (e) { message.error({ content: 'Lỗi bản đồ', key: 'geo' }); }
  };

  // --- XỬ LÝ TÌM KIẾM & CHUYỂN TRANG ---
  const handleSearchNavigate = async () => {
    // 1. Chuẩn bị bộ lọc mặc định từ state hiện tại
    let searchState = {
      keyword: filters.keyword || '',
      type: filters.type || 'ALL',
      locationName: filters.locationName,
      locationCoords: filters.locationCoords,
      radius: filters.radius || 20000 // Mặc định 20km
    };

    // 2. Nếu không có từ khóa -> Chuyển trang ngay với bộ lọc hiện tại
    if (!filters.keyword || !filters.keyword.trim()) {
      navigate('/filter', { state: searchState });
      return;
    }

    // 3. Nếu có từ khóa -> Xử lý thông minh (Geocoding)
    const hideLoading = message.loading('Đang xử lý tìm kiếm...', 0);

    try {
      // Gọi API OpenStreetMap để xem từ khóa có phải là một địa điểm cụ thể không
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: filters.keyword,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'vn'
        }
      });

      if (res.data && res.data.length > 0) {
        // ==> TÌM THẤY ĐỊA ĐIỂM (VD: "Quận 1", "Đại học FPT")
        const place = res.data[0];

        // Cập nhật tọa độ trung tâm và bán kính nhỏ lại (5km) để tìm xung quanh đó
        searchState.locationCoords = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };
        searchState.locationName = place.name || filters.keyword;
        searchState.radius = 5000;

        // Tùy chọn: Có thể xóa keyword để API filter chỉ tìm theo tọa độ
        // searchState.keyword = ''; 
      } else {
        // ==> KHÔNG PHẢI ĐỊA ĐIỂM (VD: "Phòng trọ giá rẻ", "Có gác")
        // Giữ nguyên tọa độ hiện tại (hoặc Toàn quốc) và tìm theo text keyword
        console.log("Tìm theo từ khóa văn bản thuần túy");
      }

      // 4. CHUYỂN HƯỚNG SANG TRANG FILTER
      navigate('/filter', { state: searchState });

    } catch (error) {
      console.error("Lỗi định vị:", error);
      // Nếu lỗi API map, vẫn chuyển trang bình thường để không chặn người dùng
      navigate('/filter', { state: searchState });
    } finally {
      hideLoading();
    }
  };;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#f96302', borderRadius: 8 }, components: { Button: { colorPrimary: '#f96302', colorPrimaryHover: '#d85502' } } }}>
      {/* Đóng lịch sử khi click ra ngoài */}
      <div className="min-h-screen bg-[#f4f4f4] pb-20 font-sans relative" onClick={() => setShowHistory(false)}>

        {/* HEADER SEARCH */}

        <div className="bg-[#f96302] py-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-4">
            {/* Thêm class 'relative' để dropdown bám theo div này */}
            <div className="bg-white p-1.5 rounded-lg flex flex-col md:flex-row items-center gap-2 relative">

              {/* INPUT TÌM KIẾM */}
              <Input
                prefix={<SearchOutlined className="text-gray-400 text-lg mr-2" />}
                placeholder="Tìm phòng trọ, căn hộ..."
                bordered={false}
                className="flex-grow text-base"
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}

                // Khi nhấn Enter -> Tìm kiếm
                onPressEnter={handleSearchNavigate}

                // Khi focus hoặc click vào ô input -> Mở lịch sử
                onFocus={(e) => { e.stopPropagation(); setShowHistory(true); }}
                onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              />


              {/* --- PHẦN DROPDOWN LỊCH SỬ (PHIÊN BẢN THU NHỎ) --- */}
              {showHistory && historyList.length > 0 && (
                <div
                  // Giảm bo góc xuống rounded-xl và giảm shadow cho nhẹ nhàng
                  className="absolute top-[105%] left-0 w-full bg-white rounded-xl shadow-xl z-[100] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {/* Tiêu đề: Giảm padding và cỡ chữ */}
                  <div className="px-4 py-2.5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <span className="text-sm font-semibold text-gray-600">Tiếp tục tìm kiếm</span>
                    <Button
                      type="text"
                      size="small"
                      className="text-gray-400 hover:text-red-500 text-[11px]"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await searchHistoryService.clearAllHistory();
                        setHistoryList([]);
                      }}
                    >
                      Xóa tất cả
                    </Button>
                  </div>

                  {/* Danh sách: Giảm chiều cao tối đa xuống 300px */}
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {historyList.map(item => (
                      <div
                        key={item.id}
                        // Giảm padding từ py-4 xuống py-2
                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer flex justify-between items-center group transition-all border-b border-gray-50 last:border-none"
                        onClick={() => handleSelectHistory(item)}
                      >
                        <div className="flex items-center gap-3 flex-grow overflow-hidden">
                          {/* Icon: Giảm từ w-10 xuống w-8 */}
                          <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <HistoryOutlined className="text-red-400 text-sm" />
                          </div>

                          <div className="flex flex-col truncate">
                            {/* Chữ chính: text-sm */}
                            <span className="text-sm text-gray-700 font-medium group-hover:text-[#f96302] truncate">
                              {item.queryText || item.address || "Tìm kiếm trước đó"}
                            </span>

                            {/* Chữ phụ: nhỏ hơn (text-[11px]) */}
                            {item.address && item.address !== item.queryText && (
                              <span className="text-[11px] text-gray-400 truncate opacity-80">
                                {item.address}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mũi tên nhỏ lại */}
                          <RightOutlined className="text-gray-300 text-[10px] group-hover:text-[#f96302] group-hover:translate-x-0.5 transition-all" />

                          <Button
                            type="text"
                            icon={<CloseOutlined className="text-[9px]" />}
                            size="small"
                            // Thu nhỏ nút xóa
                            className="text-gray-300 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(e, item.id);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* --- KẾT THÚC PHẦN LỊCH SỬ --- */}

              <div className="hidden md:block w-[1px] h-6 bg-gray-200"></div>

              {/* Các nút Lọc Khu Vực, Loại Phòng giữ nguyên */}
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

              <Button
                type="primary"
                className="px-6 font-bold h-9"
                onClick={handleSearchNavigate}
              >
                Tìm ngay
              </Button>
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



          {/* SECTION 3: DANH SÁCH CHÍNH */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Tin dành cho bạn</Title>
              <Button icon={<AimOutlined />} onClick={() => navigate('/search')}>Xem trên bản đồ</Button>
            </div>

            {loading && isInitialLoad ? (
              <div className="text-center py-20"><Spin size="large" /></div>
            ) : rooms.length === 0 ? (
              <Empty description="Không tìm thấy tin đăng nào" className="py-10" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {rooms.map(room => (
                    <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                      <Card
                        hoverable
                        className="rounded-lg overflow-hidden border border-gray-200 shadow-none hover:shadow-lg transition-all h-full flex flex-col"
                        bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
                        cover={
                          <div className="relative h-48 overflow-hidden">
                            <img
                              alt={room.title}
                              src={room.images?.[0] || 'https://via.placeholder.com/400'}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                            <Tag color="#f96302" className="absolute top-2 left-2 border-none font-semibold text-xs">
                              {room.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}
                            </Tag>
                          </div>
                        }
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2 h-10" title={room.title}>{room.title}</h3>
                        <div className="text-xs text-gray-500 mb-2 truncate"><EnvironmentFilled className="mr-1 text-gray-400" />{room.address}</div>
                        <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex justify-between items-end">
                          <span className="text-[#f96302] font-bold text-base">{formatCurrency(room.price)}/tháng</span>
                          <span className="text-xs text-gray-400">{room.area} m²</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* --- NÚT ĐIỀU KHIỂN NẰM GIỮA --- */}
                <div className="mt-12 flex justify-center pb-10">
                  {hasMore && rooms.length < 16 ? (
                    // Nút Mở rộng (Load thêm 8 tin để thành 16)
                    <Button
                      size="large"
                      className="px-12 h-12 font-semibold border-[#f96302] text-[#f96302] hover:bg-orange-50 rounded-md"
                      onClick={() => fetchRooms(true)}
                      loading={loading}
                    >
                      Mở rộng thêm tin
                    </Button>
                  ) : (rooms.length >= 16 || (!hasMore && rooms.length > 0)) ? (
                    // Nút Xem tất cả (Chuyển sang trang filter)
                    <Button
                      type="primary"
                      size="large"
                      className="px-12 h-12 font-bold bg-[#f96302] rounded-md shadow-md"
                      onClick={() => navigate('/filter', { state: filters })}
                    >
                      Xem tất cả kết quả <RightOutlined />
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
};

export default HomePage;