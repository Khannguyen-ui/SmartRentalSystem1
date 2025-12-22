import axiosClient from "../config/axiosClient";

const billService = {
  createBill: (data) => axiosClient.post("/bills", data),
};

export default billService;