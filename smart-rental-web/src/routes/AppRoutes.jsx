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
import RoomDetail from '../pages/common/RoomDetail';
import LandlordFinance from '../pages/landlord/LandlordFinance';
import CustomerManagement from '../pages/landlord/CustomerManagement';
import LandlordDashboard from '../pages/landlord/LandlordDashboard';

// Common
import UserProfile from '../pages/common/UserProfile';
import NotFound from '../pages/common/NotFound';
import HomePage from '../pages/public/HomePage';
import SearchMap from '../pages/common/SearchMap';
import FilterPage from '../pages/common/FilterPage';
import KycVerification from '../pages/common/KycVerification';
import NotificationPage from '../pages/common/NotificationPage';
import LandlordProfile from '../pages/common/LandlordProfile';

// --- [MỚI] IMPORT TRANG CHAT ---
import ChatPage from '../pages/common/ChatPage';
import PaymentSuccess from '../pages/common/PaymentSuccess';
import PaymentFailed from '../pages/common/PaymentFailed';
import LandlordVIP from '../pages/landlord/LandlordVIP';
import VIPServicePage from '../pages/landlord/LandlordVIP';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

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
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Trang tìm kiếm, chi tiết phòng (Public xem được) */}
                <Route path="/search" element={<SearchMap />} />
                <Route path="/filter" element={<FilterPage />} />
                <Route path="/users/public-profile/:id" element={<LandlordProfile />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />

                <Route path="/admin/login" element={<AdminLogin />} />
            </Route>

            {/* ========================================================= */}
            {/* 2. AUTHENTICATED COMMON ROUTES (Đã login là vào được)     */}
            {/* Dành cho: TENANT, LANDLORD, ADMIN                      */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['TENANT', 'LANDLORD', 'ADMIN']} />}>
                <Route element={<MainLayout />}>
                    {/* Hồ sơ cá nhân */}
                    <Route path="/profile" element={<UserProfile />} />

                    {/* Xác thực danh tính */}
                    <Route path="/kyc" element={<KycVerification />} />

                    {/* Trang Thông báo */}
                    <Route path="/notifications" element={<NotificationPage />} />
                    <Route path="/payment-failed" element={<PaymentFailed />} />
                    {/* --- [MỚI] TRANG TIN NHẮN (Dùng chung cho Tenant & Landlord) --- */}
                    <Route path="/messages" element={<ChatPage />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                </Route>
            </Route>

            {/* ========================================================= */}
            {/* 3. TENANT ROUTES (Chỉ KHÁCH THUÊ)                         */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['TENANT']} />}>
                <Route path="/tenant" element={<MainLayout />}>
                    {/* Quản lý lịch hẹn */}
                    <Route path="appointments" element={<AppointmentManagement />} />
                </Route>
            </Route>

            {/* ========================================================= */}
            {/* 4. LANDLORD ROUTES (Chỉ CHỦ TRỌ)                          */}
            {/* ========================================================= */}
            <Route element={<ProtectedRoute allowedRoles={['LANDLORD']} />}>
                <Route path="/landlord" element={<MainLayout />}>
                    <Route index element={<Navigate to="room-list" />} />

                    <Route path="dashboard" element={<LandlordDashboard />} />
                    <Route path="create-room" element={<CreateRoom />} />
                    <Route path="room-list" element={<MyRooms />} />
                    <Route path="appointments" element={<AppointmentManagement />} />
                    <Route path="customers" element={<CustomerManagement />} />
                    <Route path="finance" element={<LandlordFinance />} />
                    <Route path="vip-packages" element={<VIPServicePage />} />
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