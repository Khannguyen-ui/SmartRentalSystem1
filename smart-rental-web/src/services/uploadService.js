import axiosClient from "../config/axiosClient";

const uploadService = {
  // Upload 1 file và trả về URL
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Gọi API: POST /api/upload 
    const response = await axiosClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.url; 
  }
};

export default uploadService;