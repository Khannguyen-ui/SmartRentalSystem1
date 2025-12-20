import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, Checkbox, message, Row, Col, Card } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import roomService from '../../services/roomService';
import uploadService from '../../services/uploadService';

const { Option } = Select;

const CreateRoom = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load dữ liệu Gói cước và Tiện ích từ Admin Controller [cite: 216, 219]
    const loadData = async () => {
      try {
        const [pkgRes, ameRes] = await Promise.all([
          adminService.getAllPackages(),
          adminService.getAllAmenities()
        ]);
        setPackages(pkgRes.data || []);
        setAmenities(ameRes.data || []);
      } catch (error) {
        console.error("Lỗi load master data", error);
      }
    };
    loadData();
  }, []);

  const onFinish = async (values) => {
    setUploading(true);
    try {
      // Bước 1: Upload từng ảnh lên Cloudinary qua API Backend 
      const imageUrls = [];
      if (fileList.length > 0) {
        for (let file of fileList) {
           const url = await uploadService.uploadImage(file.originFileObj);
           imageUrls.push(url);
        }
      }

      // Bước 2: Chuẩn bị JSON theo RoomCreateDTO [cite: 343]
      const roomData = {
        title: values.title,
        description: values.description,
        price: values.price,
        deposit: values.deposit || 0,
        area: values.area,
        address: values.address,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
        rentalType: values.rentalType, // [cite: 349] WHOLE hoặc SHARED
        capacity: values.capacity,
        genderConstraint: values.genderConstraint, // MALE_ONLY, FEMALE_ONLY...
        servicePackageId: values.servicePackageId, // [cite: 352]
        images: imageUrls, // List<String> [cite: 353]
        amenities: values.amenities // List<String> ID hoặc Tên tùy backend xử lý
      };

      // Bước 3: Gửi JSON tạo phòng [cite: 293]
      await roomService.createRoom(roomData);
      
      message.success("Đăng tin thành công! Vui lòng chờ Admin duyệt.");
      navigate("/landlord/rooms"); // Chuyển hướng về trang danh sách

    } catch (error) {
      console.error(error);
      message.error("Đăng tin thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">ĐĂNG TIN MỚI</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Thông tin cơ bản" className="shadow-sm mb-4">
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                <Input placeholder="VD: Phòng trọ cao cấp gần ĐH Bách Khoa" />
              </Form.Item>
              <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="price" label="Giá thuê (VNĐ)" rules={[{ required: true }]}>
                    <InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="deposit" label="Tiền cọc (VNĐ)">
                     <InputNumber className="w-full" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                 <Col span={8}>
                    <Form.Item name="area" label="Diện tích (m2)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" />
                    </Form.Item>
                 </Col>
                 <Col span={8}>
                    <Form.Item name="rentalType" label="Loại hình" rules={[{ required: true }]}>
                        <Select>
                            <Option value="WHOLE">Nguyên căn</Option>
                            <Option value="SHARED">Ở ghép</Option>
                        </Select>
                    </Form.Item>
                 </Col>
                 <Col span={8}>
                    <Form.Item name="capacity" label="Số người tối đa" rules={[{ required: true }]}>
                        <InputNumber className="w-full" />
                    </Form.Item>
                 </Col>
              </Row>
              
              <Form.Item name="genderConstraint" label="Yêu cầu giới tính">
                 <Select>
                     <Option value="MIXED">Nam/Nữ đều được</Option>
                     <Option value="MALE_ONLY">Chỉ Nam</Option>
                     <Option value="FEMALE_ONLY">Chỉ Nữ</Option>
                 </Select>
              </Form.Item>
            </Card>

            <Card title="Tiện ích" className="shadow-sm">
               <Form.Item name="amenities">
                  <Checkbox.Group>
                      <Row>
                          {amenities.map(am => (
                              <Col span={8} key={am.id}>
                                  <Checkbox value={am.name}>{am.name}</Checkbox>
                              </Col>
                          ))}
                      </Row>
                  </Checkbox.Group>
               </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Gói dịch vụ & Ảnh" className="shadow-sm sticky top-4">
               <Form.Item name="servicePackageId" label="Chọn gói đăng tin" rules={[{ required: true }]}>
                   <Select placeholder="Chọn gói...">
                       {packages.map(pkg => (
                           <Option key={pkg.id} value={pkg.id}>
                               {pkg.name} - {pkg.price.toLocaleString()}đ ({pkg.durationDays} ngày)
                           </Option>
                       ))}
                   </Select>
               </Form.Item>

               <Form.Item label="Hình ảnh (Tối đa 5)">
                  <Upload 
                    listType="picture-card"
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    beforeUpload={() => false} // Chặn upload tự động
                    maxCount={5}
                  >
                     {fileList.length < 5 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                  </Upload>
               </Form.Item>
               
               <div className="bg-gray-50 p-3 rounded mb-4">
                   <p className="font-bold text-xs mb-2">VỊ TRÍ (Tọa độ)</p>
                   <Form.Item name="address" rules={[{ required: true }]}><Input placeholder="Địa chỉ hiển thị" /></Form.Item>
                   <Row gutter={8}>
                       <Col span={12}><Form.Item name="latitude" rules={[{ required: true }]}><Input placeholder="Lat (Vĩ độ)" /></Form.Item></Col>
                       <Col span={12}><Form.Item name="longitude" rules={[{ required: true }]}><Input placeholder="Lng (Kinh độ)" /></Form.Item></Col>
                   </Row>
                   <p className="text-xs text-gray-400 italic">Mẹo: Lấy từ Google Maps</p>
               </div>

               <Button type="primary" htmlType="submit" block size="large" loading={uploading}>
                  ĐĂNG TIN NGAY
               </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateRoom;