import axios from "axios";
import { getToken } from "../utils/secureStorage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 20000,
});

/* ================= REQUEST ================= */

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔥 CRITICAL FIX
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    console.log("➡️ API URL:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE ================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      "❌ API ERROR:",
      error.message,
      error.config?.url
    );
    return Promise.reject(error);
  }
);

export default api;
