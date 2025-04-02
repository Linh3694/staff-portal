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

    try {
      const decoded = jwtDecode(token);
      const userRole = decoded.role;
      if (!userRole) throw new Error("Token không chứa role.");

      localStorage.setItem("authToken", token);
      localStorage.setItem("role", userRole);

      // Kiểm tra nếu user đến từ mobile
      const isMobile = params.get("mobile") === "true";

      if (isMobile) {
        // Nếu từ mobile, điều hướng về deep link
        setTimeout(() => {
          window.location.replace(`360wisers://auth-callback?token=${token}`);
        }, 1000);
      } else {
        // Nếu từ web, điều hướng bình thường
        if (
          ["admin", "superadmin", "technical", "marcom", "hr", "bos"].includes(
            userRole
          )
        ) {
          navigate("/dashboard");
        } else {
          navigate("/not-authorized");
        }
      }
    } catch (error) {
      console.error("Lỗi decode token:", error);
      navigate("/login");
    }
  }, [navigate]);

  return <div>Đang xác thực Microsoft, vui lòng chờ...</div>;
}

export default MicrosoftAuthSuccess;
