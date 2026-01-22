import axiosClient from "../config/axiosClient";

const roomService = {
  // 1. Lấy danh sách phòng của chủ trọ
  getMyRooms: () => {
    return axiosClient.get('/rooms/my-rooms');
  },

  // 2. Tạo phòng mới
  createRoom: (data) => {
    return axiosClient.post('/rooms', data);
  },

  // 3. Xóa phòng
  deleteRoom: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },

  // 4. Cập nhật thông tin phòng
  updateRoom: (id, data) => {
    return axiosClient.put(`/rooms/${id}`, data);
  },

  // 5. Upload ảnh/video
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 6. Master Data
  getAllAmenities: () => axiosClient.get('/admin/amenities'),
  getAllPackages: () => axiosClient.get('/admin/packages'),

  // 7. Lấy chi tiết phòng
  getRoomById: (id) => axiosClient.get(`/rooms/${id}`),

  // =========================================================
  // 👇 8. SỬA ĐOẠN NÀY ĐỂ KHỚP VỚI BACKEND 👇
  // =========================================================
  searchRooms: (filter) => {
    return axiosClient.get('/rooms/search', {
      params: {
        lat: filter.lat,
        lng: filter.lng,
        radius: filter.radius || 50000,
        
        keyword: filter.keyword, 

        // Bổ sung thêm type để lọc (nếu backend hỗ trợ)
        type: filter.type 
      }
    });
  },

  // 9. Tìm kiếm gần đây
  searchNearby: (lat, lng, radius = 10000) => {
    return axiosClient.get("/rooms/search", {
      params: { lat, lng, radius }
    });
  },

  // Trang profile chủ trọ
  getRoomsByLandlord: (landlordId) => {
    return axiosClient.get(`/rooms/landlord/${landlordId}`);
  }
};

export default roomService;