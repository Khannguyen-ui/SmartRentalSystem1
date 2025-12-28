import axiosClient from "../config/axiosClient";

const notificationService = {
  // 1. Lấy danh sách thông báo
  getMyNotifications: () => {
    return axiosClient.get('/notifications');
  },

  // 2. Đánh dấu đã đọc
  markAsRead: (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
  }
};

export default notificationService;