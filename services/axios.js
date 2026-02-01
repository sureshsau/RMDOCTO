import axios from "axios";
import { getToken } from "../utils/secureStorage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------------
// REQUEST INTERCEPTOR
// ONLY SHOW API URL
// -----------------------------
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    const fullUrl = `${config.baseURL}${config.url}`;


    console.log("➡️ API URL:", fullUrl);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------
// RESPONSE INTERCEPTOR
// NO TOASTS HERE
// -----------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // just log for debugging
    console.log(
      "❌ API ERROR:",
      error.message,
      error.config?.url
    );
    return Promise.reject(error);
  }
);

export default api;
