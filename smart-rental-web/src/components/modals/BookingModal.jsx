import React, { useState } from 'react';
import { Modal, Form, DatePicker, TimePicker, Input, Button, message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../services/appointmentService'; // Đảm bảo import đúng đường dẫn

const BookingModal = ({ visible, onClose, room, user }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleOk = async (values) => {
    // 1. Kiểm tra đăng nhập
    if (!user) {
        Modal.warning({
            title: "Yêu cầu đăng nhập",
            content: "Bạn cần đăng nhập để đặt lịch xem phòng.",
            okText: "Đăng nhập ngay",
            onOk: () => navigate('/login')
        });
        return;
    }

    setLoading(true);
    try {
      // --- BẮT ĐẦU ĐOẠN LOGIC CẬP NHẬT ---
      
      // 2. Xử lý gộp Ngày + Giờ
      // values.date và values.time đều là object dayjs từ Ant Design
      let finalDateTime = values.date; 
      
      // Set giờ và phút từ TimePicker vào ngày đã chọn
      finalDateTime = finalDateTime
          .hour(values.time.hour())
          .minute(values.time.minute())
          .second(0);

      // 3. Chuẩn bị dữ liệu chuẩn format Backend yêu cầu
      const appointmentData = {
        roomId: room.id,
        // QUAN TRỌNG: Format y hệt @JsonFormat("yyyy-MM-dd HH:mm:ss") bên Backend
        meetTime: finalDateTime.format('YYYY-MM-DD HH:mm:ss'), 
        // Map trường 'note' từ form sang 'message' của Backend
        message: values.note 
      };

      console.log("📦 Dữ liệu gửi đi:", appointmentData);

      // 4. Gọi API thật
      await appointmentService.create(appointmentData);
      
      // --- KẾT THÚC ĐOẠN LOGIC CẬP NHẬT ---

      message.success("Gửi yêu cầu thành công! Chủ trọ sẽ liên hệ sớm.");
      form.resetFields();
      onClose();

    } catch (error) {
      console.error("Lỗi:", error);
      // Hiển thị thông báo lỗi chi tiết từ Backend trả về
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      // Nếu có lỗi validate chi tiết (ví dụ từ GlobalExceptionHandler)
      const errorDetails = error.response?.data?.details || "";
      
      message.error(`${errorMsg} ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đặt lịch xem phòng"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      {/* Tóm tắt thông tin phòng trong Modal */}
      <div className="mb-5 bg-orange-50 p-4 rounded-lg border border-orange-100 flex justify-between items-center">
        <div>
            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{room?.title}</h4>
            <p className="text-gray-500 text-xs mt-1">{room?.address}</p>
        </div>
        <div className="text-[#f96302] font-bold whitespace-nowrap ml-2">
            {room?.price?.toLocaleString()} đ
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleOk}>
        <div className="grid grid-cols-2 gap-4">
            <Form.Item 
                label="Ngày xem mong muốn" 
                name="date" 
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
                <DatePicker 
                    className="w-full" 
                    format="DD/MM/YYYY"
                    disabledDate={(current) => current && current < dayjs().endOf('day')}
                    placeholder="Chọn ngày"
                />
            </Form.Item>
            <Form.Item 
                label="Giờ xem" 
                name="time" 
                rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
            >
                <TimePicker 
                    className="w-full" 
                    format="HH:mm" 
                    minuteStep={15}
                    placeholder="Chọn giờ"
                />
            </Form.Item>
        </div>

        <Form.Item label="Lời nhắn cho chủ trọ" name="note">
          <Input.TextArea 
            rows={3} 
            placeholder="Ví dụ: Mình muốn xem phòng vào giờ nghỉ trưa, khoảng 12h30..." 
          />
        </Form.Item>

        <Form.Item label="Thông tin liên hệ của bạn">
           <Input value={user?.fullName || ''} disabled prefix="Họ tên:" className="mb-2 bg-gray-50" />
           <Input value={user?.phone || ''} disabled prefix="SĐT:" className="bg-gray-50" />
        </Form.Item>

        <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block 
            size="large" 
            className="bg-[#f96302] hover:bg-orange-600 border-none h-10 font-semibold"
        >
          Xác nhận đặt lịch
        </Button>
      </Form>
    </Modal>
  );
};

export default BookingModal;