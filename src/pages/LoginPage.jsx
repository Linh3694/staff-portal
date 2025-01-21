import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { useEffect } from "react"; // Import useEffect
import axios from "axios";
import "./login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL, UPLOAD_URL } from "../config"; // import từ file config


  const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const commonDomains = ["@wellspring.edu.vn"];
  const [suggestedEmails, setSuggestedEmails] = useState([]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e) => {
  const value = e.target.value;
    setFormData({ ...formData, email: value });

    if (!value.includes("@")) {
      setSuggestedEmails(commonDomains.map(domain => value + domain));
    } else {
      setSuggestedEmails([]);
    }

    if (value && !validateEmail(value)) {
      setErrors({ ...errors, email: "Invalid email format" });
    } else {
  const newErrors = { ...errors };
      delete newErrors.email;
      setErrors(newErrors);
    }
  };

  const handlePasswordChange = (e) => {
  const value = e.target.value;
      setFormData({ ...formData, password: value });

      if (value.length < 8) {
        setErrors({ ...errors, password: "Password must be at least 8 characters" });
      } else {
        const newErrors = { ...errors };
        delete newErrors.password;
        setErrors(newErrors);
      }
    };
  const [rememberMe, setRememberMe] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const newErrors = {};
    if (!formData.email) newErrors.email = "Vui lòng nhập email!";
    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu!";
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
  
    try {
      setIsLoading(true);
  
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      });
  
      const { token, user } = response.data;
      
      console.log("Role ông này là",user.role)
      if (!token) {
        console.error("Không tìm thấy token trong response.");
        return;
      }

      if (!["admin", "superadmin", "technical"].includes(user.role)) {
        console.error("Sai role không vào được");
        toast.error("Bạn không phải IT không được vào");
        return;
      }

      console.log("Đăng nhập thành công:", user);
      localStorage.setItem("authToken", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("rememberedEmail", rememberMe ? formData.email : "");
      localStorage.setItem("currentUser", JSON.stringify(user)); // Lưu toàn bộ thông tin user
      console.log("Đăng nhập thành công, điều hướng đến dashboard...");

      navigate("/dashboard");

    } catch (error) {
      console.error("Lỗi đăng nhập:", error.response?.data?.message || error.message);
  
      // Hiển thị thông báo lỗi qua Toast Notification
      toast.error(
        error.response?.data?.message || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại!"
      );
    } finally {
      setIsLoading(false);
    }
  };
        useEffect(() => {
          const rememberedEmail = localStorage.getItem("rememberedEmail");
          const authToken = localStorage.getItem("authToken");
          const role = localStorage.getItem("role");
        
          if (rememberedEmail) {
            setFormData((prev) => ({ ...prev, email: rememberedEmail }));
            setRememberMe(true);
          }
        }, []);

  const selectSuggestedEmail = (email) => {
    setFormData({ ...formData, email });
    setSuggestedEmails([]);
  };

  return (
    <div
    style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `url(${process.env.PUBLIC_URL + '/theme.png'})`, // Truy cập file trong public
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }} >
      <div className="login-box">
        <h1 className="text-3xl font-bold text-[#002147] mb-8 text-center">Đăng Nhập</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-[#FF5733]" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all duration-300`}
              placeholder="example@wellspring.edu.vn"
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-[#FF5733]" role="alert">
                {errors.email}
              </p>
            )}
            {suggestedEmails.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
                {suggestedEmails.map((email, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    onClick={() => selectSuggestedEmail(email)}
                  >
                    {email}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.password ? "border-[#FF5733]" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all duration-300`}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-[#FF5733]" role="alert">
                {errors.password}
              </p>
            )}
          </div>
          {/* // Ghi nhớ tài khoản */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-[#002147] border-gray-300 rounded focus:ring-[#002147]"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-700">
              Ghi nhớ tài khoản
            </label>
          </div>    

          <button
            type="submit"
            className="w-full bg-[#002147] text-white py-3 rounded-lg hover:bg-[#001a38] focus:outline-none focus:ring-2 focus:ring-[#002147] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" size={20} />
                Vui lòng chờ...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Hệ thống quản lý tài sản Công nghệ thông tin {" "}
          
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
