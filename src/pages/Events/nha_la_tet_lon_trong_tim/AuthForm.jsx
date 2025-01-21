import React, { useState, useEffect } from "react";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../../config"; // import từ file config


console.log("setIsEventAuthenticated called with value: true");

const AuthForm = ({ setIsEventAuthenticated }) => {
  console.log("AuthForm props:", { setIsEventAuthenticated });
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [nameOptions, setNameOptions] = useState([]);
  const [correctName, setCorrectName] = useState("");
  const [language, setLanguage] = useState("vi");
  const navigate = useNavigate();
  const location = useLocation(); // Lấy thông tin state { from: ... }
  const [backgroundImage, setBackgroundImage] = useState("/theme.png");

  

  const handleVerifyId = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
  
      // ✅ Lưu toàn bộ thông tin người dùng vào localStorage
      localStorage.setItem("user", JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        options: data.options,
        role:data.role,
      }));
  
      setCorrectName(data.fullName);
      setNameOptions(data.options);
      setStep(2);
    } catch (error) {
      console.error("Error verifying ID:", error.message);
      toast.error(t("toast_invalid_id"));
    }
  };

  const handleVerifyName = async (selectedName) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
  
    if (!storedUser || !storedUser.userId) {
      console.error("Lỗi xác thực: Không tìm thấy userId trong localStorage!", storedUser);
      toast.error(t("toast_auth_error"));
      setStep(1);
      return;
    }
  
    try {
      console.log("Đang gửi yêu cầu verify-name với dữ liệu:", {
        userId: storedUser.userId,
        fullName: storedUser.fullName,
        selectedName,
      });
  
      const response = await fetch(`${API_URL}/auth/verify-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: storedUser.userId,
          fullName: storedUser.fullName,
          selectedName,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi xác thực tên");
      }
  
      console.log("Xác thực thành công!");
      localStorage.setItem("eventAuth", "true");
      setIsEventAuthenticated(true);
      navigate("/event");
      const from = location.state?.from?.pathname + location.state?.from?.search || "/event";

      navigate(from, { replace: true });

    } catch (error) {
      console.error("Lỗi xác thực tên:", error.message);
      toast.error(t("toast_name_verification_error"));
    }
  };

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  useEffect(() => {
    // Hàm cập nhật background dựa trên kích thước màn hình
    const updateBackground = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setBackgroundImage("/theme_mobile.png");  // Mobile
      } else if (width < 1024) {
        setBackgroundImage("/theme_mobile.png"); // Tablet
      } else if (width < 1366) {
        setBackgroundImage("/theme.png"); // Laptop 13"
      } else {
        setBackgroundImage("/theme.png");  // Desktop
      }
    };

    updateBackground(); // Gọi 1 lần khi component mount
    window.addEventListener("resize", updateBackground); // Lắng nghe sự kiện resize

    return () => window.removeEventListener("resize", updateBackground); // Cleanup
  }, []);

  return (
    <div className="min-h-screen">
            {/* Header */}
            <header className="bg-[#fcf5e3] flex items-center justify-between w-full h-[80px] px-6">
              {/* Logo Section */}
              <div className="w-[1390px] mx-auto flex flex-row items-center justify-between">
                  <div className="flex items-center lg:space-x-2 xs:space-x-0">
                    <img
                      src="/tet2025/image/wellsping-logo.png" // Đường dẫn logo 1
                      alt="Logo 1"
                      className="lg:h-20 lg:w-36 xs:w-28 xs:h-16"
                      
                    />
                    <img
                      src="/tet2025/image/happyjourney.png" // Đường dẫn logo 2
                      alt="Logo 2"
                      className="lg:h-28 w-auto xs:h-20 xs:mt-1"
                    />
                  </div>
        
                    {/* Language Switcher */}
                    <div className ="items-center">
                      <div className ="flex items-center">                      
                      <button
                        onClick={() => {
                          const newLang = language === "vi" ? "en" : "vi";
                          i18n.changeLanguage(newLang);
                          setLanguage(newLang);
                        }}
                        className="lg:w-10 xs:w-12 lg:h-10 xs:h-12 rounded-full border-2 border-gray-300 transition-transform transform hover:scale-110"
                      >
                        <img
                          src={`/tet2025/icons/flag-${language}.png`} // ✅ Tự động đổi cờ dựa trên ngôn ngữ
                          alt={language === "vi" ? "Tiếng Việt" : "English"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </button>
                      </div>
                    </div>
              </div>
            </header>
    <div className="h-screen w-full flex flex-col items-center justify-center bg-cover bg-center transition-all"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
          >
      {/* Bảng xác thực */}
      <div className="w-3/4 backdrop-blur-sm p-8 shadow-lg rounded-2xl transform scale-100 transition-transform duration-300 bg-white/40 bg-opacity-80
            2xl:absolute 2xl:right-72 2xl:w-1/5 2xl:rounded-2xl
            xl:absolute xl:right-52 xl:w-1/5 xl:rounded-2xl
            lg:absolute lg:right-28 lg:w-1/4 lg:rounded-2xl
            xs:w-3/4
            ">
        {step === 1 && (
          <>
            <h2 className="text-xl text-[#f8f8f8] font-bold mb-4 text-center">{t("loginbox_title")}</h2>
            <input
              type="text"
              placeholder="WF00ABC"
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              className="w-full bg-[#f5f5f5] mx-auto p-3 border text-center items-center rounded-full mb-4"
            />
            <button
              onClick={handleVerifyId}
              className="w-full bg-[#E55526] mx-auto rounded-full text-white py-3 hover:bg-[#e16e47] transition font-bold"
            >
              {t("loginbox_next")}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl text-[#f8f8f8] mx-auto font-bold mb-4 text-center justify-center">{t("loginbox_verifyname")}</h2>
            {nameOptions.map((name, index) => (
              <button
                key={index}
                onClick={() => handleVerifyName(name)}
                className="w-full bg-[#f8f8f8] mx-auto border border-[#E55526] text-[#E55526] py-2 rounded-full mb-2 hover:bg-[#E55526] hover:text-white transition"
              >
                {name}
              </button>
            ))}
             {/* 🔹 Nút Quay lại Step 1 */}
            <button
              onClick={() => {
                setStep(1); // Quay lại Step 1
                setId("");  // Xóa ID nhập sai
              }}
              className="w-full bg-[#E55526] mx-auto text-white py-2 rounded-full mt-4 transition font-bold"
            >
              {t("loginbox_back")}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
  );
};

export default AuthForm;