import axiosClient from "../config/axiosClient";

const userService = {
  // 1. Lấy danh sách (GET)
  getAllUsers: () => {
    return axiosClient.get('/admin/users');
  },

  // 2. Thêm mới (POST)
  createUser: (data) => {
    return axiosClient.post('/admin/users', data);
  },

  // 3. Cập nhật thông tin (PUT)
  updateUser: (id, data) => {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  // 4. Khóa/Mở khóa (PUT)
  updateUserStatus: (userId) => {
    return axiosClient.put(`/admin/users/${userId}/status`);
  },

  // 5. Xóa vĩnh viễn (DELETE)
  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  }
};

export default userService;