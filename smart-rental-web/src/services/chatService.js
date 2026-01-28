import axiosClient from "../config/axiosClient";

const chatService = {
  // 1. Lấy danh sách những người đã từng chat (Sidebar trái)
  getConversations: () => {
    return axiosClient.get("/chat/conversations");
  },

  // 2. Lấy lịch sử tin nhắn với một người (Main Chat)
  getChatHistory: (partnerId) => {
    return axiosClient.get(`/chat/history/${partnerId}`);
  },

  // 3. Gửi tin nhắn (Cả TEXT và IMAGE)
  // senderId sẽ được Backend lấy từ Token, bạn chỉ cần gửi receiverId
  sendMessage: (receiverId, content, type = "TEXT") => {
    return axiosClient.post("/chat/send", {
      receiverId: receiverId,
      content: content,
      type: type // Có thể là "TEXT" hoặc "IMAGE"
    });
  },

  // 4. Bắt đầu cuộc trò chuyện mới (Dùng khi nhấn "Chat ngay" ở trang chi tiết phòng)
  startConversation: (partnerId) => {
    return axiosClient.post("/chat/start", { partnerId });
  },

  // 🟢 5. Đánh dấu đã đọc (Xóa badge thông báo đỏ)
  // Khớp với @PutMapping("/mark-as-read/{partnerId}") ở Backend
  markAsRead: (partnerId) => {
    return axiosClient.put(`/chat/mark-as-read/${partnerId}`);
  }
};

export default chatService;