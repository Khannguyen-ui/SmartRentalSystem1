import axiosClient from '../config/axiosClient';

const appointmentService = {
    // Lấy danh sách lịch hẹn (Cho cả Tenant và Landlord)
    // Backend tự check role trong Token để trả về data tương ứng
    getMyCalendar: () => {
        return axiosClient.get('/appointments/my-calendar');
    },

    // Cập nhật trạng thái (Duyệt/Hủy)
    updateStatus: (id, status) => {
        return axiosClient.put(`/appointments/${id}/status`, null, {
            params: { status } 
        });
    },

    // Tạo lịch hẹn mới (Dùng cho Modal đặt lịch ở trang trước)
    create: (data) => {
        return axiosClient.post('/appointments', data);
    }
};

export default appointmentService;