// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import các component nội dung (điều chỉnh đường dẫn nếu cần)
import LaptopTable from "../components/inventory/LaptopTable";
import MonitorTable from "../components/inventory/MonitorTable";
import PrinterTable from "../components/inventory/PrinterTable";
import ProjectorTable from "../components/inventory/ProjectorTable";
import ToolTable from "../components/inventory/ToolTable";
import Ticket from "../components/ticket/Ticket";
import TicketTeam from "../components/ticket/TicketTeam";
import TicketAdminTable from "../components/ticket/TicketAdminTable";
import EmailIntegration from "../components/ticket/EmailIntegration";
import StudentClass from "../components/management/student/studentClass";
import StudentSchoolYear from "../components/management/student/studentSchoolYear";
import StudentStudent from "../components/management/student/studentStudent";
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
import LibraryReport from "../components/library/libraryReport";
import LibraryData from "../components/library/libraryData";
import LibraryManagement from "../components/library/libraryManagement";

const urlToMenu = {
  devices: "Quản lý thiết bị",
  ticket: "Tickets",
  ticketsadmin: "Quản lý Tickets",
  documents: "Quản lý tài liệu",
  flippageadmin: "Phần mềm lật trang",
  profile: "Hồ sơ cá nhân",
  users: "Quản lý người dùng",
  students: "Quản lý học sinh",
  rooms: "Quản lý phòng học",
  recruitmentadmin: "Quản lý tuyển dụng",
  halloffame: "Quản lý vinh danh",
  bus: "Quản lý Bus",
  library: "Quản lý Thư viện",
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
  const [selectedSubMenu, setSelectedSubMenu] = useState("Tickets");

  // --- State cho các tab con (cho các mục có nhiều tab, ví dụ: Quản lý thiết bị, Quản lý tickets)
  const [activeTab, setActiveTab] = useState("");

  // --- Cập nhật giao diện khi sidebar thay đổi
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // NEW

  // Định nghĩa cấu hình các tab cho một số mục
  const tabMapping = {
    "Quản lý thiết bị": [
      { label: "Dashboard", param: "dashboard" },
      { label: "Laptop || Desktop", param: "laptop" },
      { label: "Màn hình", param: "monitor" },
      { label: "Máy in", param: "printer" },
      { label: "Thiết bị trình chiếu", param: "projector" },
      { label: "Khác", param: "other" },
    ],
    "Quản lý Tickets": [
      { label: "Ticket lists", param: "ticket-lists" },
      { label: "Teams", param: "teams" },
      { label: "Reports", param: "reports" },
    ],
    "Quản lý Bus": [
      { label: "Giám sát", param: "dashboard" },
      { label: "Danh danh tuyến", param: "routes" },
      { label: "Danh sách xe", param: "vehicles" },
      { label: "Danh sách lịch trình", param: "trips" },
    ],
    "Quản lý học sinh": [
      { label: "Quản lý Năm học", param: "school-year" },
      { label: "Quản lý Lớp", param: "class" },
      { label: "Quản lý Học Sinh", param: "student" },
    ],
    "Quản lý Thư viện": [
      { label: "Quản lý dữ liệu", param: "library-data" },
      { label: "Quản lý Sách", param: "library-books" },
      { label: "Báo Cáo", param: "library-report" },
    ],
    "Quản lý tài liệu": [
      { label: "Tài liệu", param: "document" },
      { label: "Báo cáo", param: "report" },
    ],
  };

  useEffect(() => {
    document.title = "360 Wisers | Hà Nội";
    return () => {
      document.title = "Wellspring";
    };
  }, []);

  // Dashboard.jsx

  useEffect(() => {
    // Ví dụ /dashboard/devices/laptop
    // parts[0] = '', parts[1] = 'dashboard', parts[2] = 'devices', parts[3] = 'laptop'
    const parts = location.pathname.split("/");
    const mainKey = parts[2]; // 'devices'
    const subParam = parts[3]; // 'laptop'

    if (mainKey && urlToMenu[mainKey]) {
      setSelectedSubMenu(urlToMenu[mainKey]);
    } else {
      // Nếu không map được => submenu rỗng
      setSelectedSubMenu("Tickets");
    }

    // Nếu URL có param
    if (subParam) {
      setActiveTab(subParam);
    } else {
      // Nếu thiếu param => gán tab đầu tiên (nếu có)
      const menuName = urlToMenu[mainKey];
      if (menuName && tabMapping[menuName]?.length) {
        setActiveTab(tabMapping[menuName][0].param);
      } else {
        setActiveTab("");
      }
    }
  }, [location]);

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
        if (activeTab === "dashboard") return <DashboardInventory />;
        if (activeTab === "laptop") return <LaptopTable />;
        if (activeTab === "monitor") return <MonitorTable />;
        if (activeTab === "printer") return <PrinterTable />;
        if (activeTab === "projector") return <ProjectorTable />;
        if (activeTab === "other") return <ToolTable />;
        break;

      case "Quản lý Tickets":
        if (activeTab === "ticket-lists")
          return <TicketAdminTable currentUser={currentUser} />;
        if (activeTab === "teams")
          return <TicketTeam currentUser={currentUser} />;
        if (activeTab === "reports")
          return <EmailIntegration currentUser={currentUser} />;
        break;

      case "Quản lý người dùng":
        return <UserTable />;

      case "Quản lý học sinh":
        if (activeTab === "school-year") return <StudentSchoolYear />;
        if (activeTab === "class") return <StudentClass />;
        if (activeTab === "student") return <StudentStudent />;
        break;

      case "Quản lý phòng học":
        return <RoomTable />;

      case "Quản lý Thư viện":
        if (activeTab === "library-data") return <LibraryData />;
        if (activeTab === "library-books") return <LibraryManagement />;
        if (activeTab === "library-report") return <LibraryReport />;
        break;

      case "Phần mềm lật trang":
        return <FlippageAdmin currentUser={currentUser} />;
      case "Tickets":
        return <Ticket currentUser={currentUser} />;
      case "Quản lý tuyển dụng":
        return <RecruitmentAdmin currentUser={currentUser} />;
      case "Quản lý vinh danh":
        return <HallOfFameAdminPage currentUser={currentUser} />;
      case "Quản lý Bus":
        if (activeTab === "dashboard") return <BusDashboard />;
        if (activeTab === "routes") return <BusRoutes />;
        if (activeTab === "vehicles") return <BusVehicles />;
        if (activeTab === "trips") return <BusTrips />;
        break;

      case "Hồ sơ cá nhân":
        return (
          <div>
            <Profile userId={currentUser.id} onBack={() => {}} />
          </div>
        );
      case "Quản lý tài liệu":
        if (activeTab === "document") return <DocumentTable />;
        if (activeTab === "report") return <DocumentDashboard />;
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
                      key={tab.param}
                      onClick={() => {
                        setActiveTab(tab.param);
                        const mainKey = Object.keys(urlToMenu).find(
                          (k) => urlToMenu[k] === selectedSubMenu
                        );
                        navigate(`/dashboard/${mainKey}/${tab.param}`);
                      }}
                      className={`flex font-bold items-center gap-2 px-4 py-2 rounded-full transform transition-colors transition-transform duration-300 hover:scale-105 ${
                        activeTab === tab.param
                          ? "bg-[#002147] text-white"
                          : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                      }`}
                    >
                      <span className="text-sm font-medium">{tab.label}</span>
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
        className={`h-full  transition-all duration-300 z-20 ${
          isSidebarOpen || isSidebarHovered ? "ml-64" : "ml-24"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
