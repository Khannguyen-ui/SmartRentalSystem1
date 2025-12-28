import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, Button, Tag, Space, Popconfirm, message, Typography, 
  Image, Modal, Form, Input, InputNumber, Select, Row, Col, Tabs, Upload, Divider 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined, 
  ExclamationCircleOutlined, UploadOutlined, VideoCameraOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import roomService from '../../services/roomService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MyRooms = () => {
  // --- STATE DỮ LIỆU ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // --- STATE MODAL & UPLOAD ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // State quản lý ảnh trong Modal
  const [fileList, setFileList] = useState([]); 
  // State quản lý loading khi up video
  const [videoLoading, setVideoLoading] = useState(false);

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
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchMyRooms(); 
    fetchAmenities();
  }, []);

  // 2. Hàm xử lý Upload Ảnh trong Modal
  const handleUploadImage = async ({ file, onSuccess, onError }) => {
    try {
      const res = await roomService.uploadImage(file);
      // Trả về object chứa url để component Upload nhận diện
      onSuccess({ url: res.data.url }); 
    } catch (err) {
      onError(err);
      message.error("Upload ảnh lỗi");
    }
  };

  // 3. Hàm xử lý Upload Video trong Modal
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

  // 4. Mở Modal và Map dữ liệu cũ
  const handleEditClick = (record) => {
    setEditingRoom(record);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && editingRoom) {
        // a. Map tiện ích
        const rawIds = editingRoom.amenities?.map(item => item.id) || [];
        const uniqueIds = [...new Set(rawIds)];

        // b. Map hình ảnh cũ vào fileList để hiển thị
        // Antd Upload cần định dạng: { uid, name, status, url }
        const initialImages = (editingRoom.images || []).map((url, index) => ({
            uid: `-${index}`, // uid âm để tránh trùng
            name: `Ảnh ${index + 1}`,
            status: 'done',
            url: url
        }));
        setFileList(initialImages);

        // c. Fill dữ liệu vào Form
        form.setFieldsValue({
            ...editingRoom,
            amenities: uniqueIds,
            // Nếu API trả về amenities là array object, ta chỉ lấy ID. 
            // Nếu API Create/Update cần array String tên, bạn cần map theo name.
            // Ở CreateRoom bạn map theo Name, nên ở đây tôi giả sử amenities input là ID, 
            // nhưng nếu backend cần Name thì sửa lại map(item => item.name).
            // Dựa trên code cũ của bạn, amenities đang nhận ID.
        });
    } else {
        form.resetFields();
        setFileList([]);
    }
  }, [isModalOpen, editingRoom, form]);

  // 5. Submit Update
  const handleUpdateSubmit = async () => {
    try {
        const values = await form.validateFields();
        setUpdateLoading(true);

        // Lấy danh sách link ảnh cuối cùng
        // file.response.url (ảnh mới up) hoặc file.url (ảnh cũ)
        const finalImages = fileList.map(f => {
            if (f.response && f.response.url) return f.response.url;
            return f.url;
        }).filter(url => url); // Lọc bỏ null/undefined

        if (finalImages.length === 0) {
            message.error("Phòng cần ít nhất 1 hình ảnh!");
            setUpdateLoading(false);
            return;
        }

        const payload = {
            ...values,
            images: finalImages
        };
        
        await roomService.updateRoom(editingRoom.id, payload);
        
        message.success("Cập nhật thành công! Tin sẽ chuyển sang trạng thái chờ duyệt.");
        setIsModalOpen(false);
        setEditingRoom(null);
        fetchMyRooms(); 
    } catch (error) {
        message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
        setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await roomService.deleteRoom(id);
      message.success("Đã xóa phòng!");
      fetchMyRooms();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  // --- RENDERING HELPERS ---
  const amenityOptions = useMemo(() => {
      return amenitiesList.filter(item => item && item.id).map((item) => ({
          label: item.name, value: item.id,
      }));
  }, [amenitiesList]);

  const renderStatus = (status) => {
    switch(status) {
        case 'ACTIVE': return <Tag color="success">Đang hoạt động</Tag>;
        case 'PENDING': return <Tag color="warning">Đang chờ duyệt</Tag>;
        case 'REJECTED': return <Tag color="error" icon={<ExclamationCircleOutlined />}>Bị từ chối</Tag>;
        case 'HIDDEN': return <Tag color="default">Đã ẩn</Tag>;
        default: return <Tag>{status}</Tag>;
    }
  };

  const filteredData = useMemo(() => {
      if (filterStatus === 'ALL') return rooms;
      return rooms.filter(r => r.status === filterStatus);
  }, [rooms, filterStatus]);

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      width: 100,
      render: (images) => {
        if (!images || images.length === 0) return <Image src="https://via.placeholder.com/100" width={80} />;
        return (
          <Image.PreviewGroup>
            <Image src={images[0]} width={80} height={60} className="object-cover rounded" />
            {images.slice(1).map((imgUrl, i) => <Image key={i} src={imgUrl} style={{ display: 'none' }} />)}
          </Image.PreviewGroup>
        );
      }
    },
    {
      title: 'Thông tin phòng',
      dataIndex: 'title',
      render: (text, r) => (
        <div>
            <div className="font-bold text-blue-900 text-base">{text}</div>
            <div className="text-gray-500 text-xs mb-1">{r.address}</div>
            {renderStatus(r.status)}
        </div>
      )
    },
    {
      title: 'Giá / Cọc',
      width: 150,
      render: (_, r) => (
        <div>
            <div className="text-green-600 font-semibold">{r.price?.toLocaleString()} đ</div>
            <div className="text-xs text-gray-400">Cọc: {r.deposit?.toLocaleString()} đ</div>
        </div>
      )
    },
    {
      title: 'Loại hình',
      width: 150,
      render: (_, r) => (
          <div className="text-xs">
              <Tag color="geekblue">{r.rentalType === 'WHOLE' ? 'Nguyên căn' : 'Ở ghép'}</Tag>
              <div className="mt-1">{r.currentTenants || 0}/{r.capacity} người</div>
          </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, r) => (
        <Space direction="vertical" size="small">
          <Space>
            <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/rooms/${r.id}`)}/>
            <Button type="primary" ghost icon={<EditOutlined />} size="small" onClick={() => handleEditClick(r)}>Sửa</Button>
            <Popconfirm title="Xóa phòng này?" onConfirm={() => handleDelete(r.id)} okButtonProps={{ danger: true }}>
                <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
          {r.status === 'REJECTED' && <Text type="danger" className="text-xs">* Cần sửa lại để duyệt</Text>}
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: 'ALL', label: `Tất cả (${rooms.length})` },
    { key: 'ACTIVE', label: 'Đang hoạt động' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'REJECTED', label: 'Bị từ chối' },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
            <Title level={3} style={{ margin: 0 }}>Quản Lý Phòng Trọ</Title>
            <Text type="secondary">Danh sách các phòng bạn đang cho thuê</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/landlord/create-room')}>
            Đăng Tin Mới
        </Button>
      </div>

      <Tabs defaultActiveKey="ALL" items={tabItems} onChange={setFilterStatus} className="mb-4" />

      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />

      {/* --- MODAL CẬP NHẬT ĐẦY ĐỦ --- */}
      <Modal
        title="Cập nhật thông tin phòng"
        open={isModalOpen}
        onOk={handleUpdateSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={updateLoading}
        width={900}
        okText="Lưu và Gửi duyệt lại"
        cancelText="Hủy"
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
            {editingRoom?.status === 'REJECTED' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                    <ExclamationCircleOutlined className="mr-2"/> 
                    Phòng này đã bị từ chối. Vui lòng cập nhật lại thông tin chính xác.
                </div>
            )}

            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item label="Tên phòng trọ" name="title" rules={[{ required: true }]}>
                        <Input size="large" />
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
                    <Form.Item label="Giá thuê" name="price" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Tiền cọc" name="deposit">
                         <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="VND"/>
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
                        <Select>
                            <Option value="MALE_ONLY">Chỉ nam</Option>
                            <Option value="FEMALE_ONLY">Chỉ nữ</Option>
                            <Option value="ANY">Nam/Nữ đều được</Option>
                            <Option value="MIXED">Nam nữ tự do</Option>
                        </Select>
                    </Form.Item>
                 </Col>
            </Row>

            <Form.Item label="Địa chỉ" name="address" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item label="Tiện ích" name="amenities">
                 <Select 
                    mode="multiple" 
                    style={{ width: '100%' }}
                    options={amenityOptions} 
                    allowClear
                    placeholder="Chọn tiện ích"
                 />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
                <TextArea rows={4} />
            </Form.Item>

            <Divider orientation="left">Media (Ảnh & Video)</Divider>

            {/* --- CẬP NHẬT: Upload Video trong Modal --- */}
            <Form.Item 
                label="Video URL" 
                name="videoUrl"
                tooltip="Dán link Youtube hoặc Upload video mới"
            >
                <Input 
                    prefix={<VideoCameraOutlined />} 
                    placeholder="Link video..." 
                    addonAfter={
                        <Upload accept="video/*" showUploadList={false} customRequest={handleUploadVideo}>
                            <Button type="text" icon={<UploadOutlined />} loading={videoLoading}>
                                {videoLoading ? "..." : "Upload"}
                            </Button>
                        </Upload>
                    }
                />
            </Form.Item>

            {/* --- CẬP NHẬT: Quản lý Hình ảnh (Thêm/Xóa) --- */}
            <Form.Item label="Hình ảnh phòng">
                <Upload 
                    listType="picture-card"
                    customRequest={handleUploadImage}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    maxCount={5}
                >
                    {fileList.length < 5 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                </Upload>
            </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default MyRooms;