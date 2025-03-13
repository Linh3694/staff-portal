import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18n from "../i18n";
import Sidebar from "../components/halloffame/Sidebar";
import StudentHonorContent from "../components/halloffame/StudentHonorContent";
import ClassHonorContent from "../components/halloffame/ClassHonorContent";
import ScholarShipContent from "../components/halloffame/ScholarShipContent";
import { FaArrowUp, FaArrowDown, FaBars } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

function HallOfFamePublicPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const recordIdParam = searchParams.get("recordId");
  const studentIdParam = searchParams.get("studentId");
  const classIdParam = searchParams.get("classId");

  // --- i18n, Header logic ---
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toggleLanguage = () => {
    const newLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLanguage);
  };

  // --- UI state: selected category (mặc định là “Học sinh Danh dự”) & sidebar dropdown ---
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    "67b5a7864c93fbb31475ad44"
  );
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  // Hàm cuộn xuống cuối trang
  const scrollToBottom = () => {
    // Lấy chiều cao nội dung của document
    const height = document.documentElement.scrollHeight;
    window.scrollTo({
      top: height,
      behavior: "smooth",
    });
  };

  // --- Chọn component hiển thị theo danh mục ---
  const renderMainContent = () => {
    // Ví dụ: nếu danh mục là “Học sinh Danh dự” thì hiển thị component StudentHonorContent,
    // còn với các danh mục khác có thể render component tương ứng.
    switch (selectedCategoryId) {
      //// Học sinh danh dự
      case "67b5a7864c93fbb31475ad44":
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            recordIdParam={recordIdParam}
            studentIdParam={studentIdParam}
            setSearchParams={setSearchParams}
          />
        );

      //// Học bổng tài năng
      case "67b5a81e4c93fbb31475ad4a":
        return (
          <ScholarShipContent
            categoryId={selectedCategoryId}
            recordIdParam={recordIdParam}
            studentIdParam={studentIdParam}
            setSearchParams={setSearchParams}
          />
        );

      //// Học sinh nỗ lực
      case "67b5a98b4c93fbb31475ad56":
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            recordIdParam={recordIdParam}
            studentIdParam={studentIdParam}
            setSearchParams={setSearchParams}
          />
        );

      //// Lớp danh dự
      case "67b5a7c84c93fbb31475ad47":
        return (
          <ClassHonorContent
            categoryId={selectedCategoryId}
            recordIdParam={recordIdParam}
            studentIdParam={studentIdParam}
            setSearchParams={setSearchParams}
          />
        );
      // TODO: thêm các case khác nếu có các component riêng cho danh mục khác.
      default:
        return (
          <div className="p-10">
            {t("noInterface", "Chưa có giao diện cho danh mục này.")}
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full">
      <header className="fixed top-0 left-0 w-full h-[80px] bg-[#002855] text-white flex items-center lg:shadow-none justify-between xl:px-20 px-6 shadow-md z-50">
        <button
          className="xl:hidden mr-4"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars size={24} />
        </button>
        <div className="flex flex-row gap-7 items-center">
          <button onClick={() => navigate("/hall-of-honor")}>
            <img
              src="/halloffame/HOH-white.png"
              className="h-12"
              alt="Wellspring Logo"
            />
          </button>
          <a href="https://wellspring.edu.vn">
            <img
              src="/halloffame/WS-white.png"
              className="h-16"
              alt="Wellspring Logo"
            />
          </a>
        </div>
        <div className="flex flex-row gap-10 items-center">
          <img
            src="/halloffame/HJ-white.png"
            className="h-12 hidden xl:block"
            alt="Happy Journey"
          />
          <button
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full border-2 transition border-gray-300 hover:border-yellow-400 shadow-md"
          >
            <img
              src={
                i18n.language === "vi"
                  ? "/icons/flag-vi.png"
                  : "/icons/flag-en.png"
              }
              alt={t("language", "Language")}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
      </header>
      <div className="flex md:px-10 pt-[60px]">
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          isSidebarOpen={isSidebarOpen}
          closeSidebar={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1">{renderMainContent()}</div>

        {/* 2 nút Lên/Xuống ở góc phải */}
        <div className="hidden md:flex fixed bottom-10 right-3 flex-col space-y-5 z-50">
          {/* Nút Lên */}
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[#F6967B] text-white shadow-lg flex items-center justify-center hover:bg-[#f05023]"
          >
            <FaArrowUp />
          </button>
          {/* Nút Xuống */}
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full bg-[#F6967B] text-white shadow-lg flex items-center justify-center hover:bg-[#f05023]"
          >
            <FaArrowDown />
          </button>
        </div>
      </div>
      {/* Footer */}
      <footer className="hidden lg:block w-full">
        <img src="/halloffame/Footer.svg" alt="Footer" className="w-full" />
      </footer>
      <footer className="lg:hidden w-full">
        <img
          src="/halloffame/Footer_mobile.png"
          alt="Footer"
          className="w-full"
        />
      </footer>
    </div>
  );
}

export default HallOfFamePublicPage;
