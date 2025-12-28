// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// --- IMPORTS CÁC TRANG ---
// Auth
import Login from '../pages/auth/Login';
import RegisterLandlord from '../pages/auth/RegisterLandlord';

// Admin
import RoomApprove from '../pages/admin/RoomApprove';
import MasterData from '../pages/admin/MasterData';
import UserManagement from '../pages/admin/UserManagement';

// Landlord
import CreateRoom from '../pages/landlord/CreateRoom';
import MyRooms from '../pages/landlord/MyRooms';
import AppointmentManagement from '../pages/landlord/AppointmentManagement';
import RoomDetail from '../pages/landlord/RoomDetail';
import LandlordFinance from '../pages/landlord/LandlordFinance';

// Common
import UserProfile from '../pages/common/UserProfile';
import NotFound from '../pages/common/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-landlord" element={<RegisterLandlord />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      
      {/* Mặc định vào trang chủ sẽ nhảy tới login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* --- AUTHENTICATED ROUTES (Có MainLayout) --- */}
      
      {/* 1. Route chung cho mọi User đã đăng nhập (Profile) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LANDLORD', 'TENANT']} />}>
        <Route path="/" element={<MainLayout />}>
           <Route path="profile" element={<UserProfile />} /> 
        </Route>
      </Route>

      {/* 2. Khu vực ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<Navigate to="approve-rooms" />} />
          <Route path="dashboard" element={<div>Trang Thống Kê (Đang phát triển)</div>} />
          <Route path="approve-rooms" element={<RoomApprove />} />
          <Route path="master-data" element={<MasterData />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* 3. Khu vực LANDLORD */}
      <Route element={<ProtectedRoute allowedRoles={['LANDLORD']} />}>
        <Route path="/landlord" element={<MainLayout />}>
          <Route index element={<Navigate to="create-room" />} />
          <Route path="dashboard" element={<div>Thống kê chủ trọ (Đang phát triển)</div>} />
          <Route path="create-room" element={<CreateRoom />} />
          <Route path="rooms" element={<MyRooms />} />
          <Route path="appointments" element={<AppointmentManagement />} />
          <Route path="finance" element={<LandlordFinance />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound/>} />
    </Routes>
  );
};

export default AppRoutes;