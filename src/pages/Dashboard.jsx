// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Dropdown from "../components/function/dropdown";

// Import các component nội dung (điều chỉnh đường dẫn nếu cần)
import LaptopTable from "../components/inventory/LaptopTable";
import MonitorTable from "../components/inventory/MonitorTable";
import PrinterTable from "../components/inventory/PrinterTable";
import ProjectorTable from "../components/inventory/ProjectorTable";
import ToolTable from "../components/inventory/ToolTable";
import TicketAdminTable from "../components/ticket/TicketAdminTable";
import TeamManagement from "../components/ticket/TeamManagement";
import TicketReports from "../components/ticket/TicketReports";
import StudentTable from "../components/StudentTable";
import UserTable from "../components/UserTable";
import RoomTable from "../components/RoomTable";
import Profile from "../components/Profile";
import Sidebar from "../components/Sidebar";
import DocumentTable from "../components/document/DocumentTable";
import DocumentDashboard from "../components/document/DocumentDashboard";
import NewsfeedPage from "./NewsfeedPage"
import { API_URL, BASE_URL } from "../config";

const menuToUrl = {
  "Quản lý thiết bị": "devices",
  "Quản lý Tickets": "tickets",
  "Quản lý tài liệu": "documents",
};

const urlToMenu = {
     devices: "Quản lý thiết bị",
     tickets: "Quản lý Tickets",
     documents: "Quản lý tài liệu",
     newsfeeds: "Newsfeeds",
     chat: "Chat",
     profile: "Hồ sơ cá nhân",
     users: "Quản lý người dùng",
     students: "Quản lý học sinh",
     rooms: "Quản lý phòng học",
 };


const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- State cho dữ liệu người dùng, thông báo, v.v.
  const [currentUser, setCurrentUser] = useState({
    id: "",
    fullname: "",
    role: "",
    avatarUrl: "",
    email: "",
    jobTitle: "",
    department: "",
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // --- State của Sidebar: menu chính và submenu được chọn
  // Mặc định mở nhóm "Workspace" và submenu đầu tiên là "Quản lý thiết bị"
  const [selectedMainMenu, setSelectedMainMenu] = useState("Workspace");
  const [selectedSubMenu, setSelectedSubMenu] = useState("");

  // --- State cho các tab con (cho các mục có nhiều tab, ví dụ: Quản lý thiết bị, Quản lý tickets)
  const [activeTab, setActiveTab] = useState("");

  // --- Cập nhật giao diện khi sidebar thay đổi
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // NEW

  // Định nghĩa cấu hình các tab cho một số mục
  const tabMapping = {
    "Quản lý thiết bị": [
      "Laptop || Desktop",
      "Màn hình",
      "Máy in",
      "Thiết bị trình chiếu",
      "Khác",
    ],
    "Quản lý Tickets": [
      "Ticket lists",
      "Teams",
      "Reports",
    ],
    "Quản lý tài liệu": [
      "Tài liệu", 
      "Báo cáo",
    ], 
    // Nếu có mục nào khác cần tab, bạn có thể thêm ở đây.
  };

  // Lấy submenu từ URL
  useEffect(() => {
    const path = location.pathname.split("/")[2]; // Lấy đoạn sau `/dashboard/`
    if (path && urlToMenu[path]) {
      setSelectedSubMenu(urlToMenu[path]); // Chuyển đổi URL thành tên submenu
    }
  }, [location]);

  // Cập nhật URL khi chọn submenu
  const handleSelectSubMenu = (menu) => {
    setSelectedSubMenu(menu);
    navigate(`/dashboard/${menuToUrl[menu] || "dashboard"}`); // Chuyển đổi submenu thành URL ngắn
  };

  // Khi thay đổi submenu được chọn, nếu mục đó có tab thì mặc định chọn tab đầu tiên
  useEffect(() => {
    if (tabMapping[selectedSubMenu]) {
      setActiveTab(tabMapping[selectedSubMenu][0]);
    } else {
      setActiveTab("");
    }
  }, [selectedSubMenu]);

  // --- Xử lý thông báo
  useEffect(() => {
    fetchLatestNotifications();
  }, []);

  const fetchLatestNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await axios.get(`${API_URL}/notifications/latest`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        `${API_URL}/notifications/mark-all-as-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setNotifications(
        notifications.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${API_URL}/notifications/${notificationId}/mark-as-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberedEmail");
    navigate("/login");
  };

  // --- Lấy dữ liệu người dùng hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setCurrentUser({
          id: data._id,
          fullname: data.fullname || "Không xác định",
          jobTitle: data.jobTitle || "Không xác định",
          avatarUrl: data.avatarUrl
            ? `${BASE_URL}${data.avatarUrl}`
            : "http://via.placeholder.com/150",
          email: data.email || "",
          department: data.department || "Không xác định",
          role: data.role,
        });
        localStorage.setItem("currentUser", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching current user:", error.message);
      }
    };

    fetchCurrentUser();
  }, []);

  // --- Hàm render nội dung chính dựa theo mục (submenu) và tab con đang được chọn
  const renderContent = () => {
    switch (selectedSubMenu) {
      case "Quản lý thiết bị":
        if (activeTab === "Laptop || Desktop") return <LaptopTable />;
        if (activeTab === "Màn hình") return <MonitorTable />;
        if (activeTab === "Máy in") return <PrinterTable />;
        if (activeTab === "Thiết bị trình chiếu") return <ProjectorTable />;
        if (activeTab === "Khác") return <ToolTable />;
        break;
      case "Quản lý Tickets":
        if (activeTab === "Ticket lists")
          return <TicketAdminTable currentUser={currentUser} />;
        if (activeTab === "Teams") return <TeamManagement />;
        if (activeTab === "Reports") return <TicketReports />;
        break;
      case "Quản lý người dùng":
        return (
          <UserTable
            // Truyền props cần thiết (ví dụ: danh sách người dùng, hàm sync,…)
          />
        );
      case "Quản lý học sinh":
        return <StudentTable />;
      case "Quản lý phòng học":
        return (
          <RoomTable
            // Truyền các props cần thiết
          />
        );
      case "Newsfeeds":
        return (
          <NewsfeedPage currentUser={currentUser} />
        );
      case "Chat":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">Chat</h2>
            <p>Nội dung Chat ở đây.</p>
          </div>
        );
      case "Hồ sơ cá nhân":
        return (
          <div>
            <Profile userId={currentUser.id} onBack={() => {}} />
          </div>
        );
        case "Quản lý tài liệu":
        if (activeTab === "Tài liệu") return <DocumentTable />;
        if (activeTab === "Báo cáo") return <DocumentDashboard />;
        break;
      default:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
              Welcome
            </h2>
            <p>Vui lòng chọn một mục từ sidebar.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <nav
          className={`sticky top-4 flex items-center justify-between rounded-full bg-white/10 p-2 backdrop-blur-xl transition-all duration-300 ${
            isSidebarOpen || isSidebarHovered ? "ml-64" : "ml-24"
          }`}
        >       
         <div className="flex-1 flex justify-center">
          {/* Nếu mục được chọn có định nghĩa tab (ví dụ: Quản lý thiết bị, Quản lý Tickets) thì hiển thị thanh tab */}
          {tabMapping[selectedSubMenu] && (
            <div className="flex items-center gap-1 h-[61px] bg-white p-4 rounded-full shadow-xl border">
              {tabMapping[selectedSubMenu].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex font-bold items-center gap-2 px-4 py-2 rounded-full transform transition-colors transition-transform duration-300 hover:scale-105 ${
                    activeTab === tab
                      ? "bg-[#002147] text-white"
                      : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                  }`}
                >
                  <span className="text-sm font-medium">{tab}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end space-x-4 sm:w-auto gap-1 h-[61px] w-300 rounded-full bg-white px-4 py-2 shadow-xl border">
          <span className="text-[#002147] text-sm mr-2">
            Hi, {currentUser.fullname || "User"}
          </span>
          {/* <Dropdown
            button={
              <div className="relative cursor-pointer">
                <IoMdNotificationsOutline className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
            }
            animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
            children={
              <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl sm:w-[460px]">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-navy-700">Thông báo</p>
                  <p
                    onClick={markAllAsRead}
                    className="text-sm font-bold text-navy-700 cursor-pointer"
                  >
                    Đánh dấu là đã đọc
                  </p>
                </div>
                <div className="mt-4">
                  {loadingNotifications ? (
                    <p>Đang tải thông báo...</p>
                  ) : notifications.length === 0 ? (
                    <p>Không có thông báo nào.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {notifications.map((notification) => (
                        <li
                          key={notification._id}
                          className={`flex justify-between items-center rounded-md px-3 py-2 cursor-pointer ${
                            notification.isRead
                              ? "bg-gray-100"
                              : "bg-blue-100"
                          }`}
                          onClick={() =>
                            markNotificationAsRead(notification._id)
                          }
                        >
                          <div>
                            <p className="text-sm font-semibold text-navy-700">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            }
            classNames={"py-2 top-4 -left-[230px] md:-left-[440px] w-max"}
          /> */}
          <Dropdown
            button={
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
                alt="User Avatar"
              />
            }
            animation="origin-top-right md:origin-top-right transition-all duration-300 ease-in-out"
            children={
              <div className="flex w-40 flex-col rounded-[20px] bg-[#f8f8f8] shadow-xl">
                <div className="flex flex-col p-2">
                  <button
                    onClick={() => setSelectedSubMenu("Profile")}
                    className="text-sm font-medium text-[#002147] transition duration-150 hover:ease-in"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigate("/ticket")}
                    className="text-sm font-medium text-[#002147] transition duration-150 hover:ease-in"
                  >
                    Ticket Portal
                  </button>
                  <hr className="my-2 border-t border-gray-800" />
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 transition duration-150 hover:ease-in"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            }
            classNames={"py-2 top-10 -left-[140px] w-max"}
          />
        </div>
      </nav>

      {/* Sidebar mới */}
      <Sidebar
        currentUser={currentUser}
        selectedMainMenu={selectedMainMenu}
        setSelectedMainMenu={setSelectedMainMenu}
        selectedSubMenu={selectedSubMenu}
        setSelectedSubMenu={setSelectedSubMenu}
        setIsSidebarOpen={setIsSidebarOpen} // Truyền state xuống Sidebar
        setIsSidebarHovered={setIsSidebarHovered} // NEW
      />

      {/* Nội dung chính */}
      <div
        className={`h-full p-8 transition-all duration-300 ${
          isSidebarOpen || isSidebarHovered ? "ml-64" : "ml-24"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;