import React, { useState,useEffect } from "react";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";
import { FiImage, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";



const UploadModal = ({ isOpen, onClose, eventId, user }) => {
  console.log("User data in UploadModal:", user);
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isAgree, setIsAgree] = useState(false);
  const [language, setLanguage] = useState("vi");


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null); // Xóa ảnh đang xem trước
  };

  const handleCloseModal = () => {
    setTitle("");
    setMessage("");
    setFile(null);
    setIsAgree(false);
    onClose(); // Đóng modal
  };

  const handleSubmit = async () => {
    if (!isAgree) {
      return toast.error("Vui lòng đồng ý với điều khoản.");
    }
    // Lấy uploaderName từ Local Storage
    const uploaderName = user?.fullName || "Ẩn danh"; // Lấy tên từ user hoặc đặt tên mặc định
    console.log(uploaderName)
    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("title", title);
    formData.append("message", message);
    formData.append("file", file);
    formData.append("uploaderName", uploaderName); // Thêm uploaderName vào form data

    console.log (uploaderName)
    try {
      const response = await fetch(`${API_URL}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Lỗi khi tải ảnh lên!");

      toast.success("Ảnh đã được tải lên và chờ phê duyệt!");
      handleCloseModal(); // Đóng modal
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải ảnh lên!");
    }
  };

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg lg:p-6 xs:p-3 lg:w-[763px] xs:w-[375px] shadow-lg">
        <div className="border-b justify-center items-center flex gap-2">
          <h2 className="lg:text-2xl xs:text-xl text-center font-bold text-[#b42b23] mb-4 mt-2">{t("today_challanges_today_challanges")}</h2>
          <button
            onClick={() => {
            const newLang = language === "vi" ? "en" : "vi";
            i18n.changeLanguage(newLang);
            setLanguage(newLang);
          }}
            className="lg:w-8 lg:h-8 xs:h-7 xs:w-7 rounded-full border-2 border-gray-300 transition-transform transform hover:scale-110 items-end mb-2"
            >
            <img
              src={`/tet2025/icons/flag-${language}.png`} // ✅ Tự động đổi cờ dựa trên ngôn ngữ
              alt={language === "vi" ? "Tiếng Việt" : "English"}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
        <div className="lg:grid lg:grid-cols-2 lg:justify-between xs:flex xs:flex-col">
        {/* Tiêu đề */}
        <div className="lg:w-[400px] xs:w-[350px] pr-4 mt-4 ml-2">
        {/* Nhập thông tin */}
        <div className="mb-4">
          <label className="block lg:text-xl xs:text-md font-medium mb-2 text-[#5e191a]">{t("title")}</label>
          <input
            type="text"
            className="w-full p-2 rounded-full bg-[#f6f6f6] focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
            placeholder="Nhập tiêu đề/ Enter a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block lg:text-xl xs:text-md font-medium mb-2 text-[#5e191a]">{t("content")}</label>
          <textarea
            className="w-full p-2 rounded-xl bg-[#f6f6f6] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
            placeholder="Nhập nội dung/ Input desciption"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Upload ảnh(mobile) */}
        <div className="lg:hidden w-[320px]">
              <div className="mb-4">
                <div className="flex justify-between mt-4 mb-2">
                  <label className="block text-md font-medium text-[#5e191a]">{t("preview")}</label>
                  <div className="flex justify-between items-center">
                    <button onClick={handleRemoveFile} className="text-[#b42b23] hover:text-red-700 text-2xl">
                    <FiTrash2 size={20}></FiTrash2>
                    </button>
                  </div>
                </div>
                  <div className="border-2 h-full border-dashed border-gray-400 p-4 rounded-lg relative hover:border-red-500 transition-all duration-300">
                    {file ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-20 text-gray-500 cursor-pointer text-md">
                        <p className="text-md">{t("picture")}</p>
                        <span className="text-xl font-bold mt-2">
                        <FiImage size={26}></FiImage>
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
            </div>  

        {/* Checkbox cam kết */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="agree"
            checked={isAgree}
            onChange={(e) => setIsAgree(e.target.checked)}
            className="w-5 h-5 rounded-md text-[#b42b23] focus:ring-2 focus:ring-red-500 transition-all duration-300 items-start"
          />
          <label htmlFor="agree" className="ml-2 lg:text-base xs:text-sm font-semibold text-[#5e191a]">
           {t("term")}            
          </label>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-between">
          <button
            className="bg-[#b42b23] text-white text-md px-4 py-2 rounded-md hover:bg-red-700 transition-all duration-300 w-1/2"
            onClick={handleSubmit}
          >
            {t("post")}  
          </button>
          <button
            className="bg-[#fcf5e3] text-gray-800 text-md px-4 py-2 rounded-md hover:bg-yellow-200 transition-all duration-300 w-1/2 ml-2"
            onClick={handleCloseModal}
          >
            {t("cancel")}  
          </button>
        </div>
      </div>
     

      {/* Upload ảnh */}
          <div className="xs:hidden lg:block w-[300px] ml-12">
              <div className="mb-4 pl-4">
                <div className="flex justify-between mt-4 mb-2">
                  <label className="block text-lg font-medium text-[#5e191a]">{t("preview")}</label>
                  <div className="flex justify-between items-center">
                    <button onClick={handleRemoveFile} className="text-[#b42b23] hover:text-red-700 text-2xl">
                    <FiTrash2 size={20}></FiTrash2>
                    </button>
                  </div>
                </div>
                  <div className="border-2 h-full border-dashed border-gray-400 p-4 rounded-lg relative hover:border-red-500 transition-all duration-300">
                    {file ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-72 text-gray-500 cursor-pointer">
                        <p>{t("picture")}</p>
                        <span className="text-2xl font-bold mt-2">
                        <FiImage size={26}></FiImage>
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default UploadModal;