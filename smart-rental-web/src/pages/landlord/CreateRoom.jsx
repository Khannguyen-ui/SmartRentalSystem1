// src/pages/landlord/CreateRoom.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, Card, Row, Col, message, Divider, Tag, Typography } from 'antd';
import { 
  UploadOutlined, EnvironmentOutlined, VideoCameraOutlined, 
  HomeOutlined, StarFilled, CrownFilled, CheckCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs'; // 🟢 Thêm dayjs để xử lý ngày tháng

// Import Services
import roomService from '../../services/roomService'; 
import useAuth from '../../hooks/useAuth'; // 🟢 Thêm useAuth để lấy thông tin hội viên
// Import Component Bản đồ
import LocationPicker from '../../components/shared/LocationPicker'; 

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const CreateRoom = () => {
  const { user } = useAuth(); // 🟢 Lấy thông tin user đăng nhập
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State quản lý upload
  const [fileList, setFileList] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // State dữ liệu danh mục
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

  // 🟢 KIỂM TRA HỘI VIÊN CÒN HẠN
  const hasActiveMembership = user?.membershipPackage && 
                               user?.membershipExpiresAt && 
                               dayjs().isBefore(dayjs(user.membershipExpiresAt));

  // Load danh sách tiện ích & gói cước
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [ameRes, pkgRes] = await Promise.all([
          roomService.getAllAmenities(),
          roomService.getAllPackages()
        ]);
        setAmenitiesList(ameRes.data || []);
        setPackagesList(pkgRes.data || []);
        
        // 🟢 Nếu là hội viên, tự động điền ID gói hội viên vào form
        if (hasActiveMembership) {
            form.setFieldsValue({ servicePackageId: user.membershipPackage.id });
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu danh mục:", error);
        setAmenitiesList([{id: 1, name: "Wifi"}, {id: 2, name: "Máy lạnh"}, {id: 3, name: "Máy giặt"}]);
        setPackagesList([
            {id: 1, name: "Gói thường", price: 0, type: "NORMAL"}, 
            {id: 2, name: "Gói VIP Đặc Biệt", price: 50000, type: "VIP"}
        ]);
      }
    };
    fetchMasterData();
  }, [hasActiveMembership, user, form]);

  const handleLocationChange = (lat, lng) => {
    form.setFieldsValue({ latitude: lat, longitude: lng });
  };

  const handleUploadImages = async ({ file, onSuccess, onError }) => {
    try {
      const res = await roomService.uploadImage(file); 
      onSuccess(res.data.url);
    } catch (err) {
      onError(err);
      message.error("Upload ảnh lỗi");
    }
  };

  const handleUploadVideo = async ({ file, onSuccess, onError }) => {
    setVideoLoading(true);
    try {
      const res = await roomService.uploadImage(file); 
      form.setFieldsValue({ videoUrl: res.data.url });
      onSuccess("ok");
      message.success("Upload video thành công!");
    } catch (err) {
      onError(err);
      message.error("Upload video thất bại (<50MB)");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const imageUrls = fileList
        .filter(f => f.status === 'done')
        .map(f => f.response || f.url); 

      if (imageUrls.length === 0) {
          message.error("Vui lòng tải lên ít nhất 1 hình ảnh!");
          setLoading(false);
          return;
      }

      if (!values.latitude || !values.longitude) {
          message.error("Vui lòng chọn vị trí trên bản đồ!");
          setLoading(false);
          return;
      }

      const payload = {
          ...values,
          images: imageUrls,
          servicePackageId: Number(values.servicePackageId)
      };

      await roomService.createRoom(payload);
      message.success("Đăng tin thành công! Tin của bạn đang chờ phê duyệt.");
      navigate('/landlord/room-list'); 
    } catch (error) {
      message.error(error.response?.data?.message || "Đăng tin thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-[#f8f9fa]">
      <Card 
        title={<span className="text-lg font-bold text-blue-700"><HomeOutlined /> ĐĂNG TIN PHÒNG TRỌ MỚI</span>} 
        className="shadow-xl rounded-xl border-t-4 border-blue-600"
      >
        <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleFinish} 
            initialValues={{ 
                rentalType: 'WHOLE', 
                genderConstraint: 'MIXED', 
                furnitureStatus: 'Nội thất đầy đủ',
                latitude: 10.7769, 
                longitude: 106.7009
            }}
        >
            <Divider orientation="left" className="text-blue-600 border-blue-200">1. Thông tin cơ bản</Divider>
            <Form.Item name="title" label="Tiêu đề tin đăng" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
                <Input placeholder="VD: Phòng trọ cao cấp gần Đại học..." size="large" className="font-semibold rounded-md"/>
            </Form.Item>

            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item name="rentalType" label="Loại hình cho thuê" rules={[{ required: true }]}>
                        <Select size="large">
                            <Option value="WHOLE">Nguyên căn</Option>
                            <Option value="SHARED">Ở ghép</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="genderConstraint" label="Yêu cầu giới tính">
                         <Select size="large">
                             <Option value="MIXED">Nam nữ tự do</Option>
                             <Option value="MALE_ONLY">Chỉ Nam</Option>
                             <Option value="FEMALE_ONLY">Chỉ Nữ</Option>
                         </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left" className="text-blue-600 border-blue-200">2. Vị trí & Tiện ích</Divider>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 shadow-sm">
                <Form.Item name="address" label="Địa chỉ hiển thị" rules={[{ required: true }]}>
                    <Input prefix={<EnvironmentOutlined className="text-red-500" />} placeholder="Số nhà, tên đường, phường, quận..." size="large" />
                </Form.Item>
                <p className="font-semibold mb-2 text-gray-700">Ghim vị trí chính xác trên bản đồ:</p>
                <LocationPicker onCoordinatesChange={handleLocationChange} />
                <Form.Item name="latitude" hidden><Input /></Form.Item>
                <Form.Item name="longitude" hidden><Input /></Form.Item>
            </div>

            <Form.Item name="amenities" label="Tiện ích có sẵn">
                <Select mode="multiple" placeholder="Chọn tiện ích (Wifi, Máy lạnh...)" allowClear size="large">
                    {amenitiesList.map(a => (
                        <Option key={a.id} value={a.name}>{a.name}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Divider orientation="left" className="text-blue-600 border-blue-200">3. Thông tin chi tiết</Divider>
            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="price" label="Giá thuê (tháng)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" size="large" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="deposit" label="Tiền cọc">
                        <InputNumber className="w-full" size="large" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="area" label="Diện tích (m2)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" size="large" min={1} />
                    </Form.Item>
                </Col>
            </Row>
            
            <Row gutter={24}>
                 <Col span={6}><Form.Item name="capacity" label="Sức chứa (người)"><InputNumber min={1} className="w-full" size="large"/></Form.Item></Col>
                 <Col span={6}><Form.Item name="numBedrooms" label="Số phòng ngủ"><InputNumber min={0} className="w-full" size="large"/></Form.Item></Col>
                 <Col span={6}><Form.Item name="numBathrooms" label="Số WC"><InputNumber min={0} className="w-full" size="large"/></Form.Item></Col>
                 <Col span={6}>
                    <Form.Item name="furnitureStatus" label="Nội thất">
                        <Select size="large">
                            <Option value="Nội thất đầy đủ">Đầy đủ</Option>
                            <Option value="Nội thất cơ bản">Cơ bản</Option>
                            <Option value="Nhà trống">Trống</Option>
                        </Select>
                    </Form.Item>
                 </Col>
            </Row>

            <Form.Item name="description" label="Mô tả chi tiết">
                <TextArea rows={5} placeholder="Chia sẻ thêm về quy định phòng, giờ giấc, lối đi riêng..." className="rounded-md" />
            </Form.Item>

            <Divider orientation="left" className="text-blue-600 border-blue-200">4. Hình ảnh & Video thực tế</Divider>
            <Form.Item label="Video giới thiệu (Tùy chọn)">
                <Input prefix={<VideoCameraOutlined className="text-red-500" />} placeholder="Tải lên video..." size="large" addonAfter={
                     <Upload accept="video/*" showUploadList={false} customRequest={handleUploadVideo}>
                        <Button type="text" icon={<UploadOutlined />} loading={videoLoading} className="text-blue-600 font-medium">
                            {videoLoading ? "Đang tải..." : "Upload Video"}
                        </Button>
                     </Upload>
                }/>
            </Form.Item>
            <Form.Item name="videoUrl" hidden><Input /></Form.Item>

            <Form.Item label="Hình ảnh thực tế (Tối đa 5 ảnh)" rules={[{ required: true, message: "Cần ít nhất 1 ảnh" }]}>
                <Upload 
                    listType="picture-card"
                    customRequest={handleUploadImages}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    maxCount={5}
                >
                    {fileList.length < 5 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Thêm ảnh</div></div>}
                </Upload>
            </Form.Item>

            {/* === 5. DỊCH VỤ ĐĂNG TIN (PHẦN CẬP NHẬT MỚI) === */}
            <Divider orientation="left" className="text-orange-600 border-orange-200">5. Dịch vụ đăng tin & Ưu tiên</Divider>
            
            {hasActiveMembership ? (
                // 🟢 HIỂN THỊ KHI ĐÃ CÓ GÓI HỘI VIÊN (VIP)
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 mb-6 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CrownFilled className="text-yellow-500 text-2xl" />
                            <span className="font-bold text-lg text-orange-700">Đặc quyền Hội viên {user.membershipPackage.name}</span>
                        </div>
                        <p className="text-gray-600 m-0 text-sm">
                            Hệ thống tự động áp dụng ưu tiên tin đăng theo gói hội viên bạn đã mua.
                            <br /> Thời hạn còn lại: <b className="text-gray-800">{dayjs(user.membershipExpiresAt).format('DD/MM/YYYY')}</b>
                        </p>
                    </div>
                    <Tag color="gold" className="px-4 py-1 font-bold border-none shadow-sm">ĐÃ KÍCH HOẠT</Tag>
                    {/* Hidden field để giữ giá trị package ID khi submit */}
                    <Form.Item name="servicePackageId" hidden><Input /></Form.Item>
                </div>
            ) : (
                // 🔴 HIỂN THỊ KHI CHƯA CÓ GÓI HỘI VIÊN
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 mb-6">
                    <Form.Item 
                        name="servicePackageId" 
                        label={<span className="font-bold text-gray-700">Chọn loại tin đăng</span>} 
                        rules={[{ required: true, message: 'Vui lòng chọn gói dịch vụ!' }]}
                    >
                        <Select placeholder="Chọn gói để tăng khả năng tiếp cận khách hàng..." size="large" className="w-full">
                            {packagesList.map(p => {
                                const isVip = p.id === 2 || p.name.toUpperCase().includes('VIP');
                                return (
                                    <Option key={p.id} value={p.id}>
                                        <div className="flex justify-between items-center w-full py-1">
                                            <div className="flex items-center gap-2">
                                                {isVip ? <CrownFilled className="text-yellow-500 text-lg" /> : <StarFilled className="text-gray-400" />}
                                                <span className={`font-bold ${isVip ? 'text-orange-600' : 'text-gray-700'}`}>{p.name}</span>
                                            </div>
                                            <span className={`font-bold ${p.price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {p.price === 0 ? "Miễn phí" : `${p.price?.toLocaleString()} đ`}
                                            </span>
                                        </div>
                                    </Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                    <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                        <Card size="small" className="min-w-[200px] border-orange-200 bg-white">
                            <div className="text-gray-400 text-xs uppercase font-bold mb-1">Gói Thường</div>
                            <div className="text-gray-600 text-[11px]"><CheckCircleOutlined className="text-green-500"/> Hiển thị sau tin VIP</div>
                        </Card>
                        <Card size="small" className="min-w-[200px] border-yellow-400 bg-yellow-50 shadow-sm">
                            <div className="text-yellow-700 text-xs uppercase font-bold mb-1">Gói VIP</div>
                            <div className="text-gray-700 text-[11px] font-medium"><StarFilled className="text-yellow-500"/> Luôn nằm ở trang đầu</div>
                        </Card>
                    </div>
                </div>
            )}

            <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block 
                loading={loading} 
                className="h-14 bg-[#f96302] hover:bg-orange-600 font-bold text-xl shadow-lg rounded-lg border-none"
            >
                XÁC NHẬN ĐĂNG TIN
            </Button>
            
            <p className="text-center text-gray-400 text-xs mt-4 italic">
                * Bằng việc nhấn đăng tin, bạn đồng ý với Điều khoản và Quy định của Smart Rental.
            </p>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRoom;