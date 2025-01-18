import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../../config"; // import từ file config
import i18n from "../../../i18n"; // Đảm bảo bạn đã cấu hình i18n như hướng dẫn trước đó.


console.log("setIsEventAuthenticated called with value: true");

const AuthForm = ({ setIsEventAuthenticated }) => {
  console.log("AuthForm props:", { setIsEventAuthenticated });

  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [nameOptions, setNameOptions] = useState([]);
  const [correctName, setCorrectName] = useState("");
  const [language, setLanguage] = useState("vi");
  const navigate = useNavigate();
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
        options: data.options
      }));
  
      setCorrectName(data.fullName);
      setNameOptions(data.options);
      setStep(2);
    } catch (error) {
      console.error("Error verifying ID:", error.message);
      toast.error("ID không hợp lệ hoặc có lỗi xảy ra!");
    }
  };

  const handleVerifyName = async (selectedName) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
  
    if (!storedUser || !storedUser.userId) {
      console.error("Lỗi xác thực: Không tìm thấy userId trong localStorage!", storedUser);
      toast.error("Không tìm thấy thông tin xác thực. Vui lòng thử lại!");
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
    } catch (error) {
      console.error("Lỗi xác thực tên:", error.message);
      toast.error(error.message || "Lỗi xác thực tên!");
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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-cover bg-center transition-all"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
          >
      {/* Nút chuyển đổi ngôn ngữ */}
      <div className="absolute top-4 right-6 flex items-center text-white space-x-4 mr-20 mt-12
      xs:right-0 xs:mr-4">
        <span className=" text-xl">Ngôn ngữ:</span>

        {/* Hiển thị chỉ cờ ngôn ngữ hiện tại */}
        {language === "en" && (
          <button
            onClick={() => toggleLanguage("vi")}
            className="w-10 h-10 rounded-full  flex items-center justify-center border-white transition"
          >
            <img
              src="/tet2025/icons/flag-en.png"
              alt="English"
              className="w-10 h-10 rounded-full object-cover"
            />
          </button>
        )}

        {language === "vi" && (
          <button
            onClick={() => toggleLanguage("en")}
            className="w-10 h-10 rounded-full flex items-center justify-center border-white transition"
          >
            <img
              src="/tet2025/icons/flag-vi.png"
              alt="Tiếng Việt"
              className="w-10 h-10 rounded-full object-cover"
            />
          </button>
        )}
      </div>

      {/* Bảng xác thực */}
      <div className="w-3/4 backdrop-blur-sm p-8 shadow-lg rounded-2xl transform scale-100 transition-transform duration-300 bg-white/40 bg-opacity-80
            2xl:absolute 2xl:right-72 2xl:w-1/5 2xl:rounded-2xl
            xl:absolute xl:right-52 xl:w-1/5 xl:rounded-2xl
            lg:absolute lg:right-28 lg:w-1/4 lg:rounded-2xl
            md:w-1/3
            ">
        {step === 1 && (
          <>
            <h2 className="text-xl text-[#f8f8f8] font-bold mb-4 text-center">Nhập ID để xác thực</h2>
            <input
              type="text"
              placeholder="Nhập ID của bạn"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-[#f5f5f5] mx-auto p-3 border text-center items-center rounded-full mb-4"
            />
            <button
              onClick={handleVerifyId}
              className="w-full bg-[#E55526] mx-auto rounded-full text-white py-3 hover:bg-[#e16e47] transition"
            >
              Tiếp tục
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl text-[#f8f8f8] mx-auto font-bold mb-4 text-center justify-center">Chọn tên của bạn</h2>
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
              className="w-full bg-[#E55526] mx-auto text-white py-2 rounded-full mt-4 transition"
            >
              Quay lại
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;