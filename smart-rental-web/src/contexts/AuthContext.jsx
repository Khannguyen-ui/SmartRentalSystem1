import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import axiosClient from '../config/axiosClient';
// 1. IMPORT SERVICE ĐỂ GỌI API PROFILE
import userService from '../services/userService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. THÊM HÀM LẤY LẠI THÔNG TIN USER TỪ SERVER
  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Gọi API /users/profile để lấy dữ liệu mới nhất (KYC, Ví, ...)
        const res = await userService.getProfile();
        setUser(res.data); 
      }
    } catch (error) {
      console.error("Không thể tải thông tin user mới nhất:", error);
    }
  };

  // Check login F5
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // Thay vì chỉ lấy từ localStorage (dữ liệu cũ), ta gọi API lấy dữ liệu mới luôn
        await refreshProfile();
      }
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

      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('userId', data.id);
      localStorage.setItem('email', data.email);
      
      // Gọi refreshProfile để đảm bảo state user có đủ mọi trường (kycStatus, walletBalance...)
      // thay vì chỉ vài trường cơ bản trả về lúc login
      await refreshProfile();
      
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      const errorMsg = error.response?.data?.message || "Lỗi đăng nhập";
      message.error(errorMsg);
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    // 3. ĐƯA refreshProfile VÀO ĐÂY ĐỂ BÊN NGOÀI DÙNG ĐƯỢC
    <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};