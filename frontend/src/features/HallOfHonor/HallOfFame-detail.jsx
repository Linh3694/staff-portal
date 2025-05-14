import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import i18n from "../../core/i18n";
import { CDN_URL } from "../../core/config";
import Sidebar from "./Sidebar";
import StudentHonorContent from "./StudentHonorContent";
import ClassHonorContent from "./ClassHonorContent";
import ScholarShipContent from "./ScholarShipContent";
import StandardizedTestAchievements from "./StandardizedTestAchievements";
import { FaArrowUp, FaArrowDown, FaBars } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

function HallOfFamePublicPage() {
  const { category, recordId, studentId, classId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCategoryNameInHeader, setShowCategoryNameInHeader] = useState(false);
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalStudent, setModalStudent] = useState(null);
  const [modalClass, setModalClass] = useState(null);

  // --- i18n, Header logic ---
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toggleLanguage = () => {
    const newLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLanguage);
  };

  // --- UI state: selected category (mặc định là "Học sinh Danh dự") & sidebar dropdown ---
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const categoryTitleRef = useRef(null);

  // Hàm chuyển đổi category name thành ID
  const getCategoryIdFromName = (name) => {
    switch (name) {
      case "scholarship-talent":
        return "67b5a81e4c93fbb31475ad4a";
      case "honor-student":
        return "67b5a7864c93fbb31475ad44";
      case "honor-class":
        return "67b5a7c84c93fbb31475ad47";
      case "wisers-effort":
        return "67b5a98b4c93fbb31475ad56";
      case "standardized-test":
        return "6822ac896c9cd6eb0dadecb5";  
      default:
        return null;
    }
  };

  // Hàm chuyển đổi category ID thành name
  const getCategoryNameFromId = (id) => {
    switch (id) {
      case "67b5a81e4c93fbb31475ad4a":
        return "scholarship-talent";
      case "67b5a7864c93fbb31475ad44":
        return "honor-student";
      case "67b5a7c84c93fbb31475ad47":
        return "honor-class";
      case "67b5a98b4c93fbb31475ad56":
        return "wisers-effort";
      case "6822ac896c9cd6eb0dadecb5":
        return "standardized-test";
      default:
        return null;
    }
  };

  // Cập nhật selectedCategoryId khi category trong URL thay đổi
  useEffect(() => {
    if (category) {
      const categoryId = getCategoryIdFromName(category);
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      }
    }
  }, [category]);

  // Cập nhật URL khi selectedCategoryId thay đổi
  useEffect(() => {
    if (!selectedCategoryId) return;

    const categoryName = getCategoryNameFromId(selectedCategoryId);
    if (!categoryName) return;

    // Nếu URL đã ở trang chi tiết (có recordId kèm theo studentId hoặc classId) thì giữ nguyên
    if (recordId && (studentId || classId)) {
      return;
    }

    navigate(`/hall-of-honor/detail/${categoryName}`, { replace: true });
  }, [selectedCategoryId, navigate, recordId, studentId, classId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Khi phần tiêu đề không còn hiển thị, set state để Header hiển thị tên danh mục
        setShowCategoryNameInHeader(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (categoryTitleRef.current) {
      observer.observe(categoryTitleRef.current);
    }
    return () => {
      if (categoryTitleRef.current) {
        observer.unobserve(categoryTitleRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

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

  // Mở modal khi có recordId và studentId/classId trong URL
  useEffect(() => {
    if (recordId && (studentId || classId)) {
      // Tìm record và student/class tương ứng
      if (studentId) {
        const record = records.find(r => r._id === recordId);
        if (record) {
          const student = record.students.find(s => s.student?._id === studentId);
          if (student) {
            setModalRecord(record);
            setModalStudent(student);
            setShowModal(true);
          }
        }
      } else if (classId) {
        const record = records.find(r => r._id === recordId);
        if (record) {
          const classInfo = record.awardClasses.find(c => c.classInfo?._id === classId);
          if (classInfo) {
            setModalRecord(record);
            setModalClass(classInfo);
            setShowModal(true);
          }
        }
      }
    }
  }, [recordId, studentId, classId, records]);

 
    const categoryName = getCategoryNameFromId(selectedCategoryId);

  // --- Chọn component hiển thị theo danh mục ---
  const renderMainContent = () => {
    // Ví dụ: nếu danh mục là "Học sinh Danh dự" thì hiển thị component StudentHonorContent,
    // còn với các danh mục khác có thể render component tương ứng.
    switch (selectedCategoryId) {
      // Học sinh danh dự
      case "67b5a7864c93fbb31475ad44":
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );

      // Học bổng tài năng
      case "67b5a81e4c93fbb31475ad4a":
        return (
          <ScholarShipContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );

      // Học sinh nỗ lực
      case "67b5a98b4c93fbb31475ad56":
        return (
          <StudentHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            studentIdParam={studentId}
            setSearchParams={setSearchParams}
          />
        );

      // Lớp danh dự
      case "67b5a7c84c93fbb31475ad47":
        return (
          <ClassHonorContent
            categoryId={selectedCategoryId}
            categoryName={categoryName}
            recordIdParam={recordId}
            classIdParam={classId}
            setSearchParams={setSearchParams}
          />
        );
      
      // Thành tích các bài thi chuẩn hóa
      case "6822ac896c9cd6eb0dadecb5":
        return (
          <StandardizedTestAchievements
            categoryId={selectedCategoryId}
            categoryName={categoryName} 
            recordIdParam={recordId}
            studentIdParam={studentId}
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
  useEffect(() => {
    document.title = "Wellspring Hà Nội | Hall of Honor";
    // Cleanup function để reset title khi unmount
    return () => {
      document.title = "Wellspring";
    };
  }, []);
  return (
    <div className="h-screen w-full">
      <header className="fixed top-0 left-0 w-full h-[80px] bg-[#002855] text-white flex items-center lg:shadow-none justify-between xll:px-20 px-6 shadow-md z-50">
        <div className="flex flex-row gap-7 items-center">
          <button
            className="xll:hidden mr-4"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <FaBars size={24} />
          </button>
          <button onClick={() => navigate("/hall-of-honor")}>
            <img
              src={`${CDN_URL}/HallOfFame/HOH-gold.png`}
              className="h-10"
              alt="Wellspring Logo"
            />
          </button>
          <a href="https://wellspring.edu.vn">
            <img
              src={`${CDN_URL}/HallOfFame/WS-white.png`}
              className="h-16"
              alt="Wellspring Logo"
            />
          </a>
        </div>
        <div className="flex flex-row gap-10 items-center">
          <img
            src={`${CDN_URL}/HallOfFame/HJ-white.png`}
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
                  ? `${CDN_URL}/Public/icons/flag-vi.png`
                  : `${CDN_URL}/Public/icons/flag-en.png`
              }
              alt={t("language", "Language")}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
      </header>
      <div className="flex md:px-14 pt-[60px]">
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          isSidebarOpen={isSidebarOpen}
          closeSidebar={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 xll:pl-16">{renderMainContent()}</div>

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
        <img
          src={`${CDN_URL}/HallOfFame/footer.svg`}
          alt="Footer"
          className="w-full"
        />
      </footer>
      <footer className="lg:hidden w-full">
        <img
          src={`${CDN_URL}/HallOfFame/Footer_mobile.png`}
          alt="Footer"
          className="w-full"
        />
      </footer>
      <Outlet />
    </div>
  );
}

export default HallOfFamePublicPage;
