import React, { useEffect, useState, useRef } from 'react';
import {
  Input, Button, Card, Row, Col, Tag, Spin, Empty, Select, message,
  ConfigProvider, Popover, Tabs, Typography, Skeleton
} from 'antd';
import {
  SearchOutlined, EnvironmentFilled, HomeFilled, CheckOutlined,
  AimOutlined, DownOutlined, HeartOutlined, PictureOutlined, RightOutlined,
  HistoryOutlined,
  CloseOutlined, CrownFilled, FireFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomService from '../../services/roomService';
import { formatCurrency } from '../../utils/format';
import searchHistoryService from '../../services/searchHistoryService';

const { Option } = Select;
const { Title } = Typography;

// --- CẤU HÌNH DANH SÁCH TỈNH THÀNH ---

// --- CẤU HÌNH DANH SÁCH TỈNH THÀNH (FIXED LINKS) ---
const LOCATION_CONFIG = [
  { id: 1, name: 'Tp Hồ Chí Minh', lat: 10.7769, lng: 106.7009, img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80', colSpan: 2, rowSpan: 2 },
  { id: 2, name: 'Hà Nội', lat: 21.0285, lng: 105.8542, img: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1000&q=80', colSpan: 1, rowSpan: 1 },
  { id: 3, name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80', colSpan: 1, rowSpan: 1 },
  { id: 4, name: 'Bình Dương', lat: 10.9804, lng: 106.6519, img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1000&q=80', colSpan: 1, rowSpan: 1 },
];



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
  //Reaload Post
  // Hàm này giúp tải lại tin ngay lập tức với dữ liệu lọc mới nhất
  const fetchRoomsWithParams = async (newParams) => {
    setLoading(true);
    setPage(0);
    setRooms([]);

    try {
      const res = await roomService.searchRooms({
        lat: newParams.locationCoords.lat,
        lng: newParams.locationCoords.lng,
        radius: newParams.radius || 15000,
        keyword: newParams.keyword || '',
        type: newParams.type || 'ALL',
        page: 0,
        size: 8
      });

      setRooms(res.data.content || []);
      setHasMore(res.data.content?.length === 8);
    } catch (error) {
      console.error("Lỗi tải tin:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

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
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Bán kính trái đất (mét)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- API 1: TÌM KIẾM CHÍNH (CẬP NHẬT NGẮT Ở 12 TIN) ---

  const fetchRooms = async (isLoadMore = false, overrideFilters = null) => {
    setLoading(true);
    if (!isLoadMore) { setRooms([]); setPage(0); }

    const nextPage = isLoadMore ? page + 1 : 0;
    const currentParams = overrideFilters || filters;

    try {
      const res = await roomService.searchRooms({
        lat: currentParams.locationCoords.lat,
        lng: currentParams.locationCoords.lng,
        radius: currentParams.radius || 20000,
        type: currentParams.type,
        keyword: currentParams.keyword,
        page: nextPage,
        size: 8
      });

      const newData = res.data.content || [];

      // 🟢 BỔ SUNG LOGIC SẮP XẾP CLIENT-SIDE (Đồng bộ với Tin Mới)
      const sortedData = [...newData].sort((a, b) => {
        const priorityA = a.priorityLevel || 0;
        const priorityB = b.priorityLevel || 0;

        // Ưu tiên 1: VIP (Priority Level)
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        // Ưu tiên 2: Tin mới đẩy/mới tạo
        const dateA = new Date(a.lastPushedAt || a.createdAt);
        const dateB = new Date(b.lastPushedAt || b.createdAt);
        return dateB - dateA;
      });

      setRooms(prev => isLoadMore ? [...prev, ...sortedData] : sortedData);
      setPage(nextPage);
      setHasMore(newData.length === 8);
    } catch (error) {
      console.error("Lỗi fetchRooms:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };
  // Tự động load lại tin khi có bất kỳ thay đổi nào từ bộ lọc chính
  useEffect(() => {
    if (!isInitialLoad) {
      fetchRooms();
      fetchNewListings();
    }
  }, [filters.locationCoords, filters.type]);
  // --- 🟢 SỬA LẠI: TIN MỚI ĐĂNG (Dùng tọa độ thực tế) ---
  // --- 🟢 API 2: TIN MỚI ĐĂNG (ƯU TIÊN VIP + MỚI NHẤT) ---
  const fetchNewListings = async (overrideFilters = null) => {
    setLoadingNew(true);
    const currentParams = overrideFilters || filters;

    try {
      // 1. Lấy số lượng lớn (size=20) để đảm bảo lấy đủ các tin VIP và tin mới
      const res = await roomService.searchRooms({
        lat: currentParams.locationCoords.lat,
        lng: currentParams.locationCoords.lng,
        radius: 20000,
        size: 20
      });

      const allRooms = res.data.content || [];

      // 2. 🟢 LOGIC SẮP XẾP MỚI: VIP TRƯỚC -> NGÀY MỚI SAU
      const sortedList = allRooms.sort((a, b) => {
        // Lấy độ ưu tiên, nếu null/undefined thì coi là 0 (Tin thường)
        const priorityA = a.priorityLevel || 0;
        const priorityB = b.priorityLevel || 0;

        // Bước 1: So sánh độ ưu tiên
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Priority lớn hơn (VIP cao hơn) xếp trước
        }

        // Bước 2: Nếu cùng độ ưu tiên (cùng là VIP hoặc cùng là thường) -> So sánh ngày tạo
        return new Date(b.createdAt) - new Date(a.createdAt); // Ngày mới hơn xếp trước
      });

      // 3. Cắt lấy 10 tin đầu tiên sau khi sắp xếp
      setNewListings(sortedList.slice(0, 10));

    } catch (error) {
      console.error("Lỗi fetch tin mới:", error);
    } finally {
      setLoadingNew(false);
    }
  };


  // --- API 3: ĐẾM SỐ LƯỢNG (SỬA LỖI ĐẾM SAI) ---
  const fetchLocationCounts = async (typeFilter) => {
    try {
      // 1. Lấy danh sách tin (Giữ nguyên tọa độ mồi để tránh lỗi 400 Backend)
      const res = await roomService.searchRooms({
        size: 1000,
        lat: 10.7769, lng: 106.7009, radius: 5000000
      });

      let allRooms = res.data.content || [];

      // 2. LỌC THEO LOẠI HÌNH TRƯỚC (Nếu không phải 'ALL')
      if (typeFilter && typeFilter !== 'ALL') {
        allRooms = allRooms.filter(room => room.rentalType === typeFilter);
      }

      // 3. Sau đó mới đếm theo từng khu vực
      const updatedStats = LOCATION_CONFIG.map(loc => {
        const countInArea = allRooms.filter(room => {
          const rLat = room.latitude || room.lat;
          const rLng = room.longitude || room.lng;
          if (!rLat || !rLng) return false;

          const distance = getDistance(loc.lat, loc.lng, rLat, rLng);
          return distance <= 15000;
        }).length;

        return { ...loc, count: countInArea };
      });

      setLocationStats(updatedStats);
    } catch (error) {
      console.error("Lỗi cập nhật số lượng tin theo Tab:", error);
    }
  };
  const handleTabChange = (key) => {
    let type = 'ALL';
    if (key === '2') type = 'WHOLE';
    if (key === '3') type = 'SHARED';

    setActiveTabType(type);

    // 1. Tạo object filter mới để truyền trực tiếp
    const updatedFilters = { ...filters, type: type };

    // 2. Cập nhật state (để hiển thị UI)
    setFilters(updatedFilters);

    // 3. 🟢 GỌI LẠI CÁC HÀM CẬP NHẬT DỮ LIỆU
    fetchRooms(false, updatedFilters); // Load lại danh sách Tin dành cho bạn
    fetchNewListings(updatedFilters);  // Load lại danh sách Tin mới
    fetchLocationCounts(type);         // Đếm lại số lượng trên ảnh thành phố
  };
  const handleApplyLocation = async (locData) => {
    if (!locData.fullText) return;
    const hide = message.loading(`Đang cập nhật tin tại ${locData.displayName}...`, 0);
    try {
      const geocode = async (q) => (await axios.get(`https://nominatim.openstreetmap.org/search`, { params: { q, format: 'json', limit: 1, countrycodes: 'vn' } })).data?.[0];
      let result = await geocode(locData.fullText);

      if (result) {
        const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        const newFilters = {
          ...filters,
          locationName: locData.displayName,
          locationCoords: newCoords,
          radius: 20000
        };

        setFilters(newFilters); // Cập nhật tên hiển thị trên thanh Search

        // 🟢 RA LỆNH CẬP NHẬT TẤT CẢ DANH SÁCH TIN
        fetchRooms(false, newFilters);
        fetchNewListings(newFilters);
        fetchLocationCounts(newFilters.type);

        hide();
        message.success(`Đã hiển thị tin tại: ${locData.displayName}`);
      }
    } catch (e) { hide(); message.error('Lỗi kết nối bản đồ'); }
  };
  const fetchRoomsByParams = async (params) => {
    setLoading(true);
    setPage(0); // Reset về trang đầu tiên
    try {
      const res = await roomService.searchRooms({
        lat: params.locationCoords.lat,
        lng: params.locationCoords.lng,
        radius: params.radius || 15000,
        type: params.type || 'ALL',
        keyword: params.keyword || '',
        page: 0,
        size: 8
      });

      // Cập nhật danh sách "Tin dành cho bạn"
      setRooms(res.data.content || []);
      setHasMore(res.data.content?.length === 8);
    } catch (error) {
      console.error("Lỗi tải lại tin:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
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



              <Popover
                content={
                  <TypeSelectContent
                    currentType={filters.type}
                    onClose={() => setOpenType(false)}
                    onApply={(val) => {
                      const newFilters = { ...filters, type: val };
                      setFilters(newFilters);
                      fetchRooms(false, newFilters); // 🟢 Gọi fetch ngay với loại phòng mới
                      fetchLocationCounts(val);
                    }}
                  />
                }
                trigger="click"
                open={openType}
                onOpenChange={setOpenType}
                placement="bottom"
                arrow={false}
              >

              </Popover>

              <Button
                type="primary"
                size="large"
                className="px-8 font-bold h-10 bg-[#f96302] text-white border-none hover:bg-[#d85502] transition-all"
                onClick={handleSearchNavigate}
              >
                TÌM NGAY
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6 space-y-8">

          {/* SECTION 1: TIN MỚI */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <Title level={4} style={{ margin: 0 }}>Tin cho thuê mới đăng</Title>
              <Button type="link" className="text-gray-500 hover:text-[#f96302]">
                Xem tất cả <RightOutlined />
              </Button>
            </div>

            {loadingNew ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map(i => <Skeleton.Image key={i} active style={{ width: 220, height: 160 }} />)}
              </div>
            ) : newListings.length === 0 ? (
              <Empty description="Chưa có tin đăng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {newListings.map((item) => {
                  // Kiểm tra xem tin có phải là VIP hay không
                  const isVip = item.priorityLevel && item.priorityLevel > 0;

                  return (
                    <div
                      key={item.id}
                      className="min-w-[220px] max-w-[220px] group cursor-pointer"
                      onClick={() => navigate(`/rooms/${item.id}`)}
                    >
                      <div className="relative h-[160px] rounded-lg overflow-hidden mb-2">
                        <img
                          src={item.images?.[0] || 'https://via.placeholder.com/200'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt="room"
                        />


                        {isVip && (
                          <Tag color="#fadb14" className="absolute top-2 left-2 border-none font-bold text-[10px] m-0 flex items-center gap-1 shadow-sm text-black px-1.5 py-0.5 z-10">
                            <CrownFilled /> VIP
                          </Tag>
                        )}

                        {/* --- 2. NHÃN TRẠNG THÁI MẶC ĐỊNH --- */}
                        <div className="absolute bottom-2 right-2 text-[10px] text-white font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded">
                          Mới đăng
                        </div>
                      </div>

                      {/* --- 3. TIÊU ĐỀ: Tự động đổi màu và in đậm nếu là tin VIP --- */}
                      <h3 className={`font-medium text-sm line-clamp-2 mb-1 transition-colors ${isVip ? 'text-[#f96302] font-bold' : 'text-gray-800 group-hover:text-[#f96302]'}`}>
                        {item.title}
                      </h3>

                      <div className="text-red-600 font-bold text-base mb-1">
                        {formatCurrency(item.price)}/tháng
                      </div>

                      <div className="text-xs text-gray-400 flex items-center truncate">
                        <EnvironmentFilled className="mr-1 text-gray-300" /> {item.address}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* SECTION 2: KHU VỰC NỔI BẬT */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>Khu vực cho thuê nổi bật</Title>
              </div>
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
                  onClick={() => {
                    navigate('/filter', {
                      state: {
                        locationName: loc.name,
                        locationCoords: { lat: loc.lat, lng: loc.lng },
                        radius: 15000,
                        type: activeTabType,
                        keyword: ''
                      }
                    });
                  }}
                >
                  <img src={loc.img} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  {/* VỊ TRÍ CODE BẠN GỬI ĐẶT TẠI ĐÂY */}
                  <div className="absolute bottom-4 left-4 text-white z-10">
                    <h3 className="text-lg md:text-xl font-bold mb-0 text-white drop-shadow-md">
                      {loc.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {/* Chấm xanh khi có tin (>0), chấm xám khi không có (0) */}
                      <span className={`w-2 h-2 rounded-full ${loc.count > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                      <span className="text-xs md:text-sm font-medium opacity-90">
                        {(loc.count || 0).toLocaleString()} tin đăng
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* SECTION 3: DANH SÁCH CHÍNH */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Tin dành cho bạn</Title>

            </div>

            {loading && isInitialLoad ? (
              <div className="text-center py-20"><Spin size="large" /></div>
            ) : rooms.length === 0 ? (
              <Empty description="Không tìm thấy tin đăng nào" className="py-10" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  {rooms.map(room => {
                    // 🟢 1. LOGIC MỚI: Xác định VIP
                    const isVip = room.priorityLevel && room.priorityLevel > 0;

                    return (
                      <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                        <Card
                          hoverable
                          // 🟢 2. STYLE CARD: Nếu VIP thì viền cam, đổ bóng đậm hơn
                          className={`rounded-lg overflow-hidden transition-all h-full flex flex-col ${isVip ? 'border-2 border-orange-200 shadow-md' : 'border border-gray-200 shadow-none hover:shadow-lg'}`}
                          bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
                          cover={
                            <div className="relative h-48 overflow-hidden">
                              <img alt={room.title} src={room.images?.[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />

                              {/* Tag Loại hình (giữ nguyên) */}
                              <Tag color="#f96302" className="absolute top-2 left-2 border-none font-semibold text-xs">{room.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}</Tag>

                              {isVip && (
                                <Tag color="#fadb14" className="absolute top-2 right-2 border-none font-bold text-[10px] m-0 flex items-center gap-1 shadow-sm text-black px-1.5 py-0.5 z-10">
                                  <CrownFilled /> VIP
                                </Tag>
                              )}

                              {/* 🟢 4. ICON LỬA (Cho tin cực hot - Priority cao) */}
                              {room.priorityLevel >= 50 && (
                                <div className="absolute bottom-2 left-2 text-[#fadb14] animate-bounce drop-shadow-md">
                                  <FireFilled style={{ fontSize: '18px' }} />
                                </div>
                              )}
                            </div>
                          }
                          onClick={() => navigate(`/rooms/${room.id}`)}
                        >
                          {/* 🟢 5. TIÊU ĐỀ VIP: Có icon Vương miện đầu dòng */}
                          <h3 className={`font-bold text-sm mb-1 line-clamp-2 h-10 flex items-start gap-1 ${isVip ? 'text-[#f96302]' : 'text-gray-800'}`} title={room.title}>
                            {isVip && <CrownFilled className="mt-1 flex-shrink-0" />} {room.title}
                          </h3>

                          <div className="text-xs text-gray-500 mb-2 truncate"><EnvironmentFilled className="mr-1 text-gray-400" />{room.address}</div>
                          <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex justify-between items-end">
                            <span className="text-[#f96302] font-bold text-base">{formatCurrency(room.price)}/tháng</span>
                            <span className="text-xs text-gray-400">{room.area} m²</span>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
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