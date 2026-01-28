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

  // Tin có video
  getVideoRooms: (params) => {
    return axiosClient.get('/rooms/videos', {
      params: {
        page: params?.page || 0,
        size: params?.size || 4
      }
    });
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
  getAllAmenities: () => axiosClient.get('/admin/master-data/amenities'),
  getAllPackages: () => axiosClient.get('/admin/master-data/packages'),

  // 7. Lấy chi tiết phòng
  getRoomById: (id) => axiosClient.get(`/rooms/${id}`),

  // 🟢 8. TÌM KIẾM NÂNG CAO (Đã sửa: Nhận đúng params từ FilterPage)
  searchRooms: (params) => {
    return axiosClient.get('/rooms/search', {
      params: params 
    });
  },

  // 9. Tìm kiếm gần đây (Đơn giản)
  searchNearby: (lat, lng, radius = 10000) => {
    return axiosClient.get("/rooms/search", {
      params: { lat, lng, radius }
    });
  },

  // Trang profile chủ trọ
  getRoomsByLandlord: (landlordId) => {
    return axiosClient.get(`/rooms/landlord/${landlordId}`);
  },

  // Giá khu vực
  getPriceHistory: (id) => {
    return axiosClient.get(`/rooms/${id}/price-history`);
  },

  // 10. Nâng cấp gói
  upgradeRoomPackage: (roomId, packageId) => {
    return axiosClient.post(`/rooms/${roomId}/upgrade`, {
      servicePackageId: packageId
    });
  },
  purchasePackage: (packageId) => {
    return axiosClient.post('/transactions/purchase-package', packageId);
  },

  // 11. Đẩy tin
  pushRoom: (roomId, packageId) => {
    return axiosClient.post(`/rooms/${roomId}/push`, null, {
      params: { packageId }
    });
  },

  // 12. Cập nhật trạng thái
  updateRoomStatus: (roomId, status) => {
    return axiosClient.put(`/rooms/${roomId}/status`, null, {
      params: { status }
    });
  },

  // 13. Auto renew
  toggleAutoRenew: (roomId, enable) => {
    return axiosClient.put(`/rooms/${roomId}/auto-renew`, null, {
      params: { enable }
    });
  }
};

export default roomService;