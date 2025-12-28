import axios from 'axios';

const axiosClient = axios.create({
  // Đường dẫn đến Backend AWS EC2
  baseURL: 'http://localhost:8080/api',      
  // baseURL: 'http://18.142.105.8:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào Header mỗi khi gọi API
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Xử lý lỗi trả về (Ví dụ: Hết hạn token thì đá ra login)
axiosClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  // Nếu lỗi 401 (Unauthorized) -> Có thể token hết hạn -> Logout
  if (error.response && error.response.status === 401) {
    // localStorage.clear();
    // window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default axiosClient;