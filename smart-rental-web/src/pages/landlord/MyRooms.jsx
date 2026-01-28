import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, Button, Tag, Space, Popconfirm, message, Typography, 
  Image, Modal, Form, Input, InputNumber, Select, Row, Col, Tabs, Upload, Divider, Tooltip, Switch 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, 
  ExclamationCircleOutlined, UploadOutlined, VideoCameraOutlined,
  HomeOutlined, CompassOutlined, ExpandOutlined, ClockCircleOutlined,
  RocketOutlined, CheckCircleOutlined, FireFilled, ThunderboltFilled,
  StopOutlined, ReloadOutlined, EyeInvisibleOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import roomService from '../../services/roomService';
import dayjs from 'dayjs'; 

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MyRooms = () => {
  // --- STATE DỮ LIỆU ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // --- STATE MODAL SỬA TIN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const [fileList, setFileList] = useState([]); 
  const [videoLoading, setVideoLoading] = useState(false);

  // --- STATE MODAL ĐẨY TIN ---
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushPackages, setPushPackages] = useState([]);
  const [selectedRoomToPush, setSelectedRoomToPush] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 1. API: Lấy dữ liệu
  const fetchMyRooms = async () => {
    setLoading(true);
    try {
      const res = await roomService.getMyRooms();
      setRooms(res.data || []);
    } catch (error) {
      message.error("Lỗi tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await roomService.getAllAmenities(); 
      setAmenitiesList(res.data || []);
    } catch (error) { console.error(error); }
  };

  // API lấy gói đẩy tin
  const fetchPushPackages = async () => {
      try {
          const res = await roomService.getAllPackages();
          const pushes = (res.data || [])
            .filter(p => p.type === 'ROOM_PROMOTION')
            .sort((a, b) => a.priorityLevel - b.priorityLevel);
          setPushPackages(pushes);
      } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    fetchMyRooms(); 
    fetchAmenities();
    fetchPushPackages();
  }, []);

  // 2. Upload Handlers
  const handleUploadImage = async ({ file, onSuccess, onError }) => {
    try {
      const res = await roomService.uploadImage(file);
      onSuccess({ url: res.data.url }); 
    } catch (err) { onError(err); message.error("Upload ảnh lỗi"); }
  };

  const handleUploadVideo = async ({ file, onSuccess, onError }) => {
    setVideoLoading(true);
    try {
      const res = await roomService.uploadImage(file);
      form.setFieldsValue({ videoUrl: res.data.url });
      onSuccess("ok");
      message.success("Upload video thành công!");
    } catch (err) { onError(err); message.error("Upload video thất bại (<50MB)"); } 
    finally { setVideoLoading(false); }
  };

  // ============================================================
  // 🟢 LOGIC MỚI: TỰ ĐỘNG GIA HẠN & ẨN/HIỆN TIN
  // ============================================================

  // Xử lý Bật/Tắt Tự động gia hạn
  const handleAutoRenewChange = async (checked, room) => {
      try {
          // Gọi API Backend: PUT /api/rooms/{id}/auto-renew?enable={true/false}
          await roomService.toggleAutoRenew(room.id, checked);
          message.success(`Đã ${checked ? 'BẬT' : 'TẮT'} tự động gia hạn cho tin: ${room.title}`);
          fetchMyRooms(); // Load lại data để cập nhật UI
      } catch (error) {
          message.error(error.response?.data?.message || "Lỗi cập nhật cấu hình");
      }
  };

  // Xử lý Ẩn Tin / Đăng Lại (Hạ tin)
  const handleStatusToggle = async (room) => {
      const isHidden = room.status === 'HIDDEN';
      const newStatus = isHidden ? 'ACTIVE' : 'HIDDEN';
      const actionText = isHidden ? 'Đăng lại tin' : 'Ẩn tin';

      // Nếu đăng lại tin đã hết hạn -> Cảnh báo
      if (isHidden && room.expirationDate && dayjs().isAfter(dayjs(room.expirationDate))) {
          Modal.confirm({
              title: 'Tin đã hết hạn!',
              content: 'Tin này đã hết hạn hiển thị. Bạn có muốn mua gói Đẩy Tin để đăng lại ngay không?',
              okText: 'Đẩy tin ngay',
              cancelText: 'Để sau',
              onOk: () => handleOpenPushModal(room)
          });
          return;
      }

      try {
          // Gọi API Backend: PUT /api/rooms/{id}/status?status={ACTIVE/HIDDEN}
          await roomService.updateRoomStatus(room.id, newStatus);
          message.success(`Thành công: ${actionText}`);
          fetchMyRooms();
      } catch (error) {
          message.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
      }
  };

  // ============================================================

  // --- LOGIC ĐẨY TIN (PUSH) ---
  const handleOpenPushModal = (room) => {
      setSelectedRoomToPush(room);
      setSelectedPackageId(null);
      setIsPushModalOpen(true);
  };

  const handlePushPayment = async () => {
      if (!selectedPackageId) {
          message.warning("Vui lòng chọn gói đẩy tin!");
          return;
      }
      const pkg = pushPackages.find(p => p.id === selectedPackageId);
      
      Modal.confirm({
          title: 'Xác nhận thanh toán',
          content: (
              <div>
                  <p>Mua gói: <b>{pkg?.name}</b></p>
                  <p>Cho tin: <b>{selectedRoomToPush?.title}</b></p>
                  <div className="flex justify-between font-bold text-[#f96302] border-t pt-2 mt-2">
                      <span>Thành tiền:</span>
                      <span>{pkg?.price?.toLocaleString()} đ</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                      * Hệ thống sẽ cộng dồn ngày nếu tin còn hạn.
                  </div>
              </div>
          ),
          okText: 'Thanh toán',
          cancelText: 'Hủy',
          okButtonProps: { className: 'bg-[#f96302] border-[#f96302]' },
          centered: true,
          onOk: async () => {
              try {
                  setPushLoading(true);
                  await roomService.pushRoom(selectedRoomToPush.id, selectedPackageId);
                  message.success("Đẩy tin thành công! Tin đã lên Top.");
                  setIsPushModalOpen(false);
                  fetchMyRooms(); 
              } catch (error) {
                  message.error(error.response?.data?.message || "Lỗi giao dịch (Kiểm tra số dư ví)");
              } finally {
                  setPushLoading(false);
              }
          }
      });
  };

  // --- LOGIC EDIT/DELETE ---
  const handleEditClick = (record) => {
    setEditingRoom(record);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && editingRoom) {
        const rawIds = editingRoom.amenities?.map(item => item.id) || [];
        const uniqueIds = [...new Set(rawIds)];
        const initialImages = (editingRoom.images || []).map((url, index) => ({
            uid: `-${index}`, name: `Ảnh ${index + 1}`, status: 'done', url: url
        }));
        setFileList(initialImages);
        form.setFieldsValue({
            ...editingRoom,
            amenities: uniqueIds,
            furnitureStatus: editingRoom.furnitureStatus,
            legalStatus: editingRoom.legalStatus,
            direction: editingRoom.direction,
            floorNumber: editingRoom.floorNumber,
            numBedrooms: editingRoom.numBedrooms,
            numBathrooms: editingRoom.numBathrooms
        });
    } else {
        form.resetFields();
        setFileList([]);
    }
  }, [isModalOpen, editingRoom, form]);

  const handleUpdateSubmit = async () => {
    try {
        const values = await form.validateFields();
        setUpdateLoading(true);
        const finalImages = fileList.map(f => (f.response && f.response.url) ? f.response.url : f.url).filter(u=>u); 
        if (finalImages.length === 0) {
            message.error("Cần ít nhất 1 hình ảnh!");
            setUpdateLoading(false);
            return;
        }
        await roomService.updateRoom(editingRoom.id, { ...values, images: finalImages });
        message.success("Cập nhật thành công!");
        setIsModalOpen(false);
        fetchMyRooms(); 
    } catch (error) {
        message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally { setUpdateLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await roomService.deleteRoom(id);
      message.success("Đã xóa phòng!");
      fetchMyRooms();
    } catch (error) { message.error("Xóa thất bại"); }
  };

  // --- RENDERS ---
  const amenityOptions = useMemo(() => amenitiesList.map(i => ({ label: i.name, value: i.id })), [amenitiesList]);

  const renderStatus = (status) => {
    switch(status) {
        case 'ACTIVE': return <Tag color="success" icon={<CheckCircleOutlined />}>Đang hiển thị</Tag>;
        case 'HIDDEN': return <Tag color="default" icon={<EyeInvisibleOutlined />}>Đang ẩn</Tag>;
        case 'PENDING': return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
        case 'REJECTED': return <Tag color="error" icon={<ExclamationCircleOutlined />}>Bị từ chối</Tag>;
        case 'EXPIRED': return <Tag color="error" icon={<StopOutlined />}>Hết hạn</Tag>;
        default: return <Tag>{status}</Tag>;
    }
  };

  const filteredData = useMemo(() => {
      if (filterStatus === 'ALL') return rooms;
      return rooms.filter(r => r.status === filterStatus);
  }, [rooms, filterStatus]);

  // === CẤU HÌNH CỘT BẢNG ===
  const columns = [
    {
      title: 'Tin đăng',
      width: 280,
      render: (_, r) => (
        <div className="flex gap-3">
            <div className="flex-shrink-0 relative w-20 h-20 group">
                <Image src={r.images?.[0]} width={80} height={80} className="object-cover rounded-md border" />
                {(r.priorityLevel > 0) && <div className="absolute top-0 left-0 bg-[#f96302] text-white text-[10px] px-1 font-bold rounded-tl-md">VIP</div>}
            </div>
            <div className="flex flex-col justify-between py-1">
                <div>
                    <Tooltip title={r.title}>
                        <div className={`font-bold line-clamp-2 cursor-pointer hover:text-[#f96302] ${r.priorityLevel > 0 ? 'text-[#f96302]' : 'text-blue-900'}`} onClick={() => navigate(`/rooms/${r.id}`)}>{r.title}</div>
                    </Tooltip>
                    <div className="text-xs text-gray-500">#{r.id} | {r.address}</div>
                </div>
                <div>{renderStatus(r.status)}</div>
            </div>
        </div>
      )
    },
    {
      title: 'Giá & Hạn',
      width: 160,
      render: (_, r) => {
        const isExpired = r.expirationDate && dayjs().isAfter(dayjs(r.expirationDate));
        return (
            <div className="text-xs">
                <div className="text-[#f96302] font-bold text-sm">{r.price?.toLocaleString()} đ</div>
                <div className="text-gray-400 mb-1">Cọc: {r.deposit?.toLocaleString()} đ</div>
                <div className="border-t pt-1 mt-1">
                    <div className={isExpired ? "text-red-500 font-bold" : "text-green-600"}>
                        HH: {r.expirationDate ? dayjs(r.expirationDate).format('DD/MM/YYYY') : '--'}
                    </div>
                </div>
            </div>
        )
      }
    },
    // 🟢 CỘT MỚI: TỰ ĐỘNG GIA HẠN
    {
        title: 'Tự động',
        width: 90,
        align: 'center',
        render: (_, r) => (
            <div className="flex flex-col items-center">
                <Switch 
                    size="small"
                    checked={r.autoRenew}
                    onChange={(checked) => handleAutoRenewChange(checked, r)}
                    disabled={r.status === 'PENDING' || r.status === 'REJECTED'}
                />
                <span className="text-[10px] text-gray-400 mt-1">{r.autoRenew ? 'Bật' : 'Tắt'}</span>
            </div>
        )
    },
    {
      title: 'Tác vụ',
      key: 'action',
      width: 130,
      fixed: 'right',
      render: (_, r) => (
        <div className="flex flex-col gap-2">
           {/* NÚT ĐẨY TIN */}
           <Button 
                size="small" 
                className="bg-orange-50 text-[#f96302] border-[#f96302] hover:bg-[#f96302] hover:text-white font-bold"
                onClick={() => handleOpenPushModal(r)}
                icon={<RocketOutlined />}
           >
               Đẩy tin
           </Button>
           
           <div className="flex gap-2 justify-center">
                {/* 🟢 NÚT ẨN / HIỆN TIN */}
                <Tooltip title={r.status === 'HIDDEN' ? "Đăng lại tin" : "Ẩn tin tạm thời"}>
                    <Button 
                        size="small"
                        icon={r.status === 'HIDDEN' ? <ReloadOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => handleStatusToggle(r)}
                        className={r.status === 'HIDDEN' ? "text-green-600 border-green-600" : "text-gray-500 border-gray-300"}
                    />
                </Tooltip>

                <Tooltip title="Sửa tin">
                    <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleEditClick(r)}/>
                </Tooltip>
                
                <Tooltip title="Xóa tin">
                    <Popconfirm title="Chắc chắn xóa?" onConfirm={() => handleDelete(r.id)} okButtonProps={{ danger: true }}>
                        <Button danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Tooltip>
           </div>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div><Title level={3} style={{ margin: 0 }}>Quản Lý Tin Đăng</Title><Text type="secondary">Danh sách phòng và trạng thái hiển thị</Text></div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/landlord/create-room')} className="bg-[#f96302]">Đăng Tin Mới</Button>
      </div>

      <Tabs defaultActiveKey="ALL" items={[
          { key: 'ALL', label: `Tất cả (${rooms.length})` },
          { key: 'ACTIVE', label: 'Đang hiển thị' },
          { key: 'HIDDEN', label: 'Đã ẩn' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'REJECTED', label: 'Bị từ chối' }
      ]} onChange={setFilterStatus} className="mb-4 custom-tabs" />

      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 1000 }} className="border rounded-lg" />

      {/* --- MODAL ĐẨY TIN --- */}
      <Modal
        title={<div className="flex items-center gap-2 text-[#f96302] text-xl"><FireFilled /> Đẩy Tin Lên Top</div>}
        open={isPushModalOpen}
        onCancel={() => setIsPushModalOpen(false)}
        footer={[<Button key="back" onClick={() => setIsPushModalOpen(false)}>Hủy</Button>, <Button key="submit" type="primary" className="bg-[#f96302]" onClick={handlePushPayment} loading={pushLoading}>Thanh Toán</Button>]}
        width={700} centered
      >
          <div className="mb-4 bg-orange-50 p-3 rounded text-gray-600">Đẩy tin cho: <b>{selectedRoomToPush?.title}</b></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
              {pushPackages.map(pkg => (
                  <div key={pkg.id} onClick={() => setSelectedPackageId(pkg.id)}
                      className={`cursor-pointer border-2 rounded-xl p-4 ${selectedPackageId === pkg.id ? 'border-[#f96302] bg-orange-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between"><h4 className="font-bold">{pkg.name}</h4>{selectedPackageId === pkg.id && <CheckCircleFilled className="text-[#f96302]"/>}</div>
                      <div className="text-xl font-bold my-1">{pkg.price?.toLocaleString()} đ</div>
                      <div className="text-sm text-gray-500">Hiệu lực: {pkg.durationDays} ngày</div>
                  </div>
              ))}
          </div>
      </Modal>

      {/* --- MODAL CẬP NHẬT --- */}
      <Modal open={isModalOpen} onOk={handleUpdateSubmit} onCancel={() => setIsModalOpen(false)} confirmLoading={updateLoading} width={900} title="Cập nhật tin" okText="Lưu" centered>
        <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1" items={[
                { key: '1', label: 'Thông tin chính', children: (
                    <>
                        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}><Input /></Form.Item>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item label="Giá" name="price"><InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫"/></Form.Item></Col>
                            <Col span={8}><Form.Item label="Diện tích" name="area"><InputNumber className="w-full" addonAfter="m²"/></Form.Item></Col>
                            <Col span={8}><Form.Item label="Loại" name="rentalType"><Select><Option value="WHOLE">Nguyên căn</Option><Option value="SHARED">Ở ghép</Option></Select></Form.Item></Col>
                        </Row>
                        <Form.Item label="Địa chỉ" name="address"><Input /></Form.Item>
                    </>
                )},
                { key: '3', label: 'Media', children: (
                    <>
                        <Form.Item label="Video URL" name="videoUrl" tooltip="Dán link hoặc upload"><Input prefix={<VideoCameraOutlined />} addonAfter={<Upload accept="video/*" showUploadList={false} customRequest={handleUploadVideo}><Button icon={<UploadOutlined />} loading={videoLoading}>Upload</Button></Upload>}/></Form.Item>
                        <Form.Item label="Hình ảnh"><Upload listType="picture-card" customRequest={handleUploadImage} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} maxCount={5}>{fileList.length < 5 && <div><UploadOutlined /><div>Thêm</div></div>}</Upload></Form.Item>
                    </>
                )}
            ]} />
        </Form>
      </Modal>
    </div>
  );
};

export default MyRooms;