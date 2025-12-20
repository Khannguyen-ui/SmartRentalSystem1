import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';

// Import các trang
import Login from './pages/auth/Login';
import RoomApprove from './pages/admin/RoomApprove';
import CreateRoom from './pages/landlord/CreateRoom';

// Import Layout và Auth
import MainLayout from './components/layout/MainLayout';
import useAuth from './hooks/useAuth';
import RegisterLandlord from './pages/auth/RegisterLandlord';
import MasterData from './pages/admin/MasterData';
import MyRooms from './pages/landlord/MyRooms';
import UserManagement from './pages/admin/UserManagement';

// --- COMPONENT BẢO VỆ ROUTE (Chỉ cho phép đúng quyền truy cập) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // 1. Đang tải thông tin user từ localStorage -> Hiện loading
  if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;

  // 2. Chưa đăng nhập -> Đá về trang Login
  if (!user) return <Navigate to="/login" replace />;

  // 3. Đăng nhập rồi nhưng sai quyền -> Đá về trang Login (hoặc trang 403)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // 4. Hợp lệ -> Cho phép hiển thị nội dung bên trong (Outlet)
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Công khai */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-landlord" element={<RegisterLandlord />} />
        
        {/* Mặc định vào trang chủ sẽ nhảy tới login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* --- KHU VỰC ADMIN (Bọc bởi MainLayout) --- */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<MainLayout />}>
            {/* Mặc định vào /admin sẽ nhảy tới trang duyệt tin */}
            <Route index element={<Navigate to="approve-rooms" />} />
            
            <Route path="dashboard" element={<div>Trang Thống Kê (Đang phát triển)</div>} />
            <Route path="approve-rooms" element={<RoomApprove />} />
            <Route path="master-data" element={<MasterData />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* --- KHU VỰC CHỦ TRỌ (Bọc bởi MainLayout) --- */}
        <Route element={<ProtectedRoute allowedRoles={['LANDLORD']} />}>
          <Route path="/landlord" element={<MainLayout />}>
             {/* Mặc định vào /landlord sẽ nhảy tới trang đăng phòng */}
            <Route index element={<Navigate to="create-room" />} />

            <Route path="dashboard" element={<div>Thống kê chủ trọ (Đang phát triển)</div>} />
            <Route path="create-room" element={<CreateRoom />} />
            <Route path="rooms" element={<MyRooms />}/>
          </Route>
        </Route>

        {/* Route không tồn tại -> Quay về login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;