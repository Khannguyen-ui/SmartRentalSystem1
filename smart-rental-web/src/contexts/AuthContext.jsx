import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import axiosClient from '../config/axiosClient';

// --- THAY ĐỔI: Thêm chữ 'export' vào đây để file hook bên ngoài dùng được ---
export const AuthContext = createContext(null);
// --------------------------------------------------------------------------

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login F5
  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('role');
      const fullName = localStorage.getItem('fullName');
      const id = localStorage.getItem('userId');
      const email = localStorage.getItem('email');

      if (token && role) {
        setUser({ id, role, fullName, email });
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
      
      setUser({ 
        id: data.id,
        role: data.role, 
        fullName: data.fullName,
        email: data.email
      });
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};