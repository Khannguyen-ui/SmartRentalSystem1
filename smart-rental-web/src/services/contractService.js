import axiosClient from "../config/axiosClient";

const contractService = {
  createContract: (data) => axiosClient.post("/contracts", data),
  // Lấy danh sách hợp đồng (Backend cần bổ sung API getByLandlordId nếu chưa có, tạm thời dùng logic filter ở FE nếu cần)
  getMyContracts: () => axiosClient.get("/contracts/my-contracts"), // Giả định API
};

export default contractService;