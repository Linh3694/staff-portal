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
    "67b5a81e4c93fbb31475ad4a", // Học bổng Tài năng
    "67b5a98b4c93fbb31475ad56", // WISers Nỗ lực
    "67b5a7c84c93fbb31475ad47", // Lớp Danh dự
  ];

  const fixedCategories = [
    {
      id: "empty",
      nameKey: "scholarship_talent",
      default: "Học bổng Tài năng",
    },
    {
      id: "empty",
      nameKey: "top_graduates",
      default: "Thủ khoa Tốt nghiệp",
    },
    {
      id: "empty",
      nameKey: "wiser_excellent",
      default: "WISers Ưu tú",
    },
    {
      id: "empty",
      nameKey: "wiser_inspiration",
      default: "WISers Truyền cảm hứng",
    },
    {
      id: "empty",
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
      id: "empty",
      nameKey: "standardized_test",
      default: "Thành tích các bài thi chuẩn hóa",
    },
    {
      id: "empty",
      nameKey: "competition",
      default: "Thành tích trong các cuộc thi và giải đấu",
    },
  ];

  useEffect(() => {
    // Mở dropdown cha nếu đang chọn subcategory
    fixedCategories.forEach((cat) => {
      if (cat.subCategories?.some((sub) => sub.id === selectedCategoryId)) {
        setOpenDropdown(cat.id);
      }
    });
  }, [selectedCategoryId, fixedCategories, setOpenDropdown]);

  return (
    <aside
      className={`fixed top-12 md:top-0 left-0 z-40 flex h-full w-full md:w-[350px] lg:w-[400px] bg-white p-4 shadow-md transform transition-transform duration-300 overflow-y-auto
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      xl:translate-x-0 xl:relative xl:flex xl:w-[270px] xl:h-[calc(100vh-80px)] xl:shadow-none xl:overflow-y-visible`}
    >
      <nav className="space-y-4 mt-10">
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
          const isOpen = openDropdown === fixedCat.id;

          const isCatEnabled = enabledCategoryIds.includes(fixedCat.id);

          return (
            <div key={fixedCat.id} className="w-full">
              {/* Danh mục cha */}
              <div
                className={`
                  flex items-center justify-between p-3 text-[18px] rounded-lg transition
                  ${
                    // Nếu là danh mục được chọn và được hỗ trợ => highlight
                    selectedCategoryId === fixedCat.id && isCatEnabled
                      ? "bg-[#F05023] font-bold text-white"
                      : "text-[#757575] font-semibold"
                  }
                  ${
                    // Nếu là danh mục được hỗ trợ => hover/cursor-pointer
                    isCatEnabled
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
                onClick={() => {
                  // Chỉ cho click nếu isCatEnabled = true
                  if (!hasSubcategories) {
                    if (isCatEnabled) {
                      setSelectedCategoryId(fixedCat.id);
                      if (window.innerWidth < 1024) {
                        closeSidebar && closeSidebar();
                      }
                    }
                  } else {
                    // Bỏ qua kiểm tra isCatEnabled => dropdown luôn mở được nếu có subCategories
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

              {/* Tiểu mục (nếu có) */}
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
                            // Highlight nếu sub được chọn & được hỗ trợ
                            sub.id === selectedCategoryId && isSubEnabled
                              ? "bg-[#F05023] text-white font-bold"
                              : "text-[#757575] text-lg font-semibold"
                          }
                          ${
                            // Nếu sub có giao diện => hover pointer
                            isSubEnabled
                              ? " cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          }
                        `}
                        onClick={() => {
                          // Chỉ click được nếu isSubEnabled = true
                          if (isSubEnabled) {
                            setSelectedCategoryId(sub.id);
                            if (window.innerWidth < 1024) {
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
