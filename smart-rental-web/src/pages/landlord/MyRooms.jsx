import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, Button, Tag, Space, Popconfirm, message, Typography, 
  Image, Modal, Form, Input, InputNumber, Select, Row, Col 
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import roomService from '../../services/roomService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MyRooms = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]); // Danh sách tiện ích từ Admin

  // --- STATE CHO MODAL SỬA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Hook Form của Ant Design
  const [form] = Form.useForm();
  
  const navigate = useNavigate();

  // 1. API: Lấy danh sách phòng & Tiện ích
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
    } catch (error) {
      console.error("Lỗi tải amenities", error);
    }
  };

  useEffect(() => { 
    fetchMyRooms(); 
    fetchAmenities();
  }, []);

  // 2. API: Xóa phòng
  const handleDelete = async (id) => {
    try {
      await roomService.deleteRoom(id);
      message.success("Đã xóa phòng!");
      fetchMyRooms();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa thất bại");
    }
  };

  // 3. LOGIC SỬA: Chuẩn bị dữ liệu khi bấm nút Sửa
  const handleEditClick = (record) => {
    setEditingRoom(record);
    setIsModalOpen(true);
    // Lưu ý: Không setFieldsValue ở đây để tránh lỗi Form chưa render
  };

  // 4. LOGIC SỬA: Đồng bộ dữ liệu vào Form khi Modal mở
  useEffect(() => {
    if (isModalOpen && editingRoom) {
        // Xử lý tiện ích: Lấy ra mảng ID và loại bỏ trùng lặp (nếu có)
        const rawIds = editingRoom.amenities?.map(item => item.id) || [];
        const uniqueIds = [...new Set(rawIds)];

        form.setFieldsValue({
            title: editingRoom.title,
            description: editingRoom.description,
            price: editingRoom.price,
            deposit: editingRoom.deposit,
            area: editingRoom.area,
            address: editingRoom.address,
            rentalType: editingRoom.rentalType,
            capacity: editingRoom.capacity,
            genderConstraint: editingRoom.genderConstraint,
            videoUrl: editingRoom.videoUrl,
            amenities: uniqueIds 
        });
    } else {
        // Reset form khi đóng modal
        form.resetFields();
    }
  }, [isModalOpen, editingRoom, form]);

  // 5. API: Submit cập nhật
  const handleUpdateSubmit = async () => {
    try {
        const values = await form.validateFields();
        setUpdateLoading(true);
        
        await roomService.updateRoom(editingRoom.id, values);
        
        message.success("Cập nhật thành công!");
        setIsModalOpen(false);
        setEditingRoom(null);
        fetchMyRooms(); 
    } catch (error) {
        console.error(error);
        // Hiển thị lỗi từ Backend (VD: Tin đã duyệt không được sửa)
        message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
        setUpdateLoading(false);
    }
  };

  // 6. TỐI ƯU: Tạo Options cho Select Tiện ích (Tránh lỗi render key)
  const amenityOptions = useMemo(() => {
      return amenitiesList
        .filter(item => item && item.id)
        .map((item) => ({
          label: item.name,
          value: item.id,
        }));
  }, [amenitiesList]);

  // 7. CẤU HÌNH CỘT BẢNG
  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      render: (images) => {
        if (!images || images.length === 0) {
           return <Image src="https://via.placeholder.com/100" width={80} height={60} className="object-cover rounded" />;
        }
        return (
          // PreviewGroup: Cho phép xem toàn bộ album ảnh
          <Image.PreviewGroup>
            {/* Ảnh đại diện (Thumbnail) */}
            <Image 
              src={images[0]} 
              width={80} 
              height={60} 
              className="object-cover rounded" 
            />
            
            {/* Các ảnh còn lại (Ẩn đi nhưng vẫn load để PreviewGroup nhận diện) */}
            {images.slice(1).map((imgUrl, index) => (
              <Image 
                key={index}
                src={imgUrl}
                style={{ display: 'none' }} 
              />
            ))}
          </Image.PreviewGroup>
        );
      }
    },
    {
      title: 'Tên Phòng',
      dataIndex: 'title',
      render: (text, r) => (
        <div>
            <div className="font-bold text-blue-900">{text}</div>
            <div className="text-xs text-gray-500">{r.address}</div>
        </div>
      )
    },
    {
      title: 'Giá / Cọc',
      render: (_, r) => (
        <div>
            <div className="text-green-600 font-semibold">{r.price?.toLocaleString()} đ</div>
            <div className="text-xs text-gray-400">Cọc: {r.deposit?.toLocaleString()} đ</div>
        </div>
      )
    },
    {
      title: 'Loại',
      render: (_, r) => (
          <div className="text-xs">
              <Tag color="blue">{r.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}</Tag>
              <div>{r.currentTenants || 0}/{r.capacity} người</div>
          </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, r) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/rooms/${r.id}`)}>
            Xem
          </Button>
          <Button 
            type="primary" ghost icon={<EditOutlined />} size="small" 
            onClick={() => handleEditClick(r)}
          >
            Sửa
          </Button>
          <Popconfirm title="Xóa phòng này?" onConfirm={() => handleDelete(r.id)} okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <Title level={3} style={{ margin: 0 }}>Quản Lý Phòng Trọ</Title>
            <Text type="secondary">Danh sách các phòng bạn đang cho thuê</Text>
        </div>
        <Button 
            type="primary" size="large" icon={<PlusOutlined />} 
            onClick={() => navigate('/landlord/create-room')}
        >
            Đăng Tin Mới
        </Button>
      </div>

      {/* TABLE */}
      <Table 
        columns={columns} 
        dataSource={rooms} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL SỬA PHÒNG */}
      <Modal
        title="Cập nhật thông tin phòng"
        open={isModalOpen}
        onOk={handleUpdateSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={updateLoading}
        width={800}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item label="Tên phòng trọ" name="title" rules={[{ required: true, message: 'Nhập tên phòng' }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Loại hình" name="rentalType" rules={[{ required: true }]}>
                        <Select>
                            <Option value="WHOLE">Nguyên căn</Option>
                            <Option value="SHARED">Ở ghép</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item label="Giá thuê (VNĐ)" name="price" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Tiền cọc (VNĐ)" name="deposit">
                         <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')}/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                     <Form.Item label="Diện tích (m2)" name="area" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                 <Col span={12}>
                    <Form.Item label="Sức chứa (Người)" name="capacity" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                 </Col>
                 <Col span={12}>
                    <Form.Item label="Giới tính cho phép" name="genderConstraint">
                        <Select allowClear>
                            <Option value="MALE_ONLY">Chỉ nam</Option>
                            <Option value="FEMALE_ONLY">Chỉ nữ</Option>
                            <Option value="ANY">Nam/Nữ đều được</Option>
                        </Select>
                    </Form.Item>
                 </Col>
            </Row>

            <Form.Item label="Địa chỉ chi tiết" name="address" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item label="Mô tả chi tiết" name="description">
                <TextArea rows={4} />
            </Form.Item>

            <Form.Item label="Link Video (Youtube/Cloudinary)" name="videoUrl">
                <Input prefix={<EyeOutlined />} />
            </Form.Item>

            {/* Select Tiện Ích: Dùng options prop để tối ưu */}
            <Form.Item label="Tiện ích (Chọn từ danh sách)" name="amenities">
                 <Select 
                    mode="multiple" 
                    placeholder="Chọn các tiện ích có sẵn" 
                    style={{ width: '100%' }}
                    optionFilterProp="label" 
                    options={amenityOptions} 
                    allowClear
                 />
            </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default MyRooms;