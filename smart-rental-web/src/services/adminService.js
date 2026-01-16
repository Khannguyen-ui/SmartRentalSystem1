import axiosClient from "../config/axiosClient";

const adminService = {
  // ============================
  // 1. THỐNG KÊ (DASHBOARD)
  // ============================
  getDashboardStats: () => {
    return axiosClient.get("/admin/stats");
  },

  // ============================
  // 2. QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)
  // ============================
  // Lấy danh sách tất cả người dùng
  getAllUsers: () => {
    return axiosClient.get("/admin/users");
  },

  // Admin tạo người dùng mới
  createUser: (data) => {
    return axiosClient.post('/admin/users', data);
  },

  // Admin sửa thông tin người dùng bất kỳ
  updateUser: (id, data) => {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  // Khóa / Mở khóa tài khoản
  toggleUserStatus: (id) => {
    return axiosClient.put(`/admin/users/${id}/status`);
  },

  // Xóa người dùng vĩnh viễn
  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  // Duyệt hoặc Từ chối hồ sơ KYC
  approveKYC: (userId, data) => {
    return axiosClient.put(`/admin/users/${userId}/kyc`, data);
  },

  // ============================
  // 3. QUẢN LÝ TIN ĐĂNG (ROOMS)
  // ============================
  getPendingRooms: () => {
    return axiosClient.get('/admin/rooms/pending');
  },
  
  approveRoom: (id, approved, reason) => {
    return axiosClient.put(`/admin/rooms/${id}/approve`, { approved, reason });
  },

  // ============================
  // 4. QUẢN LÝ MASTER DATA (TIỆN ÍCH & GÓI CƯỚC)
  // ============================
  // --- Tiện ích ---
  getAllAmenities: () => axiosClient.get("/admin/amenities"),
  createAmenity: (data) => axiosClient.post("/admin/amenities", data),
  deleteAmenity: (id) => axiosClient.delete(`/admin/amenities/${id}`),

  // --- Gói dịch vụ ---
  getAllPackages: () => axiosClient.get("/admin/packages"),
  createPackage: (data) => axiosClient.post("/admin/packages", data),
  updatePackage: (id, data) => axiosClient.put(`/admin/packages/${id}`, data),
  deletePackage: (id) => axiosClient.delete(`/admin/packages/${id}`),
};

export default adminService;