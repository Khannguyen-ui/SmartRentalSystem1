import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Image, message, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import roomService from '../../services/roomService';
import axiosClient from '../../config/axiosClient';

const MyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRooms = async () => {
    setLoading(true);
    try {
      // API: GET /api/rooms/my-rooms [cite: 295]
      const res = await roomService.getMyRooms();
      setRooms(res.data);
    } catch (error) {
      message.error("Lỗi tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyRooms(); }, []);

  const handleDelete = async (id) => {
    try {
      // API: DELETE /api/rooms/{id} [cite: 296]
      await axiosClient.delete(`/rooms/${id}`);
      message.success("Đã xóa phòng");
      fetchMyRooms();
    } catch (error) {
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      render: (imgs) => <Image src={imgs?.[0]} width={60} />
    },
    { title: 'Tên phòng', dataIndex: 'title' },
    { title: 'Giá', dataIndex: 'price', render: v => v?.toLocaleString() },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'green';
        if (status === 'PENDING') color = 'orange';
        if (status === 'HIDDEN' || status === 'REJECTED') color = 'red';
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Hành động',
      render: (_, r) => (
        <Space>
           {/* Nút Sửa (Tính năng này có thể làm sau) */}
           <Button icon={<EditOutlined />} disabled /> 
           
           <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(r.id)}>
              <Button danger icon={<DeleteOutlined />} />
           </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
       <h2 className="text-xl font-bold mb-4">Danh Sách Phòng Của Tôi</h2>
       <Table dataSource={rooms} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
};

export default MyRooms;