import axiosClient from "../config/axiosClient";

const paymentService = {
  // 1. Lấy thông tin Ví + Profile (Gọi vào UserController)
  // Backend: GET /api/users/profile
  getMyWallet: () => {
    return axiosClient.get('/users/profile');
  },

  // 2. Lấy lịch sử giao dịch (Gọi vào TransactionController)
  // Backend: GET /api/transactions/my-history
  getMyHistory: () => {
    return axiosClient.get('/transactions/my-history');
  },

  // 3. Tạo link thanh toán VNPay (Gọi vào PaymentController)
  // Backend: POST /api/payment/create-payment
  createPaymentUrl: (amount, userId) => {
    // Lưu ý: userId gửi lên để Backend biết nạp cho ai (dù Backend có thể lấy từ Token, nhưng gửi thêm cho chắc chắn theo logic cũ)
    return axiosClient.post(`/payment/create-payment?amount=${amount}&userId=${userId}`);
  }
};

export default paymentService;  