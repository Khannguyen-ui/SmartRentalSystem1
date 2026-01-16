// src/pages/landlord/CreateRoom.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, Card, Row, Col, message, Divider } from 'antd';
import { UploadOutlined, EnvironmentOutlined, VideoCameraOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import Services (giả định bạn đã có file này trong thư mục services)
import roomService from '../../services/roomService'; 

// Import Component Bản đồ vừa tạo
import LocationPicker from '../../components/shared/LocationPicker'; 

const { Option } = Select;
const { TextArea } = Input;

const CreateRoom = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State quản lý upload
  const [fileList, setFileList] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // State dữ liệu danh mục
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

  // Load danh sách tiện ích & gói cước khi vào trang
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [ameRes, pkgRes] = await Promise.all([
          roomService.getAllAmenities(),
          roomService.getAllPackages()
        ]);
        setAmenitiesList(ameRes.data || []);
        setPackagesList(pkgRes.data || []);
      } catch (error) {
        // Nếu chưa có API thì dùng dữ liệu giả để không bị crash
        setAmenitiesList([{id: 1, name: "Wifi"}, {id: 2, name: "Máy lạnh"}, {id: 3, name: "Máy giặt"}]);
        setPackagesList([{id: 1, name: "Gói cơ bản", price: 20000}, {id: 2, name: "Gói VIP", price: 50000}]);
      }
    };
    fetchMasterData();
  }, []);

  // Hàm cập nhật tọa độ từ bản đồ vào Form
  const handleLocationChange = (lat, lng) => {
    form.setFieldsValue({
        latitude: lat,
        longitude: lng
    });
  };

  // Upload ảnh
  const handleUploadImages = async ({ file, onSuccess, onError }) => {
    try {
      const res = await roomService.uploadImage(file); // API upload file
      onSuccess(res.data.url);
    } catch (err) {
      onError(err);
      message.error("Upload ảnh lỗi");
    }
  };

  // Upload video
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

  // Xử lý Submit Form
  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const imageUrls = fileList
        .filter(f => f.status === 'done')
        .map(f => f.response); // Lấy URL từ response upload

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

      // Chuẩn bị payload đúng chuẩn Backend RoomCreateDTO
      const payload = {
          title: values.title,
          description: values.description,
          price: values.price,
          deposit: values.deposit,
          area: values.area,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          rentalType: values.rentalType,
          capacity: values.capacity,
          genderConstraint: values.genderConstraint,
          servicePackageId: values.servicePackageId,
          images: imageUrls,
          amenities: values.amenities,
          videoUrl: values.videoUrl,
          
          // Các trường bổ sung (Backend cần update DTO để nhận các trường này nếu chưa có)
          furnitureStatus: values.furnitureStatus,
          legalStatus: values.legalStatus,
          direction: values.direction,
          numBedrooms: values.numBedrooms,
          numBathrooms: values.numBathrooms,
          floorNumber: values.floorNumber
      };

      await roomService.createRoom(payload);
      message.success("Đăng tin thành công! Đang chờ Admin duyệt.");
      navigate('/landlord/room-list'); // Chuyển hướng về trang quản lý

    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Đăng tin thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card title={<><HomeOutlined /> Đăng Tin Phòng Trọ Mới</>} className="shadow-lg rounded-lg border-t-4 border-blue-600">
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
            
            {/* === 1. THÔNG TIN CƠ BẢN === */}
            <Divider orientation="left" className="text-blue-600 border-blue-600">Thông tin cơ bản</Divider>
            <Form.Item name="title" label="Tiêu đề tin đăng" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
                <Input placeholder="VD: Phòng trọ cao cấp gần Đại học..." size="large" className="font-semibold"/>
            </Form.Item>

            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item name="rentalType" label="Loại hình cho thuê" rules={[{ required: true }]}>
                        <Select>
                            <Option value="WHOLE">Nguyên căn</Option>
                            <Option value="SHARED">Ở ghép</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="genderConstraint" label="Yêu cầu giới tính">
                         <Select>
                             <Option value="MIXED">Nam nữ tự do</Option>
                             <Option value="MALE_ONLY">Chỉ Nam</Option>
                             <Option value="FEMALE_ONLY">Chỉ Nữ</Option>
                         </Select>
                    </Form.Item>
                </Col>
            </Row>

            {/* === 2. VỊ TRÍ & BẢN ĐỒ === */}
            <Divider orientation="left" className="text-blue-600 border-blue-600">Vị trí & Tiện ích</Divider>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <Form.Item name="address" label="Địa chỉ hiển thị (Text)" rules={[{ required: true }]}>
                    <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, tên đường, phường, quận..." />
                </Form.Item>

                <p className="font-semibold mb-2 text-gray-700">Ghim vị trí chính xác trên bản đồ:</p>
                {/* COMPONENT BẢN ĐỒ */}
                <LocationPicker onCoordinatesChange={handleLocationChange} />

                {/* Input ẩn để giữ giá trị gửi đi */}
                <Form.Item name="latitude" hidden><Input /></Form.Item>
                <Form.Item name="longitude" hidden><Input /></Form.Item>
            </div>

            <Form.Item name="amenities" label="Tiện ích có sẵn">
                <Select mode="multiple" placeholder="Chọn tiện ích" allowClear>
                    {amenitiesList.map(a => (
                        <Option key={a.id} value={a.name}>{a.name}</Option>
                    ))}
                </Select>
            </Form.Item>

            {/* === 3. DIỆN TÍCH & GIÁ CẢ === */}
            <Divider orientation="left" className="text-blue-600 border-blue-600">Diện tích & Giá cả</Divider>
            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="price" label="Giá thuê (tháng)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="deposit" label="Tiền cọc">
                        <InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="area" label="Diện tích (m2)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" />
                    </Form.Item>
                </Col>
            </Row>
            
            <Row gutter={24}>
                 <Col span={6}><Form.Item name="capacity" label="Sức chứa (người)"><InputNumber min={1} className="w-full"/></Form.Item></Col>
                 <Col span={6}><Form.Item name="numBedrooms" label="Số phòng ngủ"><InputNumber min={0} className="w-full"/></Form.Item></Col>
                 <Col span={6}><Form.Item name="numBathrooms" label="Số WC"><InputNumber min={0} className="w-full"/></Form.Item></Col>
                 <Col span={6}><Form.Item name="furnitureStatus" label="Nội thất"><Select><Option value="Nội thất đầy đủ">Full</Option><Option value="Nội thất cơ bản">Cơ bản</Option><Option value="Nhà trống">Trống</Option></Select></Form.Item></Col>
            </Row>

            <Form.Item name="description" label="Mô tả chi tiết">
                <TextArea rows={6} placeholder="Mô tả chi tiết về phòng..." />
            </Form.Item>

            {/* === 4. HÌNH ẢNH & VIDEO === */}
            <Divider orientation="left" className="text-blue-600 border-blue-600">Hình ảnh & Video</Divider>
            <Form.Item label="Video giới thiệu">
                <Input prefix={<VideoCameraOutlined />} placeholder="Link video..." addonAfter={
                     <Upload accept="video/*" showUploadList={false} customRequest={handleUploadVideo}>
                        <Button type="text" icon={<UploadOutlined />} loading={videoLoading}>{videoLoading ? "Đang tải..." : "Upload Video"}</Button>
                     </Upload>
                }/>
            </Form.Item>
             <Form.Item name="videoUrl" hidden><Input /></Form.Item>

            <Form.Item label="Hình ảnh thực tế (Tối đa 5 ảnh)">
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

            {/* === 5. THANH TOÁN === */}
            <Divider orientation="left" className="text-blue-600 border-blue-600">Dịch vụ đăng tin</Divider>
            <Form.Item name="servicePackageId" label="Chọn gói dịch vụ" rules={[{ required: true }]}>
                <Select placeholder="Chọn gói..." size="large">
                    {packagesList.map(p => (
                        <Option key={p.id} value={p.id}>
                            <div className="flex justify-between w-full">
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-green-600 font-bold ml-2">{p.price?.toLocaleString()} đ</span>
                            </div>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-6 bg-blue-600 font-bold h-12 text-lg">
                ĐĂNG TIN NGAY
            </Button>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRoom;