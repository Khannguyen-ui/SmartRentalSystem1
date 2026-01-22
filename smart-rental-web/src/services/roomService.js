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

  // 6. Master Data (Tiện ích, Gói cước)
  getAllAmenities: () => {
    return axiosClient.get('/admin/amenities');
  },
  getAllPackages: () => {
    return axiosClient.get('/admin/packages');
  },

  // 7. Lấy chi tiết phòng (Public)
  getRoomById: (id) => {
    return axiosClient.get(`/rooms/${id}`);
  },

  // 8. Tìm kiếm (Dùng cho HomePage - nhận vào object filter)
    searchRooms: (filter) => {
    return axiosClient.get('/rooms/search', {
      params: {
        lat: filter.lat,
        lng: filter.lng,
        radius: filter.radius || 50000,
       
        address: filter.keyword 
      }
    });
  },


  // 9. Tìm kiếm gần đây (FIX LỖI: Dùng cho SearchMap - nhận vào tham số rời)
  searchNearby: (lat, lng, radius = 10000) => {
    return axiosClient.get("/rooms/search", {
      params: { lat, lng, radius }
    });
  } ,
  // Trang profile chủ trọ
   getRoomsByLandlord: (landlordId) => {
    return axiosClient.get(`/rooms/landlord/${landlordId}`);
  }
};

export default roomService;