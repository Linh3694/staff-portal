import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../config"; // import từ file config
import { ReactTyped } from "react-typed";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const LoginAdmission = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy đường dẫn chuyển hướng sau khi đăng nhập
  const from = location.state?.from?.pathname || "/admission";

  // **Đăng nhập với Microsoft** - Chuyển hướng sang server
  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/auth/microsoft?admission=true`;
  };
  const handleGoogleLogin = () => {};

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate email and password
    if (!email) {
      setError("Vui lòng nhập email!");
      return;
    }
    if (!email.includes("@")) {
      setError("Email không hợp lệ. Vui lòng kiểm tra.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu!");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0].msg);
        } else {
          setError(data.message || "Đăng nhập thất bại!");
        }
      } else {
        // Lưu token và phiên đăng nhập đặc biệt cho trang admission
        localStorage.setItem("admissionAuth", "true");
        localStorage.setItem("admissionToken", data.token);
        
        // Nếu người dùng có role là admin hoặc admission, lưu thông tin này
        if (data.user && (data.user.role === "admin" || data.user.role === "admission")) {
          localStorage.setItem("admissionRole", data.user.role);
        }
        
        toast.success("Đăng nhập thành công!");
        // Chuyển hướng đến trang admission
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau!");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-hidden "
      style={{
        background: "linear-gradient(to bottom, #F1F2E9 0%, #F5F1CD 100%)",
      }}
    >
      <div className="h-full w-full my-auto flex flex-row">
        {/* Cột bên trái: Form đăng nhập */}
        <div className="lg:w-1/2 w-full flex flex-col justify-center items-center relative">
          <h2 className="lg:text-4xl text-3xl font-bold mb-10 text-center">
            <ReactTyped
              strings={["Đăng nhập để xem trang tuyển sinh..."]}
              typeSpeed={35}
              backSpeed={30}
              showCursor={true}
              cursorChar="|"
            />
          </h2>
          <div className="lg:w-[60%] w-full max-w-[450px] mx-auto px-10 lg:px-0">
            <div className="mb-4">
              <label className="text-left block font-medium mb-2 text-[#757575]">
                Tên đăng nhập
              </label>
              <input
                type="text"
                placeholder="email@wellspring.edu.vn"
                className="w-full h-[5vh] border-none rounded-full p-2 text-sm px-4 shadow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="text-left block font-medium mb-2 text-[#757575]">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="**********"
                className="w-full h-[5vh] border-none rounded-full p-2 text-sm px-4 shadow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-[#002855] text-white py-3 font-bold rounded-full hover:bg-[#1a3a5e] transition-all"
            >
              Đăng nhập
            </button>

            {error && <div className="text-sm mb-4 text-red-500">{error}</div>}

            <div className="flex items-center my-8 w-full">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="mx-4 text-gray-500 text-sm font-medium">
                Đăng nhập với phương thức khác
              </span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            <div className="flex flex-row justify-between gap-4">
              <button
                onClick={handleGoogleLogin}
                className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded-full hover:bg-[#002855] hover:text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <img
                  src="/login/google.webp"
                  alt="Google"
                  className="w-5 h-5"
                />
                Google
              </button>
              <button
                onClick={handleMicrosoftLogin}
                className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded-full hover:bg-[#002855] hover:text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <img
                  src="/login/microsoft.svg"
                  alt="Microsoft"
                  className="w-5 h-5"
                />
                Microsoft
              </button>
            </div>
          </div>
        </div>

        {/* Cột bên phải: Hình 3 thiết bị */}
        <div className="hidden lg:flex w-1/2  items-center justify-center relative">
          {/* Laptop */}
          <img
            src="/login/laptop.png"
            alt="Laptop"
            className="w-[80%] -left-[10%] relative z-10 fadeDown"
          />
          {/* Phone */}
          <img
            src="/login/phone.svg"
            alt="Phone"
            className="w-[25%] absolute -left-[4%] top-[39%] z-20 fadeLeft"
          />
          {/* Tablet */}
          <img
            src="/login/tablet.png"
            alt="Tablet"
            className="w-[48%] absolute left-[45%] top-[45%] z-20 fadeRight"
          />
        </div>
      </div>
      <div className="flex text-center items-center p-3 justify-center text-xs text-gray-600">
        © Copyright 2025 Wellspring International Bilingual Schools. All Rights
        Reserved.
      </div>
    </div>
  );
};

export default LoginAdmission;
