import axiosClient from "../config/axiosClient";

const chatService = {
  // 1. Lấy danh sách những người đã từng chat (Sidebar trái)
  getConversations: async () => {
    return await axiosClient.get("/chat/conversations");
  },

  // 2. Lấy lịch sử tin nhắn với một người (Main Chat)
  getChatHistory: async (userId) => {
    return await axiosClient.get(`/chat/history/${userId}`);
  },

  // 3. Gửi tin nhắn HTTP (Fallback nếu không dùng socket hoặc gửi ảnh sau này)
  sendMessage: async (receiverId, content) => {
    return await axiosClient.post("/chat/send", {
      receiverId: receiverId,
      content: content,
      type: "TEXT"
    });
  },

  // --- [MỚI] 4. Bắt đầu cuộc trò chuyện (Dùng cho nút "Chat ngay" ở trang Room Detail) ---
  // API này gọi đến endpoint @PostMapping("/start") ở Backend
  startConversation: async (partnerId) => {
    return await axiosClient.post("/chat/start", {
      partnerId: partnerId
    });
  },

  // --- [TÙY CHỌN] 5. Đánh dấu đã đọc (Nếu muốn xử lý badge thông báo) ---
  // Bạn có thể thêm API này ở backend sau nếu muốn làm tính năng "Đã xem"
  markAsRead: async (partnerId) => {
    // return await axiosClient.put(`/chat/read/${partnerId}`);
  }
};

export default chatService;