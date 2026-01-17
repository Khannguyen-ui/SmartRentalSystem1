import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Không cần lấy user.role từ hook nữa, vì ta dựa vào dữ liệu từng dòng

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyCalendar();

      // --- THÊM DÒNG NÀY ĐỂ DEBUG ---
      console.log("🔥 Dữ liệu từ API:", res);
      // -----------------------------

      // TRƯỜNG HỢP 1: Nếu axiosClient giữ nguyên response gốc
      if (res.data) {
        setAppointments(res.data);
      }
      // TRƯỜNG HỢP 2: Nếu axiosClient đã lấy .data rồi (thường gặp)
      else if (Array.isArray(res)) {
        setAppointments(res);
      }
      // TRƯỜNG HỢP 3: Nếu Backend trả về dạng { status: "OK", result: [...] }
      else if (res.result) {
        setAppointments(res.result);
      }
      else {
        console.warn("Không tìm thấy mảng dữ liệu trong response!");
      }

    } catch (error) {
      console.error("Lỗi:", error);
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
      message.success(status === 'CONFIRMED' ? "Đã duyệt lịch!" : "Đã cập nhật trạng thái!");
      fetchAppointments();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'PENDING': return <Tag icon={<ClockCircleOutlined />} color="orange">Chờ xác nhận</Tag>;
      case 'CONFIRMED': return <Tag icon={<CheckCircleOutlined />} color="green">Đã chốt lịch</Tag>;
      case 'CANCELLED': return <Tag icon={<CloseCircleOutlined />} color="red">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Thông tin phòng',
      dataIndex: 'roomTitle',
      key: 'roomTitle',
      width: 250,
      render: (text, record) => (
        <div>
          <div className="font-bold text-blue-600">{text}</div>
          <div className="text-xs text-gray-500 truncate max-w-[200px]">{record.roomAddress}</div>
        </div>
      )
    },
    {
      title: 'Vai trò của bạn',
      key: 'role',
      align: 'center',
      render: (_, record) => {
        // Dựa vào field isMyRequest từ Backend để hiển thị Badge
        if (record.isMyRequest) {
          return <Tag color="blue" icon={<UserOutlined />}>Tôi đi thuê</Tag>;
        }
        return <Tag color="purple" icon={<HomeOutlined />}>Tôi cho thuê</Tag>;
      }
    },
    {
      title: 'Đối tác liên hệ', // Đặt tên chung chung
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <a href={`tel:${record.partnerPhone}`} className="text-xs text-gray-500 hover:text-blue-500">
            {record.partnerPhone}
          </a>
        </div>
      )
    },
    {
      title: 'Thời gian hẹn',
      dataIndex: 'meetTime',
      key: 'meetTime',
      sorter: (a, b) => dayjs(a.meetTime).unix() - dayjs(b.meetTime).unix(),
      render: (time) => (
        <div>
          <div className="font-bold">{dayjs(time).format('HH:mm')}</div>
          <div className="text-xs text-gray-500">{dayjs(time).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Lời nhắn',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (record.status !== 'PENDING') return null;

        // LOGIC QUAN TRỌNG: C2C
        if (record.isMyRequest) {
          // A. Nếu tôi là người GỬI yêu cầu -> Tôi chỉ được HỦY
          return (
            <Popconfirm title="Hủy yêu cầu xem phòng này?" onConfirm={() => handleUpdateStatus(record.id, 'CANCELLED')}>
              <Button danger size="small">Hủy yêu cầu</Button>
            </Popconfirm>
          );
        } else {
          // B. Nếu tôi là người NHẬN yêu cầu (Chủ nhà) -> Tôi được DUYỆT hoặc TỪ CHỐI
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                className="bg-green-600 hover:bg-green-500 border-none"
                onClick={() => handleUpdateStatus(record.id, 'CONFIRMED')}
              >
                Duyệt
              </Button>
              <Popconfirm title="Từ chối khách này?" onConfirm={() => handleUpdateStatus(record.id, 'CANCELLED')}>
                <Button type="primary" danger size="small">Từ chối</Button>
              </Popconfirm>
            </Space>
          );
        }
      }
    },
  ];

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Lịch Hẹn</h2>
        <Button onClick={fetchAppointments} icon={<ClockCircleOutlined />}>Làm mới</Button>
      </div>

      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default AppointmentManagement;