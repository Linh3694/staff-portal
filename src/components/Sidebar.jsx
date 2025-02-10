import React, { useState } from "react";
import {
  FiRss,
  FiMessageCircle,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiMonitor,
  FiClipboard,
  FiUsers,
  FiHome,
  FiFolder,
} from "react-icons/fi";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";


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

  // Mặc định sidebar được pinned (mở cố định)
  const [isPinned, setIsPinned] = useState(true);
  // Trạng thái hover chỉ áp dụng khi không được pinned
  const [isHovered, setIsHovered] = useState(false);

  // Nếu được pinned thì luôn mở, nếu không thì thu gọn khi không hover
  const effectiveCollapsed = isPinned ? false : !isHovered;

  const role = currentUser.role?.toLowerCase();

  // Danh sách menu: các menu lớn không có icon, các submenu có icon đi kèm.
  const menuItems = [
    {
      title: "Social Hub",
      subItems: [
        { label: "Newsfeeds", icon: <FiRss size={16} />, link: "/dashboard/newsfeeds" },
        { label: "Chat", icon: <FiMessageCircle size={16} />, link: "/dashboard/chat" },
      ],
    },
    {
      title: "Workspace",
      allowedRoles: ["superadmin", "admin", "technical"],
      subItems: [
        { label: "Quản lý thiết bị", icon: <FiMonitor size={16} />, link: "/dashboard/devices" },
        { label: "Quản lý Tickets", icon: <FiClipboard size={16} />, link: "/dashboard/tickets" },
        { label: "Quản lý tài liệu", icon: <FiFolder size={16} />, link: "/dashboard/documents" },
      ],
    },
    {
      title: "Profile",
      subItems: [
        { label: "Hồ sơ cá nhân", icon: <FiUser size={16} />, link: "/dashboard/profile" },
      ],
    },
    {
      title: "Settings",
      allowedRoles: ["superadmin", "admin"],
      subItems: [
        { label: "Quản lý người dùng", icon: <FiUser size={16} />, link: "/dashboard/users" },
        { label: "Quản lý học sinh", icon: <FiUsers size={16} />, link: "/dashboard/students" },
        { label: "Quản lý phòng học", icon: <FiHome size={16} />, link: "/dashboard/rooms" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full backdrop-blur-lg bg-white/10 shadow-lg border-r border-gray-200 overflow-hidden transition-all duration-300 ease-in-out p-4 rounded-xl",
        effectiveCollapsed ? "w-24 min-w-[5rem]" : "w-64 min-w-[16rem]"
      )}
      
      onMouseEnter={() => {
        if (!isPinned) 
          setIsHovered(true);
          setIsSidebarHovered(true); // Cập nhật Dashboard
      }}
      onMouseLeave={() => {
        if (!isPinned) 
          setIsHovered(false);
          setIsSidebarHovered(false); // Cập nhật Dashboard
      }}
    >

      {/* HEADER */}
      <div className="relative flex items-center justify-between px-2 py-3 z-10">
        { !effectiveCollapsed ? (
          <div className="flex items-center gap-3">
            {/* Avatar với online indicator */}
            <div className="relative">
              <img
                src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-gray-300 object-cover"
              />
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>
            <span
              className={cn(
                "font-medium whitespace-nowrap transition-opacity duration-300 ease-in-out",
                // Nếu sidebar được pin (mở cố định) thì hiện ngay, nếu không thì delay xuất hiện sau 300ms (đã đủ thời gian mở rộng container)
                isPinned ? "opacity-100" : "opacity-100 delay-300"
              )}
            >
              {currentUser.fullname || "User"}
            </span>
          </div>
        ) : (
          <div className="flex justify-center w-full relative">
            {/* Avatar ở chế độ thu gọn */}
            <img
              src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-gray-300 object-cover"
            />
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
          </div>
        )}

        {/* Nút toggle: chuyển đổi giữa trạng thái pinned và unpinned */}
        <button
          onClick={() => {
            setIsPinned(!isPinned);
            setIsSidebarOpen(!isPinned); // Cập nhật trạng thái sidebar
          }}
          className="absolute top-24 left-full -translate-x-12 -translate-y-1/2 p-2  transition-all duration-300 z-50 hover:scale-110"
          style={{
            transform: effectiveCollapsed ? "translate(-50%, -50%) scale(0.7)" : "translate(-50%, -50%) scale(1)", // Khi thu gọn, nút nhỏ hơn
          }}
        >
          {effectiveCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Accordion type="single" collapsible>
          {menuItems.map((menu, index) => {
            if (menu.allowedRoles && !menu.allowedRoles.includes(role)) return null;

            return (
              <AccordionItem key={index} value={menu.title} className="border-b border-gray-100">
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
    </aside>
  );
};

export default Sidebar;