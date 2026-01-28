import React, { useEffect, useState } from 'react';
import {
  Tabs, Table, Button, Modal, Form, Input, InputNumber,
  message, Popconfirm, Space, Tag, Row, Col, Card, ConfigProvider, Tooltip
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  FireFilled, CrownFilled, AppstoreFilled, InfoCircleOutlined
} from '@ant-design/icons';
import axiosClient from '../../config/axiosClient';

const { TextArea } = Input;

// --- CẤU HÌNH THEME MÀU CAM ---
const themeConfig = {
  token: {
    colorPrimary: '#f96302', // Màu cam chủ đạo
    borderRadius: 8,
  },
  components: {
    Button: {
      colorPrimary: '#f96302',
      algorithm: true,
    },
    Tabs: {
      itemSelectedColor: '#f96302',
      itemHoverColor: '#f96302',
      inkBarColor: '#f96302',
    }
  }
};

const MasterData = () => {
  // --- STATE ---
  const [pushPackages, setPushPackages] = useState([]);     // Tab 1: Gói Đẩy Tin
  const [memberPackages, setMemberPackages] = useState([]); // Tab 2: Gói Hội Viên
  const [amenities, setAmenities] = useState([]);           // Tab 3: Tiện Ích

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // FORM STATE: 'PUSH' | 'MEMBER' | 'AMENITY'
  const [currentType, setCurrentType] = useState('PUSH');
  const [editingId, setEditingId] = useState(null);

  const [form] = Form.useForm();

  // --- API CALLS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, ameRes] = await Promise.all([
        axiosClient.get('/admin/master-data/packages'),
        axiosClient.get('/admin/master-data/amenities')
      ]);

      const allPackages = pkgRes.data;
      // Tách gói dựa trên Type
      setPushPackages(allPackages.filter(p => p.type === 'ROOM_PROMOTION'));
      setMemberPackages(allPackages.filter(p => p.type === 'MEMBERSHIP'));

      setAmenities(ameRes.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- MODAL HANDLERS ---
  const openCreateModal = (type) => {
    setCurrentType(type);
    setEditingId(null);
    form.resetFields();

    // Default Values
    if (type === 'PUSH') {
      form.setFieldsValue({ type: 'ROOM_PROMOTION', priorityLevel: 1, active: true, discountPercent: 0 });
    } else if (type === 'MEMBER') {
      form.setFieldsValue({ type: 'MEMBERSHIP', priorityLevel: 0, active: true, discountPercent: 5 });
    }

    setIsModalOpen(true);
  };

  const openEditModal = (record, type) => {
    setCurrentType(type);
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (currentType === 'AMENITY') {
        if (editingId) {
          message.warning("Backend chưa hỗ trợ sửa tiện ích");
        } else {
          await axiosClient.post('/admin/master-data/amenities', values);
          message.success("Thêm tiện ích thành công");
        }
      } else {
        if (editingId) {
          await axiosClient.put(`/admin/master-data/packages/${editingId}`, values);
          message.success("Cập nhật thành công");
        } else {
          await axiosClient.post('/admin/master-data/packages', values);
          message.success("Tạo mới thành công");
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Lỗi: " + (error.response?.data?.message || "Hệ thống bận"));
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const endpoint = type === 'AMENITY' ? `/admin/master-data/amenities/${id}` : `/admin/master-data/packages/${id}`;
      await axiosClient.delete(endpoint);
      message.success("Đã xóa!");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa (Dữ liệu đang được sử dụng)");
    }
  };

  // --- COLUMNS CONFIG ---
  
  // 1. Cột Gói Đẩy Tin
  const pushColumns = [
    { 
      title: 'Tên Gói', dataIndex: 'name', width: '25%', 
      render: (t) => <span className="font-bold text-[#f96302]">{t}</span> 
    },
    {
      title: 'Độ Ưu Tiên', dataIndex: 'priorityLevel', align: 'center',
      render: (val) => (
        <Tooltip title={val >= 10 ? "Luôn hiển thị đầu trang" : "Hiển thị ưu tiên thường"}>
           <Tag color={val >= 10 ? '#f50' : 'orange'}>
             {val >= 10 ? <FireFilled /> : null} Priority {val}
           </Tag>
        </Tooltip>
      )
    },
    { title: 'Giá', dataIndex: 'price', render: (v) => <b className="text-gray-700">{v?.toLocaleString()} đ</b> },
    { title: 'Thời hạn', dataIndex: 'durationDays', render: (v) => `${v} ngày` },
    {
      title: 'Hành động',
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined className="text-[#f96302]" />} onClick={() => openEditModal(r, 'PUSH')} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id, 'PACKAGE')}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 2. Cột Gói Hội Viên
  const memberColumns = [
    { 
      title: 'Tên Hạng', dataIndex: 'name', width: '25%', 
      render: (t) => <span className="font-bold text-[#d48806]"><CrownFilled className="mr-2"/>{t}</span> 
    },
    {
      title: '% Giảm Giá', dataIndex: 'discountPercent', align: 'center',
      render: (val) => <Tag color="gold" className="font-bold">-{val}% Phí đăng</Tag>
    },
    { title: 'Giá Gói', dataIndex: 'price', render: (v) => <b className="text-gray-700">{v?.toLocaleString()} đ</b> },
    { title: 'Hiệu lực', dataIndex: 'durationDays', render: (v) => `${v} ngày` },
    {
      title: 'Hành động',
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined className="text-[#f96302]" />} onClick={() => openEditModal(r, 'MEMBER')} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id, 'PACKAGE')}>
             <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const amenityColumns = [
    { title: 'Tên Tiện Ích', dataIndex: 'name', render: t => <span className="font-medium">{t}</span> },
    { 
      title: '', 
      render: (_, r) => (
        <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id, 'AMENITY')}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) 
    }
  ];

  return (
    <ConfigProvider theme={themeConfig}>
      <div className="p-6 bg-[#fff7f0] min-h-screen"> 
        {/* Card chính màu trắng nổi bật trên nền cam nhạt */}
        <Card className="shadow-sm border-t-4 border-t-[#f96302]">
          
          <div className="mb-6 border-b border-gray-100 pb-4">
             <h2 className="text-2xl font-bold text-gray-800 m-0">
               Quản Lý Dữ Liệu Nền
             </h2>
             <p className="text-gray-500 mt-1">Cấu hình các gói dịch vụ và tiện ích hệ thống</p>
          </div>

          <Tabs 
            defaultActiveKey="1" 
            type="card"
            items={[
              // TAB 1: GÓI ĐẨY TIN
              {
                key: '1',
                label: <span><FireFilled className={currentType==='PUSH'?"text-[#f96302]":""} /> Gói Đẩy Tin</span>,
                children: (
                  <div className="mt-4 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <div className="flex items-start gap-2 text-gray-600 text-sm max-w-2xl">
                         <InfoCircleOutlined className="text-[#f96302] mt-0.5"/>
                         <span>
                           Gói này dùng khi User đăng tin. 
                           <b> Priority Level</b> càng cao, tin càng hiển thị lên trên cùng của danh sách tìm kiếm.
                         </span>
                      </div>
                      <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openCreateModal('PUSH')}>
                        Thêm Gói Mới
                      </Button>
                    </div>
                    <Table dataSource={pushPackages} columns={pushColumns} rowKey="id" loading={loading} pagination={false} />
                  </div>
                )
              },
              
              // TAB 2: GÓI HỘI VIÊN
              {
                key: '2',
                label: <span><CrownFilled className="text-[#d48806]"/> Gói Hội Viên</span>,
                children: (
                  <div className="mt-4 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 bg-[#fffbe6] p-4 rounded-lg border border-[#ffe58f]">
                      <div className="flex items-start gap-2 text-gray-600 text-sm max-w-2xl">
                         <InfoCircleOutlined className="text-[#d48806] mt-0.5"/>
                         <span>
                           Gói dành cho User mua theo tháng. 
                           Khi có gói này, User sẽ được <b>Giảm giá %</b> mỗi lần thanh toán phí đăng tin.
                         </span>
                      </div>
                      <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openCreateModal('MEMBER')} style={{ background: '#d48806' }}>
                        Thêm Gói Hội Viên
                      </Button>
                    </div>
                    <Table dataSource={memberPackages} columns={memberColumns} rowKey="id" loading={loading} pagination={false} />
                  </div>
                )
              },

              // TAB 3: TIỆN ÍCH
              {
                key: '3',
                label: <span><AppstoreFilled /> Tiện Ích</span>,
                children: (
                  <div className="mt-4 animate-fadeIn">
                     <div className="flex justify-end mb-4">
                        <Button icon={<PlusOutlined />} onClick={() => openCreateModal('AMENITY')}>Thêm Tiện Ích</Button>
                     </div>
                     <Table dataSource={amenities} columns={amenityColumns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
                  </div>
                )
              }
            ]} 
          />
        </Card>

        {/* --- MODAL FORM CHUNG --- */}
        <Modal
          title={
            <div className="text-[#f96302] font-bold text-lg">
              {currentType === 'PUSH' ? <><FireFilled /> Cấu hình Gói Đẩy Tin</> :
               currentType === 'MEMBER' ? <><CrownFilled /> Cấu hình Gói Hội Viên</> : "Thêm Tiện Ích"}
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onOk={() => form.submit()}
          width={550}
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
            
            <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
              <Input placeholder="Ví dụ: Gói VIP Kim Cương" size="large" />
            </Form.Item>

            {/* Các trường ẩn để định danh */}
            {currentType !== 'AMENITY' && <Form.Item name="type" hidden><Input /></Form.Item>}

            {/* --- TRƯỜNG CHO GÓI ĐẨY TIN --- */}
            {currentType === 'PUSH' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="priorityLevel" label={<span className="font-semibold text-[#f96302]">Độ ưu tiên (Priority)</span>} rules={[{ required: true }]}>
                      <InputNumber className="w-full" size="large" min={0} placeholder="VD: 10" />
                    </Form.Item>
                    <div className="text-xs text-gray-400 -mt-4 mb-4">Số càng lớn, tin càng lên cao.</div>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="durationDays" label="Số ngày hiển thị" rules={[{ required: true }]}>
                      <InputNumber className="w-full" size="large" min={1} addonAfter="Ngày" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="price" label="Giá tiền (Mỗi lần đăng)" rules={[{ required: true }]}>
                  <InputNumber 
                    className="w-full" size="large" 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    addonAfter="VNĐ"
                  />
                </Form.Item>
                <Form.Item name="discountPercent" hidden initialValue={0}><Input /></Form.Item>
              </>
            )}

            {/* --- TRƯỜNG CHO GÓI HỘI VIÊN --- */}
            {currentType === 'MEMBER' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                     <Form.Item name="discountPercent" label={<span className="font-semibold text-[#d48806]">% Giảm giá</span>} rules={[{ required: true }]}>
                        <InputNumber className="w-full" size="large" min={0} max={100} formatter={v => `${v}%`} parser={v => v.replace('%', '')} />
                     </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="durationDays" label="Hiệu lực gói" rules={[{ required: true }]}>
                      <InputNumber className="w-full" size="large" min={1} addonAfter="Ngày" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="price" label="Giá mua gói" rules={[{ required: true }]}>
                  <InputNumber 
                    className="w-full" size="large" 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    addonAfter="VNĐ"
                  />
                </Form.Item>
                <Form.Item name="priorityLevel" hidden initialValue={0}><Input /></Form.Item>
              </>
            )}

            {currentType !== 'AMENITY' && (
               <Form.Item name="description" label="Mô tả quyền lợi">
                  <TextArea rows={3} placeholder="Mô tả ngắn gọn quyền lợi để người dùng dễ hiểu..." />
               </Form.Item>
            )}

          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default MasterData;