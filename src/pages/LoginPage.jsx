import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../config"; // import từ file config
import { ReactTyped } from "react-typed";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // **Đăng nhập với Microsoft** - Chuyển hướng sang server
  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/auth/microsoft`;
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
        // Lưu token và thông tin role, sau đó chuyển hướng nếu đăng nhập thành công
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("role", data.user.role);
        window.location.href = "/dashboard"; // Cập nhật đường dẫn theo yêu cầu
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau!");
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-hidden bg-[#EDEDED]"
      style={{
        backgroundImage: 'url("/login/building.svg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-[850px] h-screen flex flex-col items-center justify-center">
        <div className="w-full p-8 flex flex-col items-center">
          <h2 className="text-4xl font-bold mb-10 text-center">
            <ReactTyped
              strings={["Đăng nhập để tiếp tục nhé..."]}
              typeSpeed={50}
              backSpeed={30}
              showCursor={true}
              cursorChar="|"
            />
          </h2>

          <div className="w-1/2 mb-4">
            <label className="text-left block font-medium mb-2 text-[#757575]">
              Tên đăng nhập
            </label>
            <input
              type="text"
              placeholder="email@wellspring.edu.vn"
              className="w-full h-10 border-none rounded-full p-2 text-sm px-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="w-1/2 mb-6">
            <label className="text-left block font-medium mb-2 text-[#757575]">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="**********"
              className="w-full h-10 border-none rounded-full p-2 text-sm px-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-1/2 bg-[#002855] text-white py-3 font-bold rounded-full mb-4 hover:bg-[#1a3a5e] transition-all"
          >
            Đăng nhập
          </button>

          {error && <div className="text-sm mb-4 text-red-500">{error}</div>}

          <div className="w-1/2 flex flex-row justify-between gap-4">
            <button
              onClick={handleGoogleLogin}
              className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded-full hover:bg-[#002855] hover:text-white font-semibold transition-all flex items-center justify-center gap-2"
            >
              <img src="/login/google.webp" alt="Google" className="w-5 h-5" />
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

      <footer className="absolute bottom-32 left-8 md:bottom-7 md:left-20 md:text-sm text-[10px] text-gray-600 items-center ">
        © Copyright 2025 Wellspring International Bilingual Schools. All Rights
        Reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
