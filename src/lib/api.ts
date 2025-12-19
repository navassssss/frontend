import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.118:8000/api",
});

api.interceptors.request.use(
  (config) => {
    // Check for student token first, then staff token
    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
