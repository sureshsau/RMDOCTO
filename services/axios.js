
import axios from "axios";
import { getToken } from "../utils/secureStorage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// -----------------------------
// Request Interceptor
// Attach JWT to every request
// -----------------------------
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();


    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------
// Response Interceptor
// Handle auth errors globally
// -----------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
    }
    return Promise.reject(error);
  }
);

export default api;
