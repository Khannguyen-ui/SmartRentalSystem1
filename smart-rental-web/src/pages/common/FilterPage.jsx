import React, { useEffect, useState } from 'react';
import {
  Button, Card, Row, Col, Tag, Spin, Empty, Select,
  ConfigProvider, Avatar, Typography, Divider, Breadcrumb,
  Popover, Slider, Checkbox, InputNumber, Input, Radio, message,
  Pagination
} from 'antd';
import {
  EnvironmentOutlined, HeartOutlined, UserOutlined, FilterOutlined,
  AppstoreOutlined, UnorderedListOutlined, EnvironmentFilled, HomeFilled,
  DownOutlined, CameraFilled, CheckOutlined,
  RightOutlined, SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomService from '../../services/roomService';
import userService from '../../services/userService';
import { formatCurrency } from '../../utils/format';

// Cấu hình dayjs
dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;
const { Option } = Select;

// --- DỮ LIỆU CỐ ĐỊNH ---
const QUICK_FILTERS = [
  'Thuê Nhà Nguyên Căn Gò Vấp', 'Thuê Nhà Quận 2',
  'Thuê Nhà Nguyên Căn Bình Thạnh', 'Cho Thuê Nhà Quận 11',
  'Thuê Nhà Quận 3', 'Thuê Nhà Căn Tân Bình'
];

const PROPERTY_TYPES = [
  'Căn hộ/Chung cư', 'Nhà ở', 'Văn phòng, Mặt bằng kinh doanh', 'Đất', 'Phòng trọ'
];

// Options cho các bộ lọc
const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BATHROOM_OPTIONS = [1, 2, 3, 4, 5, 6];
const DIRECTION_OPTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam'];
const FURNITURE_OPTIONS = ['Nội thất cao cấp', 'Nội thất đầy đủ', 'Nhà trống'];

// ==============================================================================
// 1. COMPONENT MỚI: NHẬP ĐỊA ĐIỂM ĐỂ TÌM PHÒNG QUANH ĐÓ
// ==============================================================================
const NearbyAmenitiesContent = ({ onClose, onApply }) => {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(2000); // Mặc định 2km

  // Gợi ý các từ khóa địa điểm phổ biến để người dùng tìm phòng gần đó
  const quickTags = [
    { label: 'ĐH Hutech', search: 'Đại học Hutech' },
    { label: 'ĐH Bách Khoa', search: 'Đại học Bách Khoa TP HCM' },
    { label: 'BV Chợ Rẫy', search: 'Bệnh viện Chợ Rẫy' },
    { label: 'Sân bay TSN', search: 'Sân bay Tân Sơn Nhất' },
    { label: 'Landmark 81', search: 'Landmark 81' },
  ];

  // Tìm tọa độ của địa điểm (để làm tâm quét phòng trọ)
  const searchLocationAnchor = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { 
            q: query, 
            format: 'json', 
            addressdetails: 1, 
            limit: 5, 
            countrycodes: 'vn' 
        }
      });
      setSuggestions(res.data);
    } catch (error) {
      message.error("Lỗi kết nối định vị");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnchor = (place) => {
    // Khi chọn địa điểm, ta lấy tọa độ đó để lọc phòng
    const shortName = place.name || place.display_name.split(',')[0];
    onApply({
      name: shortName, // Tên hiển thị trên nút lọc
      fullText: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      radius: radius
    });
    onClose();
  };

  return (
    <div className="w-[380px] p-3 bg-white font-sans">
      <div className="text-center mb-4">
          <h4 className="font-bold text-gray-800 text-base m-0">Bạn muốn tìm phòng ở gần đâu?</h4>
          <span className="text-xs text-gray-500">Nhập trường học, công ty, bệnh viện... để xem phòng quanh đó</span>
      </div>
      
      {/* Ô nhập liệu */}
      <div className="flex gap-2 mb-3">
        <Input 
          placeholder="VD: Đại học FPT, Aeon Mall Tân Phú..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => searchLocationAnchor(keyword)}
          prefix={<EnvironmentOutlined className="text-[#f96302]"/>}
          className="rounded-md"
        />
        <Button type="primary" loading={loading} onClick={() => searchLocationAnchor(keyword)}>
            Quét phòng
        </Button>
      </div>

      {/* Gợi ý nhanh */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Gợi ý điểm đến phổ biến:</div>
        <div className="flex flex-wrap gap-2">
            {quickTags.map((tag, idx) => (
            <Tag 
                key={idx} 
                className="cursor-pointer hover:border-[#f96302] hover:text-[#f96302] transition-all px-2 py-1 bg-gray-50 border-gray-200"
                onClick={() => { 
                    setKeyword(tag.search); 
                    searchLocationAnchor(tag.search); 
                }}
            >
                {tag.label}
            </Tag>
            ))}
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Slider bán kính */}
      <div className="mb-4 px-1">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Tìm phòng trong bán kính:</span>
          <span className="font-bold text-[#f96302]">{radius < 1000 ? `${radius}m` : `${radius/1000}km`}</span>
        </div>
        <Slider 
          min={500} max={10000} step={500} 
          value={radius} onChange={setRadius}
          trackStyle={{ backgroundColor: '#f96302' }} 
          handleStyle={{ borderColor: '#f96302', backgroundColor: '#f96302', boxShadow: 'none' }}
        />
      </div>

      {/* Danh sách kết quả gợi ý địa điểm */}
      {suggestions.length > 0 && (
          <div className="border border-gray-100 rounded-md overflow-hidden">
             <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500 font-medium border-b border-gray-100">
                 Chọn địa điểm chính xác để quét phòng:
             </div>
             <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                {suggestions.map((item) => (
                <div 
                    key={item.place_id} 
                    className="p-2.5 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 flex gap-3 items-start transition-colors group"
                    onClick={() => handleSelectAnchor(item)}
                >
                    <EnvironmentFilled className="mt-1 text-gray-300 group-hover:text-[#f96302]" />
                    <div>
                    <div className="font-bold text-sm text-gray-800 line-clamp-1 group-hover:text-[#f96302]">
                        {item.name || item.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {item.display_name}
                    </div>
                    </div>
                </div>
                ))}
            </div>
          </div>
      )}
      
      {suggestions.length === 0 && !loading && keyword && (
          <div className="text-center text-gray-400 text-sm py-4 italic">
              Không tìm thấy địa điểm này. Hãy thử từ khóa khác (VD: Quận, Đường...)
          </div>
      )}
    </div>
  );
};
// ==============================================================================

// --- CÁC COMPONENT POPOVER TÌM KIẾM CŨ ---
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

const FilterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State khởi tạo từ trang trước
  const initialState = location.state || {
    keyword: '', type: 'ALL', locationName: 'Hồ Chí Minh',
    locationCoords: { lat: 10.7769, lng: 106.7009 }, radius: 20000
  };

  // State quản lý dữ liệu
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [paginatedRooms, setPaginatedRooms] = useState([]);
  const [topLandlords, setTopLandlords] = useState([]);

  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState(initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // State Popover Header
  const [openLocation, setOpenLocation] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openAmenities, setOpenAmenities] = useState(false);

  // --- STATE BỘ LỌC NÂNG CAO ---
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [selectedBedrooms, setSelectedBedrooms] = useState([]);
  const [selectedBathrooms, setSelectedBathrooms] = useState([]);
  const [areaRange, setAreaRange] = useState({ min: null, max: null });
  const [selectedDirection, setSelectedDirection] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);

  // --- GỌI API LẤY PHÒNG ---
  useEffect(() => {
    fetchRooms();
  }, [filters.locationCoords, filters.type, filters.keyword, priceRange, selectedBedrooms, selectedBathrooms, areaRange, selectedDirection, selectedFurniture]);

  // --- GỌI API LẤY CHỦ TRỌ NỔI BẬT ---
  useEffect(() => {
    const fetchTopLandlords = async () => {
        if (!filters.locationCoords) return;
        try {
            const res = await userService.getTopLandlords(
                filters.locationCoords.lat,
                filters.locationCoords.lng,
                filters.radius || 20000
            );
            setTopLandlords(res.data);
        } catch (error) {
            console.error("Lỗi lấy top chủ trọ", error);
        }
    };
    fetchTopLandlords();
  }, [filters.locationCoords]); 
  
  // Xử lý phân trang Client-side
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedRooms(rooms.slice(startIndex, endIndex));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [rooms, currentPage, pageSize]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomService.searchRooms({
        lat: filters.locationCoords.lat,
        lng: filters.locationCoords.lng,
        radius: filters.radius || 20000
      });

      let data = res.data || [];

      // Logic lọc Client-side
      if (filters.type !== 'ALL') data = data.filter(r => r.rentalType === filters.type);
      data = data.filter(r => r.price >= priceRange[0] && r.price <= priceRange[1]);
      if (areaRange.min) data = data.filter(r => r.area >= areaRange.min);
      if (areaRange.max) data = data.filter(r => r.area <= areaRange.max);
      if (selectedBedrooms.length > 0) data = data.filter(r => selectedBedrooms.includes(r.capacity));

      if (filters.keyword) {
        const k = filters.keyword.toLowerCase();
        data = data.filter(r => r.title.toLowerCase().includes(k) || r.address.toLowerCase().includes(k));
      }

      const mappedData = data.map(r => ({
        ...r,
        images: (r.images && r.images.length > 0) ? r.images : ['https://via.placeholder.com/300x200?text=No+Image'],
        time: r.approvedAt ? dayjs(r.approvedAt).fromNow() : (r.createdAt ? dayjs(r.createdAt).fromNow() : 'Vừa xong'),
        isPro: r.servicePackageId && r.servicePackageId > 1
      }));

      setRooms(mappedData);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu phòng");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (list, setList, val) => {
    const newList = [...list];
    const idx = newList.indexOf(val);
    if (idx === -1) newList.push(val); else newList.splice(idx, 1);
    setList(newList);
  };

  const handleApplyLocation = async (locData) => {
    if (!locData.fullText) return;
    message.loading({ content: `Đang tìm vị trí...`, key: 'geo' });
    try {
        const geocode = async (q) => (await axios.get(`https://nominatim.openstreetmap.org/search`, { params: { q, format: 'json', limit: 1, countrycodes: 'vn' } })).data?.[0];
        let result = await geocode(locData.fullText);
        if (!result && locData.district) result = await geocode(`${locData.district.name}, ${locData.province.name}`);
        if (!result && locData.province) result = await geocode(locData.province.name);

        if (result) {
            const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
            setFilters(prev => ({ ...prev, locationName: locData.displayName, locationCoords: newCoords, radius: 10000 }));
            message.success({ content: `Đã chuyển đến: ${locData.displayName}`, key: 'geo' });
        } else { message.warning({ content: 'Không tìm thấy tọa độ!', key: 'geo' }); }
    } catch (e) { message.error({ content: 'Lỗi bản đồ', key: 'geo' }); }
  };

  // HÀM XỬ LÝ KHI CHỌN TIỆN ÍCH (Anchor point)
  const handleApplyAmenities = (data) => {
    setFilters(prev => ({
      ...prev,
      locationName: `Gần ${data.name}`,
      locationCoords: { lat: data.lat, lng: data.lng },
      radius: data.radius
    }));
    message.success(`Đang quét phòng quanh ${data.name} (${data.radius}m)`);
  };

  // --- HÀM RESET TOÀN BỘ BỘ LỌC (MỚI) ---
  const handleResetAll = () => {
    // 1. Reset các bộ lọc nâng cao
    setPriceRange([0, 100000000]);
    setSelectedBedrooms([]);
    setSelectedBathrooms([]);
    setAreaRange({ min: null, max: null });
    setSelectedDirection([]);
    setSelectedFurniture(null);

    // 2. Reset bộ lọc chính (Vị trí, Từ khóa, Loại phòng) về mặc định (HCM)
    setFilters({
      keyword: '',
      type: 'ALL',
      locationName: 'Hồ Chí Minh',
      locationCoords: { lat: 10.7769, lng: 106.7009 },
      radius: 20000
    });

    message.success("Đã đặt lại toàn bộ bộ lọc");
  };

  // --- RENDER POPUP CONTENT ---
  const renderCheckboxFilter = (options, selected, setSelected, placeholder) => (
    <div className="w-[300px] flex flex-col bg-white">
      <div className="p-3 border-b border-gray-100">
        <Input prefix={<SearchOutlined className="text-gray-500" />} placeholder={placeholder} className="rounded-full bg-white border-gray-300"/>
      </div>
      <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
        {options.map((opt) => (
          <div key={opt} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => toggleSelection(selected, setSelected, opt)}>
            <span className="text-sm text-gray-700 font-medium">{opt}</span>
            <Checkbox checked={selected.includes(opt)} />
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-3 border-t border-gray-100 mt-1">
        <Button className="flex-1 border-gray-300 text-gray-700 font-medium h-9" onClick={() => setSelected([])}>Xóa lọc</Button>
        <Button type="primary" className="flex-1 bg-[#b0b0b0] border-none font-medium h-9 hover:bg-gray-400" onClick={fetchRooms}>Áp dụng</Button>
      </div>
    </div>
  );

  const areaContent = (
    <div className="w-[320px] p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <InputNumber className="w-full rounded-md py-1" placeholder="Min" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} onChange={(val) => setAreaRange({ ...areaRange, min: val })} value={areaRange.min}/>
        <span className="text-gray-400">-</span>
        <InputNumber className="w-full rounded-md py-1" placeholder="Max" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} onChange={(val) => setAreaRange({ ...areaRange, max: val })} value={areaRange.max}/>
      </div>
      <div className="flex gap-3">
        <Button className="flex-1 border-gray-300 text-gray-700 font-medium h-9" onClick={() => setAreaRange({ min: null, max: null })}>Xóa lọc</Button>
        <Button type="primary" className="flex-1 bg-[#b0b0b0] border-none font-medium h-9 hover:bg-gray-400" onClick={fetchRooms}>Áp dụng</Button>
      </div>
    </div>
  );

  const furnitureContent = (
    <div className="w-[300px] flex flex-col bg-white">
      <div className="p-3 border-b border-gray-100">
        <Input prefix={<SearchOutlined className="text-gray-500" />} placeholder="Tìm kiếm nội thất" className="rounded-full bg-white border-gray-300" />
      </div>
      <div className="flex flex-col">
        <Radio.Group onChange={(e) => setSelectedFurniture(e.target.value)} value={selectedFurniture}>
          {FURNITURE_OPTIONS.map((opt) => (
            <div key={opt} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer w-full">
              <span className="text-sm text-gray-700 font-medium">{opt}</span>
              <Radio value={opt} />
            </div>
          ))}
        </Radio.Group>
      </div>
      <div className="p-3 border-t border-gray-100 mt-1">
        <Button block className="border-gray-300 text-gray-700 font-medium h-9" onClick={() => setSelectedFurniture(null)}>Xóa lọc</Button>
      </div>
    </div>
  );

  const priceContent = (
    <div className="w-[300px] p-2">
      <Slider range min={0} max={100000000} step={500000} value={priceRange} onChange={setPriceRange} trackStyle={{ backgroundColor: '#f96302' }} handleStyle={{ borderColor: '#f96302', backgroundColor: '#f96302' }}/>
      <div className="flex justify-between items-center text-sm font-medium mb-4"><span>0</span><span>100 triệu</span></div>
      <div className="flex gap-2 mb-4">
        <div className="border rounded px-2 py-1 flex-1 text-center bg-gray-50 text-xs">{formatCurrency(priceRange[0])}</div>
        <div className="self-center">-</div>
        <div className="border rounded px-2 py-1 flex-1 text-center bg-gray-50 text-xs">{formatCurrency(priceRange[1])}</div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setPriceRange([0, 100000000])}>Xóa lọc</Button>
        <Button type="primary" className="flex-1 bg-[#9b9b9b] border-none font-medium h-9" onClick={fetchRooms}>Áp dụng</Button>
      </div>
    </div>
  );

  // --- RENDER DẠNG DANH SÁCH (LIST VIEW) ---
  const renderListView = () => (
    <div className="flex flex-col gap-3">
      {paginatedRooms.map(room => (
        <Card key={room.id} hoverable className="overflow-hidden border border-gray-200 shadow-none hover:shadow-md transition-all rounded-md bg-white" bodyStyle={{ padding: 0 }} onClick={() => navigate(`/rooms/${room.id}`)}>
          <div className="flex flex-col sm:flex-row h-full">
            <div className="w-full sm:w-[260px] h-[170px] relative flex-shrink-0">
              <img src={room.images?.[0] || 'https://via.placeholder.com/300'} className="h-full w-full object-cover" alt="main" />
              {room.isPro && <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-[#dfdfdf] text-gray-600 px-1.5 py-0.5 rounded flex items-center">Tin ưu tiên</div>}
              <div className="absolute bottom-1.5 right-1.5 text-white flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[10px]"><CameraFilled /> {room.images?.length || 0}</div>
            </div>
            <div className="p-3 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-gray-800 mb-1 line-clamp-2">{room.title}</h3>
                <div className="text-xs text-gray-500 mb-1 line-clamp-1">{room.description || room.address}</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-[#d0021b] font-bold text-[16px]">{formatCurrency(room.price)}/tháng</span>
                  <span className="text-gray-500 text-sm">{room.area} m²</span>
                  <span className="text-gray-500 text-sm">{room.capacity} PN</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><EnvironmentOutlined /> {room.address}</div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-100">
                <div className="flex items-center gap-2">
                  <Avatar size={20} icon={<UserOutlined />} />
                  <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">{room.landlordName || "Người đăng"}</span>
                  <span className="text-[10px] text-gray-400">• {room.time}</span>
                </div>
                <HeartOutlined className="text-gray-400 text-lg hover:text-red-500 cursor-pointer" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- RENDER DẠNG LƯỚI (GRID VIEW) ---
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginatedRooms.map(room => (
        <Card key={room.id} hoverable className="overflow-hidden border border-gray-200 shadow-none hover:shadow-md transition-all rounded-md bg-white flex flex-col h-full" bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
          cover={
            <div className="relative h-48 w-full">
              <img src={room.images?.[0] || 'https://via.placeholder.com/300'} className="h-full w-full object-cover" alt="main" />
              {room.isPro && <div className="absolute bottom-2 left-2 text-[10px] bg-[#dfdfdf] text-gray-600 px-1.5 py-0.5 rounded">Tin ưu tiên</div>}
              <div className="absolute bottom-2 right-2 text-white flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[10px]"><CameraFilled /> {room.images?.length || 0}</div>
            </div>
          }
          onClick={() => navigate(`/rooms/${room.id}`)}
        >
          <div className="flex-grow">
            <h3 className="text-[14px] font-medium text-gray-800 mb-1 line-clamp-2 h-10">{room.title}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[#d0021b] font-bold text-[15px]">{formatCurrency(room.price)}/tháng</span>
              <span className="text-gray-400 text-xs">• {room.area} m²</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mb-2 truncate"><EnvironmentOutlined /> {room.address}</div>
          </div>
          <div className="flex justify-between items-center mt-auto pt-2 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2">
              <Avatar size={20} icon={<UserOutlined />} />
              <span className="text-xs text-gray-600 truncate max-w-[80px]">{room.landlordName || "Người đăng"}</span>
            </div>
            <HeartOutlined className="text-gray-400 hover:text-red-500 cursor-pointer" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#f96302', borderRadius: 4, fontFamily: 'Arial, sans-serif' } }}>
      <div className="min-h-screen bg-[#f4f4f4] pb-10 font-sans">
        
        {/* HEADER FILTERS */}
        <div className="bg-white pt-4 pb-2 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-lg font-bold mb-3">
                 {filters.locationName.startsWith('Gần') 
                    ? <span>Phòng trọ xung quanh <span className="text-[#f96302]">{filters.locationName.replace('Gần ', '')}</span></span>
                    : `Kết quả tìm kiếm tại ${filters.locationName}`}
            </h1>
            
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <Button className="bg-gray-100 border-none font-medium flex items-center gap-1 rounded-full px-4 hover:bg-gray-200"><FilterOutlined /> Lọc</Button>
              
              <Popover placement="bottomLeft" content={<LocationSelectContent onClose={() => setOpenLocation(false)} onApply={handleApplyLocation} />} trigger="click" open={openLocation} onOpenChange={setOpenLocation} arrow={false}>
                <Button className="bg-gray-100 border-none font-medium flex items-center gap-1 rounded-full px-4 hover:bg-gray-200">
                    <EnvironmentFilled className="text-[#f96302]" /> <span className="truncate max-w-[120px]">{filters.locationName}</span> <DownOutlined className="text-[10px]"/>
                </Button>
              </Popover>

              <Popover 
                placement="bottomLeft" 
                content={<NearbyAmenitiesContent onClose={() => setOpenAmenities(false)} onApply={handleApplyAmenities} />} 
                trigger="click" 
                open={openAmenities} 
                onOpenChange={setOpenAmenities} 
                arrow={false}
              >
                <Button className="bg-blue-50 text-blue-600 border-blue-200 font-medium flex items-center gap-1 rounded-full px-4 hover:bg-blue-100">
                    <EnvironmentOutlined /> <span>Tiện ích quanh đây</span> <DownOutlined className="text-[10px]"/>
                </Button>
              </Popover>

              <Popover placement="bottomLeft" content={<TypeSelectContent currentType={filters.type} onClose={() => setOpenType(false)} onApply={(val) => { setFilters({...filters, type: val}); }} />} trigger="click" open={openType} onOpenChange={setOpenType} arrow={false}>
                <Button className="bg-gray-100 border-none font-medium flex items-center gap-1 rounded-full px-4 hover:bg-gray-200">
                    <HomeFilled className="text-[#f96302]" /> <span>Loại phòng</span> <DownOutlined className="text-[10px]"/>
                </Button>
              </Popover>

              <Popover placement="bottomLeft" content={priceContent} trigger="click"><div className="bg-gray-100 px-4 py-1.5 rounded-full text-sm text-gray-700 cursor-pointer hover:bg-gray-200 flex items-center gap-1 transition-colors">Giá thuê <DownOutlined className="text-[10px]"/></div></Popover>
              <Popover placement="bottomLeft" trigger="click" content={renderCheckboxFilter(BEDROOM_OPTIONS, selectedBedrooms, setSelectedBedrooms, "Tìm số PN")}><div className={`px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors ${selectedBedrooms.length > 0 ? 'bg-orange-50 text-[#f96302] border border-[#f96302]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{selectedBedrooms.length > 0 ? `PN: ${selectedBedrooms.join(',')}` : 'Số phòng ngủ'} <DownOutlined className="text-[10px]"/></div></Popover>
              <Popover placement="bottomLeft" trigger="click" content={renderCheckboxFilter(BATHROOM_OPTIONS, selectedBathrooms, setSelectedBathrooms, "Tìm số WC")}><div className={`px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors ${selectedBathrooms.length > 0 ? 'bg-orange-50 text-[#f96302] border border-[#f96302]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{selectedBathrooms.length > 0 ? `WC: ${selectedBathrooms.join(',')}` : 'Số phòng vệ sinh'} <DownOutlined className="text-[10px]"/></div></Popover>
              <Popover placement="bottomLeft" content={areaContent} trigger="click"><div className={`px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors ${areaRange.min || areaRange.max ? 'bg-orange-50 text-[#f96302] border border-[#f96302]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Diện tích <DownOutlined className="text-[10px]"/></div></Popover>
              <Popover placement="bottomLeft" content={furnitureContent} trigger="click"><div className={`px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors ${selectedFurniture ? 'bg-orange-50 text-[#f96302] border border-[#f96302]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{selectedFurniture ? selectedFurniture : 'Tình trạng nội thất'} <DownOutlined className="text-[10px]"/></div></Popover>
              <Popover placement="bottomLeft" trigger="click" content={renderCheckboxFilter(DIRECTION_OPTIONS, selectedDirection, setSelectedDirection, "Tìm kiếm Hướng")}><div className={`px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors ${selectedDirection.length > 0 ? 'bg-orange-50 text-[#f96302] border border-[#f96302]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{selectedDirection.length > 0 ? (selectedDirection[0] + (selectedDirection.length > 1 ? ` (+${selectedDirection.length - 1})` : '')) : 'Hướng'} <DownOutlined className="text-[10px]"/></div></Popover>
              
              <div className="flex-grow"></div>
              {/* NÚT XÓA LỌC ĐÃ CẬP NHẬT */}
              <Button type="text" danger onClick={handleResetAll}>Xoá lọc</Button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide select-none">
              {QUICK_FILTERS.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-gray-200 font-medium whitespace-nowrap">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <Row gutter={24}>
            {/* Cột Trái: Danh sách tin */}
            <Col xs={24} md={17}>
               <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
                  <div className="flex gap-6 text-sm font-bold">
                    <span className="border-b-2 border-[#f96302] text-[#f96302] pb-2 cursor-pointer">Tất cả</span>
                    <span className="text-gray-500 pb-2 cursor-pointer hover:text-black font-normal">Cá nhân</span>
                    <span className="text-gray-500 pb-2 cursor-pointer hover:text-black font-normal">Môi giới</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     Tin mới nhất <DownOutlined className="text-[10px]"/> 
                     <div className="w-[1px] h-4 bg-gray-300 mx-2"></div>
                     <div className="flex bg-gray-100 rounded p-0.5">
                        <Button type="text" size="small" icon={<UnorderedListOutlined />} className={viewMode === 'list' ? "bg-white shadow-sm text-[#f96302]" : "text-gray-400"} onClick={() => setViewMode('list')}/>
                        <Button type="text" size="small" icon={<AppstoreOutlined />} className={viewMode === 'grid' ? "bg-white shadow-sm text-[#f96302]" : "text-gray-400"} onClick={() => setViewMode('grid')}/>
                     </div>
                  </div>
               </div>

               {/* LIST DỮ LIỆU */}
               {loading ? <div className="text-center py-20"><Spin size="large"/></div> : (
                   rooms.length === 0 ? <Empty description="Không có tin đăng nào phù hợp" className="py-10 bg-white rounded"/> : 
                   (
                     <>
                        {viewMode === 'list' ? renderListView() : renderGridView()}
                        
                        {/* --- THANH PHÂN TRANG --- */}
                        <div className="flex justify-center mt-6">
                            <Pagination 
                                current={currentPage} 
                                total={rooms.length} 
                                pageSize={pageSize}
                                onChange={(page) => setCurrentPage(page)}
                                showSizeChanger={false}
                            />
                        </div>
                     </>
                   )
               )}
            </Col>

            {/* Cột Phải: Sidebar */}
            <Col xs={0} md={7}>
               <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-200">
                  <div className="flex items-center justify-center gap-2 mb-2 text-center">
                      <span className="text-yellow-400 text-xl">🌿</span>
                      <h4 className="font-bold text-gray-800 text-sm text-center">
                          Chủ trọ nổi bật tại <br/> {filters.locationName}
                      </h4>
                      <span className="text-yellow-400 text-xl">🌿</span>
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                      {topLandlords.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs py-4">
                              Chưa có dữ liệu nổi bật
                          </div>
                      ) : (
                          topLandlords.map((landlord) => (
                              <div key={landlord.id} className="flex items-center justify-between group cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <Avatar 
                                          size={40} 
                                          src={landlord.avatar || "https://joesch.moe/api/v1/random"} 
                                          className="border border-gray-200"
                                          icon={<UserOutlined />}
                                      />
                                      <div>
                                          <div className="text-sm font-semibold text-gray-800 group-hover:text-[#f96302] truncate max-w-[120px]">
                                              {landlord.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                              {landlord.postCount} tin đăng
                                          </div>
                                      </div>
                                  </div>
                                  <RightOutlined className="text-xs text-gray-300 group-hover:text-[#f96302]"/>
                              </div>
                          ))
                      )}
                  </div>
               </div>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default FilterPage;