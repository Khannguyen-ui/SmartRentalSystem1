// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// --- IMPORTS CÁC TRANG ---
// Auth
import Login from '../pages/auth/Login';
import AdminLogin from '../pages/auth/AdminLogin';
import RegisterLandlord from '../pages/auth/RegisterLandlord';
import Register from '../pages/auth/Register';

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
import PublicLayout from '../components/layout/PublicLayout';
import HomePage from '../pages/public/HomePage';
import SearchMap from '../pages/common/SearchMap';
import FilterPage from '../pages/common/FilterPage';
// 1. IMPORT TRANG KYC
import KycVerification from '../pages/common/KycVerification';

const AppRoutes = () => {
    return (
        <Routes>
            {/* 1. ROUTE DÀNH RIÊNG CHO ADMIN LOGIN */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* 2. PUBLIC ROUTES */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                
                {/* --- 2. SỬA LẠI PHẦN ĐĂNG KÝ (TRÁNH TRÙNG PATH) --- */}
                <Route path="/register" element={<Register />} /> {/* Đăng ký người thuê */}
                <Route path="/register-landlord" element={<RegisterLandlord />} /> {/* Đăng ký chủ trọ */}
                {/* -------------------------------------------------- */}

                <Route path="/rooms/:id" element={<RoomDetail />} />
                <Route path="/search" element={<SearchMap />} />
                <Route path="/filter" element={<FilterPage />} />
            </Route>

            {/* --- AUTHENTICATED ROUTES --- */}

            {/* 1. Route chung (Profile, KYC) - Dành cho tất cả user đã đăng nhập */}
            <Route element={<ProtectedRoute allowedRoles={['LANDLORD', 'TENANT']} />}>
                <Route path="/" element={<MainLayout />}>
                    <Route path="profile" element={<UserProfile />} />
                    
                    {/* 3. THÊM ROUTE KYC VÀO ĐÂY */}
                    <Route path="kyc" element={<KycVerification />} />
                    
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
                    {/* Điều hướng mặc định về danh sách tin */}
                    <Route index element={<Navigate to="room-list" />} />

                    <Route path="dashboard" element={<div>Thống kê chủ trọ (Đang phát triển)</div>} />
                    <Route path="create-room" element={<CreateRoom />} />

                    {/* Danh sách tin đăng */}
                    <Route path="room-list" element={<MyRooms />} />

                    <Route path="appointments" element={<AppointmentManagement />} />
                    <Route path="finance" element={<LandlordFinance />} />
                </Route>
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;