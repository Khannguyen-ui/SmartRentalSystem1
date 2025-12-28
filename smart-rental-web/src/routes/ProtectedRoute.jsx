import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
      return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
  }
  
  // Chưa đăng nhập -> Đá về Login
  if (!user) return <Navigate to="/login" replace />;

  // Sai quyền -> Đá về 403 hoặc Login (Hiện tại bạn đá về login)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;