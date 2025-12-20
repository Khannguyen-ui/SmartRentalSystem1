import axiosClient from "../config/axiosClient";

const userService = {
  // Lấy danh sách toàn bộ user (Có thể phân trang nếu backend hỗ trợ)
  getAllUsers: () => {
    return axiosClient.get('/admin/users');
  },

  // Khóa hoặc Mở khóa tài khoản
  // status: true (Active), false (Locked)
  updateUserStatus: (userId, status) => {
    return axiosClient.put(`/admin/users/${userId}/status`, null, {
        params: { active: status }
    });
  }
};

export default userService;