// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';
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
import HomePage from '../pages/public/HomePage';
import SearchMap from '../pages/common/SearchMap';
import FilterPage from '../pages/common/FilterPage';
import KycVerification from '../pages/common/KycVerification';

// Tenant (Giả sử bạn có trang này, nếu chưa có thì có thể comment lại)
// import TenantSchedule from '../pages/tenant/TenantSchedule'; 

const AppRoutes = () => {
    return (
        <Routes>
            {/* ========================================================= */}
            {/* 1. PUBLIC ROUTES (Ai cũng vào được)                       */}
            {/* ========================================================= */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-landlord" element={<RegisterLandlord />} />
                
                {/* Trang tìm kiếm, chi tiết phòng (Public xem được) */}
                <Route path="/search" element={<SearchMap />} />
                <Route path="/filter" element={<FilterPage />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />
                
                {/* Route Admin Login (Tách riêng để bảo mật hơn nếu cần) */}
                <Route path="/admin/login" element={<AdminLogin />} />
            </Route>

            {/* ========================================================= */}
            {/* 2. AUTHENTICATED COMMON ROUTES (Đã login là vào được)     */}
            {/* Dành cho: TENANT, LANDLORD, ADMIN                      */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['TENANT', 'LANDLORD', 'ADMIN']} />}>
                <Route element={<MainLayout />}>
                    {/* Hồ sơ cá nhân (Quan trọng: Ai cũng có Profile) */}
                    <Route path="/profile" element={<UserProfile />} />

                    {/* Xác thực danh tính (Quan trọng: Ai cũng cần KYC) */}
                    <Route path="/kyc" element={<KycVerification />} />
                </Route>
            </Route>

            {/* ========================================================= */}
            {/* 3. TENANT ROUTES (Chỉ KHÁCH THUÊ)                         */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['TENANT']} />}>
                <Route path="/tenant" element={<MainLayout />}>
                    {/* <Route path="schedule" element={<TenantSchedule />} /> Ví dụ: Lịch hẹn của tôi */}
                    {/* Thêm các route khác của khách thuê tại đây */}
                </Route>
            </Route>

            {/* ========================================================= */}
            {/* 4. LANDLORD ROUTES (Chỉ CHỦ TRỌ)                          */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['LANDLORD']} />}>
                <Route path="/landlord" element={<MainLayout />}>
                    <Route index element={<Navigate to="room-list" />} />
                    
                    <Route path="dashboard" element={<div>Thống kê chủ trọ</div>} />
                    <Route path="create-room" element={<CreateRoom />} />
                    <Route path="room-list" element={<MyRooms />} />
                    <Route path="appointments" element={<AppointmentManagement />} />
                    <Route path="finance" element={<LandlordFinance />} />
                    
                    {/* ❌ Đừng để profile ở đây nữa */}
                </Route>
            </Route>

            {/* ========================================================= */}
            {/* 5. ADMIN ROUTES (Chỉ QUẢN TRỊ VIÊN)                       */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<MainLayout />}>
                    <Route index element={<Navigate to="approve-rooms" />} />
                    
                    <Route path="dashboard" element={<div>Trang Thống Kê</div>} />
                    <Route path="approve-rooms" element={<RoomApprove />} />
                    <Route path="master-data" element={<MasterData />} />
                    <Route path="users" element={<UserManagement />} />
                </Route>
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;