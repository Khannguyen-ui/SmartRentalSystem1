import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService';
import useAuth from '../../hooks/useAuth'; // Giả sử bạn có hook lấy thông tin user

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Để biết mình là LANDLORD hay TENANT

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyCalendar();
      setAppointments(res.data);
    } catch (error) {
      message.error("Lỗi tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      message.success(`Đã cập nhật trạng thái: ${status}`);
      fetchAppointments(); // Reload lại bảng
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi cập nhật");
    }
  };

  // Cấu hình màu sắc cho trạng thái
  const getStatusTag = (status) => {
    switch (status) {
      case 'PENDING': return <Tag icon={<ClockCircleOutlined />} color="orange">Chờ xác nhận</Tag>;
      case 'CONFIRMED': return <Tag icon={<CheckCircleOutlined />} color="green">Đã duyệt</Tag>;
      case 'CANCELLED': return <Tag icon={<CloseCircleOutlined />} color="red">Đã hủy</Tag>;
      case 'COMPLETED': return <Tag color="blue">Hoàn thành</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomTitle',
      key: 'roomTitle',
      render: (text, record) => (
        <div>
          <div className="font-bold text-blue-600">{text}</div>
          <div className="text-xs text-gray-500">{record.roomAddress}</div>
        </div>
      )
    },
    {
      title: user?.role === 'LANDLORD' ? 'Người thuê' : 'Chủ trọ',
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.partnerPhone}</div>
        </div>
      )
    },
    {
      title: 'Thời gian hẹn',
      dataIndex: 'meetTime',
      key: 'meetTime',
      render: (time) => dayjs(time).format('HH:mm - DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.meetTime).unix() - dayjs(b.meetTime).unix(),
    },
    {
      title: 'Lời nhắn',
      dataIndex: 'message',
      key: 'message',
      width: 250,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Chờ xác nhận', value: 'PENDING' },
        { text: 'Đã duyệt', value: 'CONFIRMED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        // Nếu không phải PENDING thì không làm gì được (trừ khi bạn muốn thêm nút Hoàn thành)
        if (record.status !== 'PENDING') return null;

        return (
          <Space>
            {user?.role === 'LANDLORD' ? (
              // --- Nút cho CHỦ TRỌ ---
              <>
                <Button 
                  type="primary" 
                  size="small" 
                  className="bg-green-600"
                  onClick={() => handleUpdateStatus(record.id, 'CONFIRMED')}
                >
                  Duyệt
                </Button>
                <Popconfirm title="Từ chối lịch này?" onConfirm={() => handleUpdateStatus(record.id, 'CANCELLED')}>
                  <Button type="primary" danger size="small">Từ chối</Button>
                </Popconfirm>
              </>
            ) : (
              // --- Nút cho KHÁCH THUÊ ---
              <Popconfirm title="Hủy yêu cầu này?" onConfirm={() => handleUpdateStatus(record.id, 'CANCELLED')}>
                 <Button danger size="small">Hủy yêu cầu</Button>
              </Popconfirm>
            )}
          </Space>
        );
      }
    },
  ];

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Quản lý Lịch Hẹn Xem Phòng</h2>
      <Table 
        columns={columns} 
        dataSource={appointments} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AppointmentManagement;