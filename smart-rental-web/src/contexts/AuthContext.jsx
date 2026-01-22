import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import axiosClient from '../config/axiosClient';
import userService from '../services/userService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- HÀM LOGOUT (Đưa lên trên để refreshProfile gọi được) ---
  const logout = () => {
    localStorage.clear(); // Xóa sạch token cũ
    setUser(null);
    // Tùy chọn: Chuyển hướng về trang login nếu cần
    // window.location.href = '/login'; 
  };

  // --- 1. SỬA HÀM refreshProfile ---
  const refreshProfile = async () => {
    const token = localStorage.getItem('accessToken');
    
    // Nếu không có token thì thôi, không gọi API làm gì
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      // Gọi API lấy thông tin mới nhất
      const res = await userService.getProfile();
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi tải thông tin user:", error);

      // QUAN TRỌNG: Nếu Token hết hạn (401) hoặc bị cấm (403) -> Xóa ngay lập tức
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout(); 
      }
    }
  };

  // --- 2. useEffect CHECK LOGIN KHI F5 ---
  useEffect(() => {
    const checkLogin = async () => {
      // Gọi hàm refreshProfile ở trên, nó đã bao gồm logic check token rồi
      await refreshProfile();
      setLoading(false);
    };
    checkLogin();
  }, []);

  const login = async (email, password) => {
    try {
      const cleanEmail = email.trim();
      const res = await axiosClient.post('/auth/login', { 
        email: cleanEmail, 
        password: password 
      });
      const data = res.data;

      // Lưu các thông tin cần thiết
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('userId', data.id);
      localStorage.setItem('email', data.email);
      
      // Lấy lại dữ liệu đầy đủ
      await refreshProfile();
      
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      const errorMsg = error.response?.data?.message || "Lỗi đăng nhập";
      message.error(errorMsg);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};