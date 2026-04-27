import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    // Prefer student_token on explicitly student routes.
    // Fall back to student_token when staff token is absent (student portal
    // pages that call shared routes like /notifications or /push/subscribe).
    const isStudentRoute = config.url?.startsWith('/student');
    const staffToken   = localStorage.getItem("token");
    const studentToken = localStorage.getItem("student_token");

    const token = isStudentRoute
      ? studentToken                          // /student/* → always student token
      : (staffToken ?? studentToken ?? null); // others → staff first, student fallback

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors per-portal
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint =
      error.config &&
      (error.config.url?.endsWith('/login') || error.config.url?.endsWith('/student/login'));

    if (!isLoginEndpoint && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Determine which token was used for this request
      const authHeader: string = error.config?.headers?.Authorization || '';
      const usedToken = authHeader.replace('Bearer ', '');

      const staffToken   = localStorage.getItem("token");
      const studentToken = localStorage.getItem("student_token");

      if (usedToken && usedToken === studentToken) {
        // Student session expired — clear only student state
        localStorage.removeItem("student_token");
        if (window.location.pathname !== '/student/login') {
          window.location.href = "/student/login";
        }
      } else if (usedToken && usedToken === staffToken) {
        // Staff session expired — clear only staff state
        localStorage.removeItem("token");
        if (window.location.pathname !== '/staff/login') {
          window.location.href = "/staff/login";
        }
      }
      // If token doesn't match either (edge case), do nothing — avoid false logouts
    }
    return Promise.reject(error);
  }
);

export default api;
