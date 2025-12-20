import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axiosClient from '../../config/axiosClient';

const MasterData = () => {
  // --- STATE ---
  const [packages, setPackages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('PACKAGE'); // 'PACKAGE' or 'AMENITY'
  const [editingId, setEditingId] = useState(null); // ID của item đang sửa (null = tạo mới)
  
  const [form] = Form.useForm();

  // --- API CALLS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, ameRes] = await Promise.all([
        axiosClient.get('/admin/packages'),
        axiosClient.get('/admin/amenities')
      ]);
      setPackages(pkgRes.data);
      setAmenities(ameRes.data);
    } catch (error) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---

  // 1. Mở Modal để Tạo mới
  const openCreateModal = (type) => {
    setModalType(type);
    setEditingId(null); // Đặt null để biết là đang tạo mới
    form.resetFields(); // Xóa trắng form
    setIsModalOpen(true);
  };

  // 2. Mở Modal để Sửa (Đổ dữ liệu vào form)
  const openEditModal = (record, type) => {
    setModalType(type);
    setEditingId(record.id); // Lưu ID đang sửa
    form.setFieldsValue(record); // Đổ dữ liệu cũ vào form
    setIsModalOpen(true);
  };

  // 3. Xử lý Lưu (Tự động nhận diện Thêm hay Sửa)
  const handleSave = async (values) => {
    try {
      if (modalType === 'PACKAGE') {
        if (editingId) {
          // --- LOGIC SỬA GÓI CƯỚC (PUT)  ---
          await axiosClient.put(`/admin/packages/${editingId}`, values);
          message.success("Cập nhật gói cước thành công");
        } else {
          // --- LOGIC THÊM GÓI CƯỚC (POST) [cite: 220] ---
          await axiosClient.post('/admin/packages', values);
          message.success("Tạo gói cước thành công");
        }
      } else {
        // --- LOGIC TIỆN ÍCH ---
        if (editingId) {
            // Lưu ý: Backend cần có API PUT /admin/amenities/{id}
            // Nếu chưa có, bạn cần thêm vào Controller Java
            await axiosClient.put(`/admin/amenities/${editingId}`, values);
            message.success("Cập nhật tiện ích thành công");
        } else {
            // [cite: 217]
            await axiosClient.post('/admin/amenities', values);
            message.success("Tạo tiện ích thành công");
        }
      }
      setIsModalOpen(false);
      fetchData(); // Load lại bảng
    } catch (error) {
      console.error(error);
      message.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const endpoint = type === 'PACKAGE' ? `/admin/packages/${id}` : `/admin/amenities/${id}`;
      await axiosClient.delete(endpoint);
      message.success("Đã xóa!");
      fetchData();
    } catch (error) {
      message.error("Xóa thất bại (Dữ liệu đang được sử dụng)");
    }
  };

  // --- COLUMNS ---
  const packageColumns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Tên Gói', dataIndex: 'name', width: 200 },
    { title: 'Giá (VNĐ)', dataIndex: 'price', render: (v) => v?.toLocaleString() },
    { title: 'Thời hạn (Ngày)', dataIndex: 'durationDays' },
    { 
      title: 'Hành động', 
      render: (_, r) => (
        <Space>
          {/* Nút Sửa */}
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            className="text-blue-600 border-blue-600" 
            onClick={() => openEditModal(r, 'PACKAGE')}
          >
            Sửa
          </Button>

          {/* Nút Xóa */}
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id, 'PACKAGE')}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ) 
    }
  ];

  const amenityColumns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Tên Tiện Ích', dataIndex: 'name' },
    { 
        title: 'Hành động', 
        render: (_, r) => (
          <Space>
            {/* Nút Sửa */}
            <Button 
                icon={<EditOutlined />} 
                size="small" 
                className="text-blue-600 border-blue-600"
                onClick={() => openEditModal(r, 'AMENITY')}
            >
                Sửa
            </Button>

            {/* Nút Xóa */}
            <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id, 'AMENITY')}>
                <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
        ) 
      }
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Quản Lý Dữ Liệu Nền</h2>
      
      <Tabs defaultActiveKey="1" items={[
        {
          key: '1',
          label: 'Gói Dịch Vụ',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal('PACKAGE')} className="mb-4">
                Thêm Gói Mới
              </Button>
              <Table dataSource={packages} columns={packageColumns} rowKey="id" loading={loading} pagination={false} />
            </>
          )
        },
        {
          key: '2',
          label: 'Tiện Ích Phòng',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal('AMENITY')} className="mb-4">
                Thêm Tiện Ích
              </Button>
              <Table dataSource={amenities} columns={amenityColumns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />
            </>
          )
        }
      ]} />

      {/* MODAL FORM */}
      <Modal 
        title={editingId ? "Cập Nhật Dữ Liệu" : (modalType === 'PACKAGE' ? "Thêm Gói Cước" : "Thêm Tiện Ích")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingId ? "Lưu thay đổi" : "Tạo mới"}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input />
          </Form.Item>
          
          {modalType === 'PACKAGE' && (
            <>
              <Form.Item name="price" label="Giá tiền (VNĐ)" rules={[{ required: true, message: 'Nhập giá tiền!' }]}>
                <InputNumber className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
              <Form.Item name="durationDays" label="Số ngày hiệu lực" rules={[{ required: true, message: 'Nhập số ngày!' }]}>
                <InputNumber className="w-full" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MasterData;