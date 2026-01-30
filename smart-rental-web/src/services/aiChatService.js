import axiosClient from "../config/axiosClient";

export const askAI = async (question) => {
  try {
    const response = await axiosClient.post('/ai/chat', { question });
    return response.data.answer;
  } catch (error) {
    console.error("Lỗi AI Service:", error.response?.data || error.message);
    throw error;
  }
};