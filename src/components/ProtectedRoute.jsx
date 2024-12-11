import React from "react";
import { Navigate } from "react-router-dom";

const validateToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now(); // Kiểm tra thời hạn token
  } catch (error) {
    console.error("Token không hợp lệ:", error);
    return false;
  }
};

const ProtectedRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");

  console.log("Kiểm tra ProtectedRoute:");
  console.log("Token:", token);
  console.log("Vai trò:", role);

  if (!token || !validateToken(token)) {
    console.warn("Token không hợp lệ hoặc đã hết hạn. Chuyển về /login");
    return <Navigate to="/login" />;
  }

  if (roleRequired && role !== roleRequired) {
    console.warn(`Vai trò không hợp lệ. Chuyển về /login`);
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;