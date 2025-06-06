import React, { useState, useRef, useEffect } from "react";
import {
  FiUser,
  FiMonitor,
  FiClipboard,
  FiUsers,
  FiHome,
  FiFolder,
} from "react-icons/fi";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../shared/components/ui/accordion";
import { cn } from "../../shared/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  FaChevronRight,
  FaArrowRightFromBracket,
  FaCircleUser,
  FaBus,
} from "react-icons/fa6";
import { FaBook, FaUserGraduate, FaUserTie } from "react-icons/fa";
import { IoDocuments } from "react-icons/io5";
import { LuTicketSlash } from "react-icons/lu";

const Sidebar = ({
  currentUser,
  selectedMainMenu,
  setSelectedMainMenu,
  selectedSubMenu,
  setSelectedSubMenu,
  setIsSidebarOpen, // Nhận state từ Dashboard
  setIsSidebarHovered,
}) => {
  const navigate = useNavigate();

  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const effectiveCollapsed = isPinned ? false : !isHovered;
  const role = currentUser.role?.toLowerCase();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const menuItems = [
    {
      title: "Workspace",
      allowedRoles: ["superadmin", "admin", "technical"],
      subItems: [
        {
          label: "Tickets",
          icon: <LuTicketSlash size={16} />,
          link: "/dashboard/ticket",
        },
        {
          label: "Quản lý thiết bị",
          icon: <FiMonitor size={16} />,
          link: "/dashboard/devices",
          allowedRoles: ["superadmin", "admin", "technical"],
        },
        {
          label: "Quản lý Tickets",
          icon: <FiClipboard size={16} />,
          link: "/dashboard/ticketsadmin",
          allowedRoles: ["superadmin", "admin", "technical"],
        },
        {
          label: "Quản lý tài liệu",
          icon: <FiFolder size={16} />,
          link: "/dashboard/documents",
          allowedRoles: ["superadmin", "admin", "technical"],
        },
        {
          label: "Phần mềm lật trang",
          icon: <IoDocuments size={16} />,
          link: "/dashboard/flippageadmin",
          allowedRoles: ["superadmin", "admin", "marcom"],
        },
          {
            label: "Quản lý tuyển dụng",
            icon: <FaUserTie size={16} />,
            link: "/dashboard/recruitment",
            allowedRoles: ["superadmin", "admin", "hr"],
          },
        {
          label: "Quản lý vinh danh",
          icon: <FaUserGraduate size={16} />,
          link: "/dashboard/halloffame",
          allowedRoles: ["superadmin", "admin", "marcom"],
        },
        {
          label: "Tuyển sinh",
          icon: <FaUserGraduate size={16} />,
          link: "/dashboard/admission",
          allowedRoles: ["superadmin", "admin", "admission"],
        },
        {
          label: "Quản lý Bus",
          icon: <FaBus size={16} />,
          link: "/dashboard/bus",
          allowedRoles: ["superadmin", "admin", "technical"],
        },
        {
          label: "Quản lý Thư viện",
          icon: <FaBook size={16} />,
          link: "/dashboard/library",
          allowedRoles: ["superadmin", "admin", "technical"],
        },
      ],
    },
    {
      title: "Workspace",
      allowedRoles: ["marcom"],
      subItems: [
        {
          label: "Tickets",
          icon: <LuTicketSlash size={16} />,
          link: "/dashboard/ticket",
        },
        {
          label: "Phần mềm lật trang",
          icon: <IoDocuments size={16} />,
          link: "/dashboard/flippageadmin",
          allowedRoles: ["superadmin", "admin", "marcom"],
        },
        {
          label: "Quản lý vinh danh",
          icon: <FaUserGraduate size={16} />,
          link: "/dashboard/halloffame",
          allowedRoles: ["superadmin", "admin", "marcom"],
        },
      ],
    },
    {
      title: "Workspace",
      allowedRoles: ["hr"],
      subItems: [
        {
          label: "Tickets",
          icon: <LuTicketSlash size={16} />,
          link: "/dashboard/ticket",
        },
        {
          label: "Quản lý tuyển dụng",
          icon: <FaUserTie size={16} />,
          link: "/dashboard/recruitmentadmin",
          allowedRoles: ["superadmin", "admin", "hr"],
        },
      ],
    },
    {
      title: "Workspace",
      allowedRoles: ["bos"],
      subItems: [
        {
          label: "Tickets",
          icon: <LuTicketSlash size={16} />,
          link: "/dashboard/ticket",
        },
        {
          label: "Quản lý vinh danh",
          icon: <FaUserGraduate size={16} />,
          link: "/dashboard/halloffame",
          allowedRoles: ["superadmin", "admin", "bos"],
        },
      ],
    },
    {
      title: "Workspace",
      allowedRoles: ["admission"],
      subItems: [
        {
          label: "Tickets",
          icon: <LuTicketSlash size={16} />,
          link: "/dashboard/ticket",
        },
        {
          label: "Phần mềm lật trang",
          icon: <IoDocuments size={16} />,
          link: "/dashboard/flippageadmin",
          allowedRoles: ["superadmin", "admin", "marcom"],
        },
        {
          label: "Tuyển sinh",
          icon: <FaUserGraduate size={16} />,
          link: "/dashboard/admission",
          allowedRoles: ["superadmin", "admin", "admission"],
        },
      ],
    },
    {
      title: "Settings",
      allowedRoles: ["superadmin", "admin"],
      subItems: [
        {
          label: "Quản lý người dùng",
          icon: <FiUser size={16} />,
          link: "/dashboard/users",
        },
        {
          label: "Quản lý học sinh",
          icon: <FiUsers size={16} />,
          link: "/dashboard/students",
        },
        {
          label: "Quản lý phòng học",
          icon: <FiHome size={16} />,
          link: "/dashboard/rooms",
        },
      ],
    },
    {
      title: "Settings",
      allowedRoles: ["bos"],
      subItems: [
        {
          label: "Quản lý học sinh",
          icon: <FiUsers size={16} />,
          link: "/dashboard/students",
        },
      ],
    },
  ];
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberedEmail");
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full backdrop-blur-lg bg-white/10 shadow-lg border-r border-gray-200  transition-all duration-300 ease-in-out p-4 rounded-xl z-10",
        effectiveCollapsed ? "w-24 min-w-[5rem]" : "w-64 min-w-[16rem]"
      )}
      onMouseEnter={() => {
        if (!isPinned) setIsHovered(true);
        setIsSidebarHovered(true); // Cập nhật Dashboard
      }}
      onMouseLeave={() => {
        if (!isPinned) setIsHovered(false);
        setIsSidebarHovered(false); // Cập nhật Dashboard
      }}
    >
      {/* HEADER */}
      <div className="relative flex items-center justify-between px-2 py-3 z-10 border-b-2">
        <div className="flex justify-center w-full relative">
          {!effectiveCollapsed ? (
            <img
              src={"/icons/logo-small.png" || "http://via.placeholder.com/150"}
              alt="logo"
              className="w-[90%] border-gray-300 object-cover"
            />
          ) : (
            <img
              src={"/icons/logo-big.png" || "http://via.placeholder.com/150"}
              alt="logo"
              className="w-[30%] rounded-full  border-gray-300 object-cover"
            />
          )}
        </div>
        {/* Nút toggle: chuyển đổi giữa trạng thái pinned và unpinned */}
        {/* <button
          onClick={() => {
            setIsPinned(!isPinned);
            setIsSidebarOpen(!isPinned);
          }}
          className="absolute bg-white top-1/2 transform -translate-y-1/2 right-[-28px] rounded-full shadow-lg border p-2 transition-all duration-300 z-50 hover:scale-110"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {effectiveCollapsed ? (
            <FiChevronRight size={16} />
          ) : (
            <FiChevronLeft size={16} />
          )}
        </button> */}
      </div>

      {/* MENU */}
      <nav className="max-h-[75%] overflow-y-auto flex-1 px-2 py-2 space-y-2">
        <Accordion type="single" collapsible>
          {menuItems.map((menu, index) => {
            if (menu.allowedRoles && !menu.allowedRoles.includes(role))
              return null;

            return (
              <AccordionItem
                key={index}
                value={menu.title}
                className="border-b border-gray-100"
              >
                <AccordionTrigger
                  className={cn(
                    "flex items-center font-bold w-full px-3 py-2 rounded-lg transition-colors duration-300"
                  )}
                  onClick={() => {
                    setSelectedMainMenu(menu.title);
                    if (menu.subItems.length > 0) {
                      setSelectedSubMenu(menu.subItems[0].label);
                    } else {
                      setSelectedSubMenu("");
                    }
                  }}
                >
                  {/* Chỉ hiển thị tiêu đề menu khi sidebar mở rộng */}
                  {!effectiveCollapsed && (
                    <span
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-opacity duration-300 ease-in-out",
                        isPinned ? "opacity-100" : "opacity-100 delay-300"
                      )}
                    >
                      {menu.title}
                    </span>
                  )}
                </AccordionTrigger>

                {/* Nếu mở rộng, hiển thị danh sách submenu với icon và text */}
                {!effectiveCollapsed && (
                  <AccordionContent>
                    <div className="ml-6 space-y-2">
                      {menu.subItems.map((sub, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => {
                            setSelectedSubMenu(sub.label);
                            navigate(sub.link); // Thay đổi URL theo thuộc tính link
                          }}
                          className={cn(
                            "flex items-center w-full px-3 py-2 rounded-md transition-colors duration-300",
                            selectedSubMenu === sub.label
                              ? "bg-gray-200 text-gray-900 shadow-sm"
                              : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          )}
                        >
                          {sub.icon && <span className="mr-2">{sub.icon}</span>}
                          <span
                            className={cn(
                              "text-sm font-bold whitespace-nowrap transition-opacity duration-300 ease-in-out",
                              isPinned ? "opacity-100" : "opacity-100 delay-300"
                            )}
                          >
                            {sub.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                )}

                {/* Ở trạng thái thu gọn, chỉ hiển thị các icon của submenu */}
                {effectiveCollapsed && (
                  <div className="mt-2 flex flex-col items-center space-y-2">
                    {menu.subItems.map((sub, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => {
                          setSelectedSubMenu(sub.label);
                          navigate(sub.link);
                        }}
                        className={cn(
                          "p-2 rounded-md transition-colors duration-300",
                          selectedSubMenu === sub.label
                            ? "bg-gray-200 text-gray-900 shadow-sm"
                            : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                        )}
                      >
                        {sub.icon}
                      </button>
                    ))}
                  </div>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
      <div className="absolute bottom-4 left-4">
        {!effectiveCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 w-full focus:outline-none"
            >
              <img
                src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-gray-300 object-cover object-top"
              />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold">
                  {currentUser.fullname || "User"}
                </span>
                <span className="text-[9px] font-medium text-gray-500">
                  {currentUser.email}
                </span>
              </div>
              <FaChevronRight />
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div
                ref={profileMenuRef}
                className="absolute left-60 bottom-0 w-60 bg-white   shadow-lg rounded-2xl border p-3"
              >
                <div className="flex items-center gap-3 p-2 border-b">
                  <img
                    src={
                      currentUser.avatarUrl || "http://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border border-gray-300 object-cover"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold">
                      {currentUser.fullname || "User"}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  className="flex items-center w-full px-3 py-2 text-[#002855] hover:bg-gray-100 rounded-lg"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <FaCircleUser size={20} className="mr-2" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-[#FF5733] hover:bg-gray-100 rounded-lg"
                >
                  <FaArrowRightFromBracket size={20} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-12 h-12 rounded-full border"
            >
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {/* Dropdown menu khi sidebar thu gọn */}
            {isProfileMenuOpen && (
              <div
                ref={profileMenuRef}
                className="absolute left-20 bottom-0 w-60 bg-white/10 shadow-lg rounded-2xl border p-3"
              >
                <div className="flex items-center gap-3 p-2 border-b mb-2">
                  <img
                    src={
                      currentUser.avatarUrl || "http://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      {currentUser.fullname || "User"}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  className="flex items-center w-full px-3 py-2 text-[#002855] hover:bg-gray-100 rounded-lg"
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <FaCircleUser size={20} className="mr-2" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-[#FF5733] hover:bg-gray-100 rounded-lg"
                >
                  <FaArrowRightFromBracket size={20} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
