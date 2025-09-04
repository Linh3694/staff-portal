// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import các component nội dung (điều chỉnh đường dẫn nếu cần)
import StudentClass from "../Management/student/studentClass";
import StudentSchoolYear from "../Management/student/studentSchoolYear";
import StudentStudent from "../Management/student/studentStudent";
import UserTable from "../Management/UserTable";
import Profile from "../Profile/Profile";
import Sidebar from "./Sidebar";
import DocumentTable from "../Documentation/DocumentTable";
import DocumentDashboard from "../Documentation/DocumentDashboard";
import FlippageAdmin from "../FlipPage/flippage-admin";
import RecruitmentAdmin from "../Recruitment/recruitment-admin";
import { API_URL, BASE_URL } from "../../core/config";

const urlToMenu = {
  documents: "Quản lý tài liệu",
  flippageadmin: "Phần mềm lật trang",
  profile: "Hồ sơ cá nhân",
  users: "Quản lý người dùng",
  students: "Quản lý học sinh",
  recruitment: "Quản lý tuyển dụng",
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
  const [selectedSubMenu, setSelectedSubMenu] = useState("Quản lý tài liệu");

  // --- State cho các tab con (cho các mục có nhiều tab, ví dụ: Quản lý thiết bị, Quản lý tickets)
  const [activeTab, setActiveTab] = useState("");

  // --- Cập nhật giao diện khi sidebar thay đổi
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // NEW

  // Định nghĩa cấu hình các tab cho một số mục
  const tabMapping = {
    "Quản lý học sinh": [
      { label: "Quản lý Năm học", param: "school-year" },
      { label: "Quản lý Lớp", param: "class" },
      { label: "Quản lý Học Sinh", param: "student" },
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
      // Nếu không map được => submenu mặc định
      setSelectedSubMenu("Quản lý tài liệu");
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
      case "Quản lý người dùng":
        return <UserTable />;

      case "Quản lý học sinh":
        if (activeTab === "school-year") return <StudentSchoolYear />;
        if (activeTab === "class") return <StudentClass />;
        if (activeTab === "student") return <StudentStudent />;
        break;

      case "Phần mềm lật trang":
        return <FlippageAdmin currentUser={currentUser} />;

      case "Quản lý tuyển dụng":
        return <RecruitmentAdmin currentUser={currentUser} />;

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
              Welcome to Dashboard
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
