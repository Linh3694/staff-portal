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

  const fixedCategories = [
    {
      id: "67b5a81e4c93fbb31475ad4a",
      nameKey: "scholarship_talent",
      default: "Học bổng Tài năng",
    },
    {
      id: "67b5a87b4c93fbb31475ad4d",
      nameKey: "top_graduates",
      default: "Thủ khoa Tốt nghiệp",
    },
    {
      id: "67b5a8e54c93fbb31475ad50",
      nameKey: "wiser_excellent",
      default: "WISers Ưu tú",
    },
    {
      id: "67b5a92b4c93fbb31475ad53",
      nameKey: "wiser_inspiration",
      default: "WISers Truyền cảm hứng",
    },
    {
      id: "id_danh_du",
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
      id: "id_thi_chuan_hoa",
      nameKey: "standardized_test",
      default: "Thành tích các bài thi chuẩn hóa",
    },
    {
      id: "id_giai_dau",
      nameKey: "competition",
      default: "Thành tích trong các cuộc thi và giải đấu",
    },
  ];

  // Khi load, nếu đang chọn subcategory, tự động mở dropdown của category cha
  useEffect(() => {
    fixedCategories.forEach((cat) => {
      if (cat.subCategories?.some((sub) => sub.id === selectedCategoryId)) {
        setOpenDropdown(cat.id);
      }
    });
  }, [selectedCategoryId, fixedCategories, setOpenDropdown]);

  return (
    <aside
      className={`fixed top-12 md:top-0 left-0 z-40 flex h-full w-[300px] bg-white p-4 shadow-md transform transition-transform duration-300 overflow-y-auto
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 md:relative md:flex md:w-[300px] md:h-[calc(100vh-80px)] md:shadow-none md:overflow-y-visible`}
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
          return (
            <div key={fixedCat.id} className="w-full">
              <div
                className={`flex items-center justify-between text-[18px] p-3 rounded-lg transition ${
                  selectedCategoryId === fixedCat.id
                    ? "bg-[#F05023] font-bold text-white"
                    : "hover:bg-gray-50 text-[#757575]"
                }`}
                onClick={() => {
                  if (!hasSubcategories) {
                    setSelectedCategoryId(fixedCat.id);
                    // Nếu màn hình nhỏ, tự động đóng sidebar sau khi chọn danh mục
                    if (window.innerWidth < 768) {
                      closeSidebar && closeSidebar();
                    }
                  } else {
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
              {hasSubcategories && isOpen && (
                <div className="pl-6 space-y-2 mt-3">
                  {fixedCat.subCategories.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedCategoryId(sub.id);
                        // Sau khi chọn subcategory, tự động đóng sidebar trên mobile
                        if (window.innerWidth < 768) {
                          closeSidebar && closeSidebar();
                        }
                      }}
                      className={`cursor-pointer text-[18px] p-3 rounded-lg transition ${
                        sub.id === selectedCategoryId
                          ? "bg-[#F05023] text-white font-bold"
                          : "hover:bg-gray-50 text-[#757575]"
                      }`}
                    >
                      {t(sub.nameKey, sub.default)}
                    </div>
                  ))}
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
