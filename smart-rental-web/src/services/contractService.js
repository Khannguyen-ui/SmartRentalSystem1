import axios from "../config/axiosConfig"; // Hoặc đường dẫn tới file cấu hình axios của bạn

const CONTRACT_API_URL = "/api/contracts";

const contractService = {
  /**
   * Tạo hợp đồng mới
   * Endpoint: POST /api/contracts
   * @param {Object} data - Dữ liệu khớp với ContractCreateDTO backend
   */
  createContract: async (data) => {
    // data structure expected:
    // {
    //   roomId: number,
    //   tenantEmail: string,
    //   startDate: "YYYY-MM-DD",
    //   endDate: "YYYY-MM-DD",
    //   monthlyRent: number,
    //   depositAmount: number,
    //   electricPrice: number,
    //   waterPrice: number,
    //   serviceFees: [ { name: string, price: number, unit: string } ]
    // }
    const response = await axios.post(CONTRACT_API_URL, data);
    return response.data;
  },

  /**
   * Xuất file PDF hợp đồng
   * Endpoint: GET /api/contracts/{id}/pdf
   * @param {number} id - ID của hợp đồng
   */
  exportContractPdf: async (id) => {
    const response = await axios.get(`${CONTRACT_API_URL}/${id}/pdf`, {
      responseType: "blob", // Quan trọng: Để nhận dữ liệu file binary
    });

    // Xử lý download file ngay tại trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contract_${id}.pdf`); // Tên file khi tải về
    document.body.appendChild(link);
    link.click();
    link.remove(); // Dọn dẹp
    window.URL.revokeObjectURL(url);
    
    return true;
  },
  
  // LƯU Ý: Backend hiện tại trong file ContractController.java 
  // CHƯA CÓ API lấy danh sách hợp đồng (GET). 
  // Nếu bạn thêm API đó ở backend, hãy thêm hàm này vào frontend:
  /*
  getMyContracts: async () => {
     const response = await axios.get(`${CONTRACT_API_URL}/my-contracts`);
     return response.data;
  }
  */
};

export default contractService;