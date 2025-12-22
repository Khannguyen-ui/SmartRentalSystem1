import axiosClient from "../config/axiosClient";

const appointmentService = {
  // 1. Đặt lịch (POST /api/appointments)
  createAppointment: (data) => {
    return axiosClient.post("/appointments", data);
  },

  // 2. Lấy danh sách lịch của tôi (GET /api/appointments/my-calendar)
  getMyCalendar: () => {
    return axiosClient.get("/appointments/my-calendar");
  },

  // 3. Cập nhật trạng thái (PUT /api/appointments/{id}/status)
  // status: CONFIRMED, CANCELLED
  updateStatus: (id, status) => {
    return axiosClient.put(`/appointments/${id}/status`, null, {
      params: { status }
    });
  }
};

export default appointmentService;