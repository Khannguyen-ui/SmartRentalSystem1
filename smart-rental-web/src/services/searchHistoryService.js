import axios from 'axios';

const API_URL = 'http://localhost:8080/api/search-history'; // Thay đổi port nếu cần

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const searchHistoryService = {
    // Lấy danh sách lịch sử
    getMyHistory: () => {
        return axios.get(API_URL, { headers: getAuthHeader() });
    },

    // Xóa 1 dòng lịch sử
    deleteHistory: (id) => {
        return axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    },

    // Xóa tất cả
    clearAll: () => {
        return axios.delete(`${API_URL}/all`, { headers: getAuthHeader() });
    }
};

export default searchHistoryService;