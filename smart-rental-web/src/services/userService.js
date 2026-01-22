import axiosClient from "../config/axiosClient";

const userService = {
  // ============================
  // 1. THÔNG TIN CÁ NHÂN (PROFILE)
  // ============================
  // Lấy thông tin chính mình
  getProfile: () => {
    return axiosClient.get('/users/profile');
  },

  // Cập nhật thông tin chính mình
  updateProfile: (data) => {
    return axiosClient.put('/users/profile', data);
  },

  // Nâng cấp tài khoản lên chủ trọ
  upgradeToLandlord: () => {
    return axiosClient.post('/users/upgrade');
  },

  // ============================
  // 2. XÁC MINH DANH TÍNH (KYC)
  // ============================
  // Upload file ảnh (Lên Cloudinary)
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Trích xuất thông tin CCCD (OCR/FPT.AI)
  extractIdCard: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/users/extract-id-card', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Gửi hồ sơ KYC để chờ duyệt
  submitKyc: (data) => {
    return axiosClient.post('/users/kyc', data);
  },

  // ============================
  // 3. CÔNG KHAI (PUBLIC)
  // ============================
  // Lấy danh sách chủ trọ tiêu biểu
  getTopLandlords: (lat, lng, radius = 20000) => {
    return axiosClient.get('/users/top-landlords', { 
        params: { lat, lng, radius } 
    });
  },
  getLandlordPublicProfile: (id) => {
    return axiosClient.get(`/users/public-profile/${id}`);
  },
  
 
  getLandlordRooms: (id) => {
    return axiosClient.get(`/rooms/landlord/${id}`); 
  },
  getMe: () => {
    return axiosClient.get('/users/profile'); // Gọi đến API lấy thông tin cá nhân
},

};

export default userService;