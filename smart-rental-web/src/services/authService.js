import axiosClient from "../config/axiosClient";

const authService = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  // Hàm đăng ký
  register: (data) => {
    // Backend yêu cầu: fullName, email, password, phone, role
    return axiosClient.post('/auth/register', data);
  },

  // 🟢 Gửi yêu cầu quên mật khẩu (nhận vào email)
  forgotPassword: (email) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  // 🟢 Đặt lại mật khẩu mới
  resetPassword: (data) => {
    // data truyền vào từ ResetPassword.jsx bao gồm: { token, newPassword }
    return axiosClient.post('/auth/reset-password', data);
  }
};

export default authService;