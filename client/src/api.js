import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000",
});

// Her request'e token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔥 401 yakalayınca logout yapabilmek için handler
let onUnauthorized = null;

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

// Response interceptor: 401 -> otomatik çıkış
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      // token invalid/expired/missing
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (typeof onUnauthorized === "function") {
        onUnauthorized();
      }
    }

    return Promise.reject(err);
  }
);

export default api;