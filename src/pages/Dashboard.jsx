import React, { useState, useEffect, useRef } from "react";
import LaptopTable from "../components/LaptopTable";
import DesktopTable from "../components/DesktopTable";
import AccessoriesTable from "../components/AccessoriesTable";
import PrinterTable from "../components/PrinterTable";
import ProjectorTable from "../components/ProjectorTable";
import ClientTable from "../components/ClientTable";
import { useNavigate } from "react-router-dom";
import { FiHome, FiPackage, FiUser, FiBook, FiClock, FiFileText } from "react-icons/fi";
import axios from "axios";
import Profile from "../components/Profile";
import { FiLogOut } from 'react-icons/fi';



const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Laptop");
  const [selectedCategory, setSelectedCategory] = useState("Dashboard");
  const [selectedSubCategory] = useState("Laptop");
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullname: "",
    role: "",
    avatar: "",
    email: "",
    title: "",
  });
  const profileMenuRef = useRef(null);
  const darkModeColors = {
    background: "#FFFFFF", // Nền tối hơn hiện tại
    text: "#F1F5F9", // Text trắng xám để dịu mắt
    cardBackground: "#334155", // Màu nền card
    buttonBackground: "#475569", // Màu nền nút bấm
    buttonHover: "#64748B", // Màu khi hover
    tableHeader: "#1E293B", // Header table
    tableRow: "#475569", // Row màu tối hơn
  };
  const lightModeColors = {
    background: "#F8FAFC", // Nền sáng hơn
    text: "#1E293B", // Text đậm
    cardBackground: "#FFFFFF", // Màu nền card
    buttonBackground: "#002147", // Màu nền nút bấm
    buttonHover: "#CBD5E1", // Màu khi hover
    tableHeader: "#E2E8F0", // Header table
    tableRow: "#F1F5F9", // Row màu nhạt hơn
  };

  const tabs = [
    { name: "Laptop", disabled: false },
    { name: "Desktop", disabled: false },
    { name: "Accessories", disabled: true }, 
    { name: "Printer", disabled: true },
    { name: "Projector", disabled: true }
  ];

  const colors = darkMode ? darkModeColors : lightModeColors;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberedEmail");
    navigate("/login");
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Hàm đồng bộ client
  const handleSyncClients = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      await axios.post("http://42.96.42.197:5001/api/sync-clients",{},
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      alert("Danh sách người dùng đã được cập nhật!");
      fetchClients();
    } catch (error) {
      console.error("Error syncing clients:", error.message);
      alert("Cập nhật thất bại.");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://42.96.42.197:5001/api/users/me", {
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
        fullname: data.fullname || "Không xác định",
        title: data.jobTitle || "Không xác định",
        avatar: data.avatar || "https://via.placeholder.com/150",
        email: data.email || "",
      });
  
      // Update localStorage
      localStorage.setItem("currentUser", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching current user:", error.message);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch('http://42.96.42.197:5001/api/users', {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("role");
  
    if (!token) {
      console.log("Token không tồn tại hoặc hết hạn. Chuyển hướng đến login...");
      navigate("/login");
      return;
    }
  
    if (role !== "admin" && role !== "user") {
      console.log("Vai trò không hợp lệ. Chuyển hướng đến Unauthorized...");
      navigate("/unauthorized");
    }
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
  
    // Lắng nghe sự kiện click bên ngoài
    document.addEventListener("mousedown", handleClickOutside);
  
    // Dọn dẹp sự kiện khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://42.96.42.197:5001/api/users/me", {
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
        fullname: data.fullname || "Không xác định",
        title: data.jobTitle || "Không xác định",
        avatar: data.avatar || "https://via.placeholder.com/150",
        email: data.email || "",
      });

      // Cập nhật localStorage
      localStorage.setItem("currentUser", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching current user:", error.message);
    }
  };

  fetchCurrentUser();
}, []);

  const renderContent = () => {
    switch (selectedCategory) {
      case "Dashboard":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
              Welcome to the Dashboard
            </h2>
            <p>Choose a category from the sidebar to view details.</p>
          </div>
        );
      case "Inventory":
        return (
          <div>
              {/* <h2 className="text-2xl font-semibold mb-6 text-[#002147]">
                Danh sách {selectedSubCategory}
              </h2>  */}
          <div className=" grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 px-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                disabled={tab.disabled}
                className={`${
                  activeTab === tab.name
                    ? "text-xl text-semibold border-b-2 border-[#002147] text-[#002147]"
                    : "text-gray"
                } ${
                  tab.disabled 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:text-[#002147] cursor-pointer"
                } py-4 px-4 text-sm font-medium`}
                onClick={() => !tab.disabled && setActiveTab(tab.name)}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {/* Table Content */}
          {activeTab === "Laptop" && <LaptopTable />}
          {activeTab === "Desktop" && <DesktopTable />}
          {activeTab === "Accessories" && <AccessoriesTable />}
          {activeTab === "Printer" && <PrinterTable />}
          {activeTab === "Projector" && <ProjectorTable />}
        </div>
        );
      case "Attendance":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
              Attendance Management
            </h2>
            <p>Chức năng quản lý điểm danh hiện tại chưa được triển khai.</p>
          </div>
        );
      case "User":
        return (
          <div>
            <ClientTable clients={clients} setClients={setClients} handleSyncClients={handleSyncClients} />
          </div>
        );
      case "Logs":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">Logs</h2>
            <p>Chức năng quản lý logs hiện tại chưa được triển khai.</p>
          </div>
        );
      case "Documentation":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
              Documentation
            </h2>
            <p>Chức năng quản lý tài liệu hiện tại chưa được triển khai.</p>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
              Page Not Found
            </h2>
            <p>Danh mục bạn chọn không tồn tại.</p>
          </div>
        );
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: <FiHome /> },
    { label: "Inventory", icon: <FiPackage /> },
    { label: "Attendance", icon: <FiClock />},
    // { label: "User", icon: <FiUser /> },
    { label: "Logs", icon: <FiFileText /> },
    { label: "Documentation", icon: <FiBook /> },

  ];
  
  return (
    
    <div className="ml-64 min-h-screen bg-gray-50 ">
      <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl">
             <div className="ml-6 flex flex-col items-start">
                      {/* Dòng đầu: Pages / <category> */}
                      <p className="text-sm font-normal text-navy-700 dark:text-white">
                        Home /
                        <span className="font-medium capitalize text-navy-700 dark:text-white">
                          {selectedCategory}
                        </span>
                      </p>
                      
                      {/* Dòng thứ hai: <category> lớn hơn */}
                      <h1 className="text-xl font-bold capitalize text-navy-700 dark:text-white">
                        {selectedCategory}
                      </h1>
                      </div>

                  <div className="relative flex items-center justify-between gap-4 h-[61px] w-[300px] rounded-full bg-white px-4 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800">
                        <span className="text-[#002147] text-sm mr-2">
                              Hi, {currentUser.fullname || "User"}
                        </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 hover:border-gray-400"
                          onClick={toggleProfileMenu}
                        >
                          <img
                          src={currentUser.avatar || "https://via.placeholder.com/150"}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full border-1 border-gray-400 bg-white hover:bg-"
                          onClick={handleLogout} // Define this function to handle logout
                         >
                        <FiLogOut size={16} className="text-orange-red hover:text-orange-red-dark" />
                        </button>
                    </div>
             </div>
      </nav>  

              {isProfileMenuOpen && (
                  <div 
                    ref={profileMenuRef}
                    className="absolute right-0 top-14 bg-white rounded-lg shadow-lg p-4 w-48 mt-7 z-50">
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                      }}
                      className="block w-full text-left px-3 py-2 text-[#002147] hover:bg-gray-300 rounded-md"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-[#002147] hover:bg-gray-300 rounded-md"
                    >
                      Log Out
                    </button>
                  </div>
                )}
               
      {/* Sidebar */}
      <div className="w-64 fixed left-0 top-0 h-full shadow-lg z-50 flex flex-col"
        style={{
          zIndex: 1100,
          backgroundColor: colors.cardBackground,
        }}
      >
        {/* Sidebar giữ nguyên */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="relative inline-block">
            <img
              src={currentUser.avatar || "https://via.placeholder.com/150"}
              alt="User profile"
              className="w-20 h-20 rounded-full mx-auto ring-2 ring-blue-500"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150";
                }}
              />
              </div>
              <h2 className="mt-4 font-semibold text-lg" style={{ fontFamily: 'Mulish, sans-serif' }}>
              {currentUser.fullname || "Chưa đăng nhập"}
              </h2>
              <p className={`text-sm italic "text-gray-300" : "text-gray-600"`} style={{ fontFamily: 'Mulish, sans-serif' }}>
              {currentUser.title || "Chưa xác định"}
              </p>
            </div>
             {/* Navigation */}
        <nav className="flex-1 px-6 py-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                selectedCategory === item.label
                  ? darkMode
                    ? "bg-gray-800 text-white"
                    : "bg-[#002147] text-white"
                  : darkMode
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setSelectedCategory(item.label)}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {/* Users Section */}
            <button
              onClick={() => setSelectedCategory("User")}
              className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                selectedCategory === "User"
                  ? "bg-[#002147] text-white"
                  : "hover:bg-[#002147] hover:text-white text-gray-700"
              }`}
            >
              <FiUser size={16} className="mr-3" />
              <span>Quản lý người dùng</span>
            </button>
          </div>
      </div>
  
      {/* Main Content */}
      <div className="flex-1 p-8 z-10">
        {renderContent()}
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)} // Đóng modal
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div>
              {/* Tích hợp component Profile */}
              <Profile
                ticketHistory={[]} // Truyền dữ liệu ticketHistory nếu có
                assignedDevices={[]} // Truyền dữ liệu assignedDevices nếu có
                darkMode={false} // Điều chỉnh chế độ sáng/tối
                currentUser={currentUser} // Truyền ID người dùng
                setCurrentUser={setCurrentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Dashboard;