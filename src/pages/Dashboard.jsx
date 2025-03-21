// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Import các component nội dung (điều chỉnh đường dẫn nếu cần)
import LaptopTable from "../components/inventory/LaptopTable";
import MonitorTable from "../components/inventory/MonitorTable";
import PrinterTable from "../components/inventory/PrinterTable";
import ProjectorTable from "../components/inventory/ProjectorTable";
import ToolTable from "../components/inventory/ToolTable";
import Ticket from "../components/ticket/Ticket";
import TicketAdminTable from "../components/ticket/TicketAdminTable";
import StudentTable from "../components/management/StudentTable";
import UserTable from "../components/management/UserTable";
import RoomTable from "../components/management/RoomTable";
import Profile from "../components/profile/Profile";
import Sidebar from "../components/Sidebar";
import DocumentTable from "../components/document/DocumentTable";
import DocumentDashboard from "../components/document/DocumentDashboard";
import FlippageAdmin from "../components/flippage/flippage-admin";
import RecruitmentAdmin from "../components/recruitment/recruitment-admin";
import HallOfFameAdminPage from "../components/halloffame/HallOfFameAdminPage";
import { API_URL, BASE_URL } from "../config";
import DashboardInventory from "../components/inventory/dashboard";
import BusRoutes from "../components/busService/BusRoutes";
import BusTrips from "../components/busService/BusTrips";
import BusVehicles from "../components/busService/BusVehicles";
import BusDashboard from "../components/busService/BusDashboard";

const urlToMenu = {
  devices: "Quản lý thiết bị",
  tickets: "Quản lý Tickets",
  documents: "Quản lý tài liệu",
  flippageadmin: "Phần mềm lật trang",
  profile: "Hồ sơ cá nhân",
  users: "Quản lý người dùng",
  students: "Quản lý học sinh",
  rooms: "Quản lý phòng học",
  recruitmentadmin: "Quản lý tuyển dụng",
  halloffame: "Quản lý vinh danh",
  bus: "Quản lý Bus",
};

const Dashboard = () => {
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
      "Dashboard",
      "Laptop || Desktop",
      "Màn hình",
      "Máy in",
      "Thiết bị trình chiếu",
      "Khác",
    ],
    "Quản lý Tickets": ["Ticket lists", "Teams", "Reports"],
    "Quản lý tài liệu": ["Tài liệu", "Báo cáo"],
    "Quản lý Bus": [
      "Giám sát",
      "Danh danh tuyến",
      "Danh sách xe",
      "Danh sách lịch trình",
    ],
    // Nếu có mục nào khác cần tab, bạn có thể thêm ở đây.
  };

  useEffect(() => {
    document.title = "360 Wisers | Hà Nội";
    // Cleanup function để reset title khi unmount
    return () => {
      document.title = "Wellspring";
    };
  }, []);

  // Lấy submenu từ URL
  useEffect(() => {
    const path = location.pathname.split("/")[2]; // Lấy đoạn sau `/dashboard/`
    if (path && urlToMenu[path]) {
      setSelectedSubMenu(urlToMenu[path]); // Chuyển đổi URL thành tên submenu
    }
  }, [location]);

  // Khi thay đổi submenu được chọn, nếu mục đó có tab thì mặc định chọn tab đầu tiên
  useEffect(() => {
    if (tabMapping[selectedSubMenu]) {
      setActiveTab(tabMapping[selectedSubMenu][0]);
    } else {
      setActiveTab("");
    }
  }, [selectedSubMenu]);

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
          // Token sai hoặc hết hạn
          localStorage.removeItem("authToken");
          localStorage.removeItem("role");
          window.location.href = "/login";
          return;
        }

        const data = await response.json();
        setCurrentUser({
          id: data._id,
          fullname: data.fullname || "Không xác định",
          jobTitle: data.jobTitle || "Không xác định",
          avatarUrl: data.avatarUrl
            ? `${BASE_URL}/uploads/Avatar/${data.avatarUrl}`
            : "http://via.placeholder.com/150",
          email: data.email || "",
          department: data.department || "Không xác định",
          role: data.role,
        });
      } catch (error) {
        console.error("Error fetching current user:", error.message);
        localStorage.removeItem("authToken");
        localStorage.removeItem("role");
        window.location.href = "/login";
      }
    };

    fetchCurrentUser();
  }, []);

  // --- Hàm render nội dung chính dựa theo mục (submenu) và tab con đang được chọn
  const renderContent = () => {
    switch (selectedSubMenu) {
      case "Quản lý thiết bị":
        if (activeTab === "Dashboard") return <DashboardInventory />;
        if (activeTab === "Laptop || Desktop") return <LaptopTable />;
        if (activeTab === "Màn hình") return <MonitorTable />;
        if (activeTab === "Máy in") return <PrinterTable />;
        if (activeTab === "Thiết bị trình chiếu") return <ProjectorTable />;
        if (activeTab === "Khác") return <ToolTable />;
        break;
      case "Quản lý Tickets":
        if (activeTab === "Ticket lists")
          return <TicketAdminTable currentUser={currentUser} />;
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

      case "Phần mềm lật trang":
        return <FlippageAdmin currentUser={currentUser} />;
      case "Tickets":
        return <Ticket currentUser={currentUser} />;
      case "Quản lý tuyển dụng":
        return <RecruitmentAdmin currentUser={currentUser} />;
      case "Quản lý vinh danh":
        return <HallOfFameAdminPage currentUser={currentUser} />;
      case "Quản lý Bus":
        if (activeTab === "Giám sát") return <BusDashboard />;
        if (activeTab === "Danh danh tuyến") return <BusRoutes />;
        if (activeTab === "Danh sách xe") return <BusVehicles />;
        if (activeTab === "Danh sách lịch trình") return <BusTrips />;
        break;
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
      {tabMapping[selectedSubMenu] &&
        tabMapping[selectedSubMenu].length > 0 && (
          <nav
            className={`sticky top-4 flex items-center justify-between rounded-full bg-white/10 p-2 backdrop-blur-xl transition-all duration-300 z-50 ${
              isSidebarOpen || isSidebarHovered ? "ml-64" : "ml-24"
            }`}
          >
            <div className="flex-1 flex justify-center ">
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
          </nav>
        )}

      {/* Sidebar mới */}
      <div className="z-50">
        <Sidebar
          currentUser={currentUser}
          selectedMainMenu={selectedMainMenu}
          setSelectedMainMenu={setSelectedMainMenu}
          selectedSubMenu={selectedSubMenu}
          setSelectedSubMenu={setSelectedSubMenu}
          setIsSidebarOpen={setIsSidebarOpen} // Truyền state xuống Sidebar
          setIsSidebarHovered={setIsSidebarHovered} // NEW
        />
      </div>
      {/* Nội dung chính */}
      <div
        className={`h-full p-8 transition-all duration-300 z-20 ${
          isSidebarOpen || isSidebarHovered ? "ml-64" : "ml-24"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
