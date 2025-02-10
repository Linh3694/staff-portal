import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function MicrosoftAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      console.error("Không tìm thấy token trong URL.");
      navigate("/login");
      return;
    }

    localStorage.setItem("authToken", token);

    try {
      const decoded = jwtDecode(token);
      console.log("Payload của token:", decoded); // Kiểm tra lại payload

      const userRole = decoded.role; // Lấy role từ token
      if (!userRole) {
        throw new Error("Token không chứa role.");
      }

      // Lưu role vào localStorage
      localStorage.setItem("role", userRole);

      // Kiểm tra role và điều hướng
      if (["admin", "superadmin", "technical"].includes(userRole)) {
        navigate("/dashboard");
      } else {
        console.error("Sai role không vào được");
        navigate("/not-authorized");
      }
    } catch (error) {
      console.error("Lỗi decode token:", error);
      navigate("/login");
    }
  }, [navigate]);

  return <div>Đang xác thực Microsoft, vui lòng chờ...</div>;
}

export default MicrosoftAuthSuccess;