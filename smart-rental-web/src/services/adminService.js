import axiosClient from "../config/axiosClient";

const adminService = {
  // Lấy danh sách phòng chờ duyệt [cite: 622]
  // Backend chưa có API riêng cho getPendingRooms public ra Controller, 
  // ta dùng API search hoặc filter nếu backend hỗ trợ. 
  // Tạm thời giả định bạn sẽ dùng endpoint search với status=PENDING
  getPendingRooms: () => {
    // Lưu ý: Cần đảm bảo Backend RoomController có hỗ trợ filter status
    // Nếu chưa, hãy dùng API get all và filter phía client tạm thời
    return axiosClient.get("/rooms/search?status=PENDING"); 
  },

  // Duyệt hoặc Từ chối phòng [cite: 211]
  approveRoom: (roomId, isApproved, reason = "") => {
    return axiosClient.put(`/admin/rooms/${roomId}/approve`, {
      approved: isApproved, // [cite: 315]
      reason: reason
    });
  },
  
  // Lấy danh sách gói dịch vụ để chủ trọ chọn [cite: 219]
  getAllPackages: () => axiosClient.get("/admin/packages"),
  
  // Lấy tiện ích [cite: 216]
  getAllAmenities: () => axiosClient.get("/admin/amenities"),
};

export default adminService;