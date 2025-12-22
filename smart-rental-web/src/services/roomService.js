import axiosClient from "../config/axiosClient";

const roomService = {
  // 1. Lấy danh sách phòng của chủ trọ đang đăng nhập
  getMyRooms: () => {
    return axiosClient.get('/rooms/my-rooms');
  },

  // 2. Tạo phòng mới (Form có upload ảnh)
  createRoom: (data) => {
    return axiosClient.post('/rooms', data);
  },

  // 3. Xóa phòng
  deleteRoom: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },
  // 4. Cập nhật thông tin phòng (MỚI THÊM)
  updateRoom: (id, data) => {
    // Method PUT thường dùng để update
    return axiosClient.put(`/rooms/${id}`, data);
  },

  // 4. Upload ảnh (Gọi API FileUploadController)
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
    getAllAmenities: () => {
    return axiosClient.get('/admin/amenities');
  },

  // Lấy danh sách gói cước từ Backend
  getAllPackages: () => {
    return axiosClient.get('/admin/packages');
  },
  getRoomById: (id) => {
    return axiosClient.get(`/rooms/${id}`);
  },
  
};

export default roomService;