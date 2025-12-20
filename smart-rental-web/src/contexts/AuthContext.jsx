import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import axiosClient from '../config/axiosClient'; // Đảm bảo bạn đã có file này

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Khi F5 trang web, kiểm tra ngay xem còn Token không
  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('role');
      const fullName = localStorage.getItem('fullName');
      const id = localStorage.getItem('userId');
      const avatar = localStorage.getItem('avatar');

      if (token && role) {
        // Nếu còn token, phục hồi lại trạng thái User
        setUser({ 
          id,
          role, 
          fullName,
          avatar 
        });
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  // 2. Hàm Đăng nhập
  const login = async (email, password) => {
    try {
      // Gọi API Backend (Controller AuthController.java)
      const res = await axiosClient.post('/auth/login', { email, password });
      
      // Dữ liệu Backend trả về: AuthResponse { token, id, email, fullName, role }
      const data = res.data;

      // Lưu vào LocalStorage (Ổ cứng trình duyệt)
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('userId', data.id);
      
      // Cập nhật State cho React biết
      setUser({ 
        id: data.id,
        role: data.role, 
        fullName: data.fullName,
        email: data.email
      });

      return true; // Báo thành công
    } catch (error) {
      console.error("Login failed:", error);
      const errorMsg = error.response?.data?.message || "Email hoặc mật khẩu không đúng!";
      message.error(errorMsg);
      return false; // Báo thất bại
    }
  };

  // 3. Hàm Đăng xuất
  const logout = () => {
    localStorage.clear(); // Xóa sạch Token
    setUser(null);
    window.location.href = '/login'; // Đá về trang login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};