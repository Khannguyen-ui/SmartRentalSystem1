import axiosClient from "../config/axiosClient";

const authService = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  // Thêm hàm đăng ký
  register: (data) => {
    // Backend yêu cầu: fullName, email, password, phone, role
    return axiosClient.post('/auth/register', data);
  }
};

export default authService;