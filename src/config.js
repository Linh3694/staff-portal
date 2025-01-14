// src/config.js

// Lấy biến từ ENV (CRA yêu cầu prefix REACT_APP_)
// Nếu biến chưa được set, có thể gán giá trị mặc định (fallback) tùy ý.
export const API_URL = process.env.REACT_APP_API_URL || "https://staff-portal.wellspring.edu.vn/api";
export const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || "https://staff-portal.wellspring.edu.vn/uploads";