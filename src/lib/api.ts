import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized or 403 Forbidden
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear tokens
      localStorage.removeItem("token");
      localStorage.removeItem("student_token");

      // Redirect to login page (root path)
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
