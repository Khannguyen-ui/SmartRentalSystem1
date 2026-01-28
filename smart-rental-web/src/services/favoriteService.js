import axiosClient from "../config/axiosClient";

const favoriteService = {
    // Gọi đến @PostMapping("/{roomId}") trong FavoriteController
    toggleFavorite: (roomId) => {
        return axiosClient.post(`/favorites/${roomId}`);
    },

    // Gọi đến @GetMapping("/check/{roomId}")
    checkStatus: (roomId) => {
        return axiosClient.get(`/favorites/check/${roomId}`);
    },

    // Lấy danh sách tin đã lưu
    getMyFavorites: () => {
        return axiosClient.get('/favorites');
    }
};

export default favoriteService;