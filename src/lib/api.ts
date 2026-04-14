import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    // Isolate tokens based on route
    const isStudentRoute = config.url?.startsWith('/student');
    const token = isStudentRoute 
      ? localStorage.getItem("student_token") 
      : localStorage.getItem("token");
      
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
    // Skip the hard redirect if the failed request was a login attempt
    const isLoginEndpoint = 
      error.config && 
      (error.config.url?.endsWith('/login') || error.config.url?.endsWith('/student/login'));

    // Handle 401 Unauthorized or 403 Forbidden
    if (!isLoginEndpoint && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear tokens
      localStorage.removeItem("token");
      localStorage.removeItem("student_token");

      // Redirect to login page (root path)
      if (window.location.pathname !== '/' && window.location.pathname !== '/student/login') {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
