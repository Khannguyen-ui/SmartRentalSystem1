import { useContext } from 'react';
// Import Context mà chúng ta vừa export ở Bước 1
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  // Lấy dữ liệu từ Context
  return useContext(AuthContext);
};

// Export Default để bên ngoài import dễ dàng
export default useAuth;