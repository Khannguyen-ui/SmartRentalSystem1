import axiosClient from "../config/axiosClient";

const adminService = {
  // --- Tin đăng ---
  getPendingRooms: () => axiosClient.get('/admin/rooms/pending'),
  approveRoom: (id, approved, reason) => axiosClient.put(`/admin/rooms/${id}/approve`, { approved, reason }),

  // --- Master Data (Tiện ích & Gói cước) ---
  getAllAmenities: () => axiosClient.get("/admin/amenities"),
  createAmenity: (data) => axiosClient.post("/admin/amenities", data),
  deleteAmenity: (id) => axiosClient.delete(`/admin/amenities/${id}`),

  getAllPackages: () => axiosClient.get("/admin/packages"),
  createPackage: (data) => axiosClient.post("/admin/packages", data),
  deletePackage: (id) => axiosClient.delete(`/admin/packages/${id}`),

  // --- Quản lý User & KYC ---
  getAllUsers: () => axiosClient.get("/admin/users"), 
  approveKYC: (id, approved) => axiosClient.put(`/admin/users/${id}/kyc`, { approved }),
  toggleUserStatus: (id) => axiosClient.put(`/admin/users/${id}/status`),
};

export default adminService;