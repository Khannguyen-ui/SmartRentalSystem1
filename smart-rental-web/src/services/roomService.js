import axiosClient from "../config/axiosClient";

const roomService = {
  // Tạo phòng mới (Gửi JSON) [cite: 293]
  createRoom: (data) => {
    return axiosClient.post("/rooms", data);
  },
  
  // Lấy phòng của tôi [cite: 295]
  getMyRooms: () => {
    return axiosClient.get("/rooms/my-rooms");
  }
};

export default roomService;