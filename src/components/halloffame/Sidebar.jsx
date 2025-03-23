// Sidebar.jsx
import React, { useEffect } from "react";
import { FaAngleDown, FaAngleRight, FaArrowLeft } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  selectedCategoryId,
  setSelectedCategoryId,
  openDropdown,
  setOpenDropdown,
  isSidebarOpen,
  closeSidebar,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Danh sách ID các danh mục đã có giao diện (được xử lý trong switch).
  const enabledCategoryIds = [
    "67b5a7864c93fbb31475ad44", // Học sinh Danh dự
    "67b5a98b4c93fbb31475ad56", // WISers Nỗ lực
    "67b5a7c84c93fbb31475ad47", // Lớp Danh dự
  ];

  const fixedCategories = [
    {
      id: "empty_1",
      nameKey: "scholarship_talent",
      default: "Học bổng Tài năng",
    },
    {
      id: "empty_2",
      nameKey: "top_graduates",
      default: "Thủ khoa Tốt nghiệp",
    },
    {
      id: "empty_3",
      nameKey: "wiser_excellent",
      default: "WISers Ưu tú",
    },
    {
      id: "empty_4",
      nameKey: "wiser_inspiration",
      default: "WISers Truyền cảm hứng",
    },
    {
      id: "empty_5",
      nameKey: "wiser_honor",
      default: "WISers Danh dự",
      subCategories: [
        {
          id: "67b5a7864c93fbb31475ad44",
          nameKey: "student_honor",
          default: "Học sinh Danh dự",
        },
        {
          id: "67b5a7c84c93fbb31475ad47",
          nameKey: "class_honor",
          default: "Lớp Danh dự",
        },
      ],
    },
    {
      id: "67b5a98b4c93fbb31475ad56",
      nameKey: "wiser_effort",
      default: "WISers Nỗ lực",
    },
    {
      id: "empty_6",
      nameKey: "standardized_test",
      default: "Thành tích các bài thi chuẩn hóa",
    },
    {
      id: "empty_7",
      nameKey: "competition",
      default: "Thành tích trong các cuộc thi và giải đấu",
    },
  ];

  useEffect(() => {
    // Chỉ khi component mount, kiểm tra nếu selectedCategoryId thuộc subCategories
    fixedCategories.forEach((cat) => {
      if (cat.subCategories?.some((sub) => sub.id === selectedCategoryId)) {
        setOpenDropdown(cat.id);
      }
    });
  }, []); // Chạy chỉ một lần khi mount

  return (
    <aside
      className={`fixed top-12 md:top-0 left-0 z-40 flex h-full w-full md:w-[350px] lg:w-[400px] bg-white p-4 shadow-md transform transition-transform duration-300 overflow-y-auto
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      xll:translate-x-0 xll:relative xll:flex xll:w-[270px] xll:h-[calc(100vh-80px)] xll:shadow-none xll:overflow-y-visible`}
    >
      <nav className="space-y-4 mt-10 ">
        <button
          onClick={() => navigate("/hall-of-honor")}
          className="flex items-center gap-2 text-[#757575] hover:text-[#002855] mb-6"
        >
          <FaArrowLeft />
          <span className="text-[#757575]">
            {t("back_home", "Quay lại trang chủ")}
          </span>
        </button>

        <h2 className="font-bold text-[24px] mb-4 text-[#002855]">
          {t("category", "Danh mục")}
        </h2>

        <hr className="border-gray-200 mb-4" />

        {fixedCategories.map((fixedCat) => {
          const hasSubcategories =
            fixedCat.subCategories && fixedCat.subCategories.length > 0;
          // Nếu có subcategories, luôn enable; nếu không thì kiểm tra enabledCategoryIds
          const isCatEnabled =
            hasSubcategories || enabledCategoryIds.includes(fixedCat.id);
          const isOpen = openDropdown === fixedCat.id;

          // Áp dụng style khác cho các catalogue có subcategories
          const containerStyle = hasSubcategories
            ? "flex items-center justify-between p-3 text-[18px] rounded-lg transition text-[#757575] font-semibold cursor-pointer"
            : `flex items-center justify-between p-3 text-[18px] rounded-lg transition ${
                selectedCategoryId === fixedCat.id
                  ? "bg-[#F05023] font-bold text-white"
                  : "text-[#757575] font-semibold"
              } ${
                isCatEnabled
                  ? "cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`;

          return (
            <div key={fixedCat.id} className="w-full">
              {/* Danh mục cha */}
              <div
                className={containerStyle}
                onClick={() => {
                  if (!hasSubcategories) {
                    if (isCatEnabled) {
                      setSelectedCategoryId(fixedCat.id);
                      if (window.innerWidth < 1600) {
                        closeSidebar && closeSidebar();
                      }
                    }
                  } else {
                    // Với catalogue có subcategories, chỉ toggle dropdown
                    setOpenDropdown(
                      openDropdown === fixedCat.id ? null : fixedCat.id
                    );
                  }
                }}
              >
                <span>{t(fixedCat.nameKey, fixedCat.default)}</span>
                {hasSubcategories && (
                  <span className="text-gray-500 text-lg">
                    {isOpen ? <FaAngleDown /> : <FaAngleRight />}
                  </span>
                )}
              </div>

              {/* Tiểu mục nếu có */}
              {hasSubcategories && isOpen && (
                <div className="pl-6 space-y-2 mt-3">
                  {fixedCat.subCategories.map((sub) => {
                    const isSubEnabled = enabledCategoryIds.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`
                  text-[18px] p-3 rounded-lg transition
                  ${
                    sub.id === selectedCategoryId && isSubEnabled
                      ? "bg-[#F05023] text-white font-bold"
                      : "text-[#757575] text-lg font-semibold"
                  }
                  ${
                    isSubEnabled
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
                        onClick={() => {
                          if (isSubEnabled) {
                            setSelectedCategoryId(sub.id);
                            if (window.innerWidth < 1600) {
                              closeSidebar && closeSidebar();
                            }
                          }
                        }}
                      >
                        {t(sub.nameKey, sub.default)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
