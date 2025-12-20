import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, Input, message, Image, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import adminService from '../../services/adminService';

const RoomApprove = () => {
  const [rooms, setRooms] = useState([]); // [cite: 674]
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, roomId: null });
  const [reason, setReason] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Gọi API lấy phòng Pending. 
      // Nếu API backend trả về List<Room> thì dùng res.data
      const res = await adminService.getPendingRooms(); 
      setRooms(res.data || []);
    } catch (error) {
      console.log("Lỗi tải dữ liệu", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleApprove = async (id) => {
    try {
      await adminService.approveRoom(id, true); // approved = true [cite: 315]
      message.success("Đã duyệt phòng thành công!");
      fetchRooms();
    } catch (error) {
      message.error("Lỗi: " + (error.response?.data?.message || "Không thể duyệt"));
    }
  };

  const handleReject = async () => {
    if (!reason) return message.warning("Vui lòng nhập lý do từ chối");
    try {
      await adminService.approveRoom(rejectModal.roomId, false, reason); // approved = false [cite: 315]
      message.success("Đã từ chối phòng!");
      setRejectModal({ open: false, roomId: null });
      setReason("");
      fetchRooms();
    } catch (error) {
      message.error("Lỗi khi từ chối");
    }
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      render: (imgs) => <Image src={imgs?.[0]} width={80} height={60} className="object-cover rounded" />
    },
    { title: 'Tiêu đề', dataIndex: 'title', width: 250 },
    { 
      title: 'Giá', 
      dataIndex: 'price', 
      render: (val) => <span className="text-blue-600 font-bold">{val?.toLocaleString()} đ</span> 
    },
    { title: 'Chủ trọ', dataIndex: 'landlordName' }, // [cite: 389]
    {
      title: 'Gói tin',
      dataIndex: 'servicePackageId', // [cite: 484]
      render: (id) => <Tag color="gold">Gói ID: {id}</Tag>
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          <Button type="primary" className="bg-green-600" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.id)}>
            Duyệt
          </Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal({ open: true, roomId: record.id })}>
            Từ chối
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Danh Sách Chờ Duyệt</h2>
      <Table dataSource={rooms} columns={columns} rowKey="id" loading={loading} />
      
      <Modal 
        title="Từ chối duyệt tin" 
        open={rejectModal.open} 
        onOk={handleReject} 
        onCancel={() => setRejectModal({ open: false, roomId: null })}
        okButtonProps={{ danger: true }}
      >
        <p>Lý do từ chối:</p>
        <Input.TextArea rows={4} value={reason} onChange={e => setReason(e.target.value)} />
      </Modal>
    </div>
  );
};

export default RoomApprove;