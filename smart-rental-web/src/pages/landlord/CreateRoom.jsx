import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, Card, Row, Col, message, Divider } from 'antd';
import { UploadOutlined, EnvironmentOutlined, VideoCameraOutlined } from '@ant-design/icons';
import roomService from '../../services/roomService';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CreateRoom = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State quản lý upload ảnh
  const [fileList, setFileList] = useState([]);
  
  // State quản lý upload video
  const [videoLoading, setVideoLoading] = useState(false);

  // --- STATE DỮ LIỆU THẬT ---
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

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
        message.error("Không thể tải danh sách gói cước/tiện ích");
      }
    };
    fetchMasterData();
  }, []);

  // 1. Xử lý Upload ảnh (Giữ nguyên)
  const handleUploadImages = async ({ file, onSuccess, onError }) => {
    try {
      const res = await roomService.uploadImage(file);
      onSuccess(res.data.url);
    } catch (err) {
      onError(err);
      message.error("Upload ảnh lỗi");
    }
  };

  // 2. Xử lý Upload Video (MỚI THÊM)
  const handleUploadVideo = async ({ file, onSuccess, onError }) => {
    setVideoLoading(true);
    try {
      // API Backend CloudinaryConfig đã để resource_type: "auto" nên upload video vô tư
      const res = await roomService.uploadImage(file); 
      
      // Sau khi upload xong, tự động điền URL vào ô input videoUrl
      form.setFieldsValue({ videoUrl: res.data.url });
      onSuccess("ok");
      message.success("Upload video thành công!");
    } catch (err) {
      onError(err);
      message.error("Upload video thất bại, vui lòng kiểm tra dung lượng (<50MB)");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const imageUrls = fileList
        .filter(f => f.status === 'done')
        .map(f => f.response);

      if (imageUrls.length === 0) {
          message.error("Vui lòng up ít nhất 1 ảnh!");
          setLoading(false);
          return;
      }

      const payload = {
          title: values.title,
          description: values.description,
          price: values.price,
          deposit: values.deposit,
          area: values.area,
          address: values.address,
          latitude: 10.7769, 
          longitude: 106.7009,
          rentalType: values.rentalType,
          capacity: values.capacity,
          genderConstraint: values.genderConstraint,
          servicePackageId: values.servicePackageId,
          images: imageUrls,
          amenities: values.amenities,
          
          // --- THÊM TRƯỜNG VIDEO VÀO PAYLOAD ---
          videoUrl: values.videoUrl 
      };

      await roomService.createRoom(payload);
      message.success("Đăng tin thành công! Đợi Admin duyệt nhé.");
      navigate('/landlord/rooms');

    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Đăng tin thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card title="Đăng Tin Phòng Trọ Mới" className="shadow-md">
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            
            <Divider orientation="left">Thông tin cơ bản</Divider>
            <Form.Item name="title" label="Tiêu đề tin đăng" rules={[{ required: true }]}>
                <Input placeholder="VD: Phòng trọ cao cấp Q10..." size="large"/>
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="rentalType" label="Loại hình" rules={[{ required: true }]}>
                        <Select placeholder="Chọn loại hình">
                            <Option value="WHOLE">Thuê nguyên căn</Option>
                            <Option value="SHARED">Ở ghép (Ký túc xá)</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="capacity" label="Tổng sức chứa (Người)" rules={[{ required: true }]}>
                        <InputNumber min={1} className="w-full" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item name="price" label="Giá thuê (tháng)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="deposit" label="Tiền cọc" initialValue={0}>
                        <InputNumber className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="area" label="Diện tích (m2)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="genderConstraint" label="Yêu cầu giới tính" initialValue="MIXED">
                 <Select>
                     <Option value="MIXED">Nam nữ tự do</Option>
                     <Option value="MALE_ONLY">Chỉ Nam</Option>
                     <Option value="FEMALE_ONLY">Chỉ Nữ</Option>
                 </Select>
            </Form.Item>

            <Divider orientation="left">Vị trí & Tiện ích</Divider>
            <Form.Item name="address" label="Địa chỉ chi tiết" rules={[{ required: true }]}>
                <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, tên đường, phường, quận..." />
            </Form.Item>

            <Form.Item name="amenities" label="Tiện ích có sẵn">
                <Select mode="multiple" placeholder="Chọn tiện ích" loading={amenitiesList.length === 0}>
                    {amenitiesList.map(a => (
                        <Option key={a.id} value={a.name}>
                            {a.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="description" label="Mô tả chi tiết">
                <TextArea rows={4} />
            </Form.Item>

            {/* --- PHẦN VIDEO & HÌNH ẢNH (ĐÃ CẬP NHẬT) --- */}
            <Divider orientation="left">Hình ảnh & Video</Divider>

            <Form.Item 
                name="videoUrl" 
                label="Video giới thiệu phòng"
                tooltip="Bạn có thể dán link Youtube hoặc bấm nút bên phải để upload video lên hệ thống"
            >
                <Input 
                    prefix={<VideoCameraOutlined />} 
                    placeholder="Dán link video (Youtube/Drive) hoặc Upload..." 
                    addonAfter={
                        <Upload 
                            accept="video/*" 
                            showUploadList={false} 
                            customRequest={handleUploadVideo}
                        >
                            <Button 
                                type="text" 
                                icon={<UploadOutlined />} 
                                loading={videoLoading}
                            >
                                {videoLoading ? "Đang lên..." : "Tải lên"}
                            </Button>
                        </Upload>
                    }
                />
            </Form.Item>

            <Form.Item label="Hình ảnh phòng (Tối đa 5 ảnh)">
                <Upload 
                    listType="picture-card"
                    customRequest={handleUploadImages}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    maxCount={5}
                >
                    {fileList.length < 5 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                </Upload>
            </Form.Item>

            <Divider orientation="left">Thanh toán phí đăng tin</Divider>
            <Form.Item 
                name="servicePackageId" 
                label="Chọn gói dịch vụ" 
                rules={[{ required: true }]}
                help="Phí sẽ được trừ trực tiếp vào ví của bạn sau khi Admin duyệt tin."
            >
                <Select placeholder="Chọn gói..." loading={packagesList.length === 0}>
                    {packagesList.map(p => (
                        <Option key={p.id} value={p.id}>
                            <div className="flex justify-between w-full">
                                <span>{p.name} ({p.durationDays} ngày)</span>
                                <span className="text-green-600 font-bold ml-2">
                                    {p.price.toLocaleString()} đ
                                </span>
                            </div>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-4 bg-blue-600">
                ĐĂNG TIN NGAY
            </Button>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRoom;