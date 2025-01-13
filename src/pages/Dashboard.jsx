import React, { useState, useEffect, useRef } from "react";
import LaptopTable from "../components/inventory/LaptopTable";
import ToolTable from "../components/inventory/ToolTable";
import PrinterTable from "../components/inventory/PrinterTable";
import ProjectorTable from "../components/inventory/ProjectorTable";
import MonitorTable from "../components/inventory/MonitorTable";
import UserTable from "../components/UserTable";
import RoomTable from '../components/RoomTable'; 
import Attendance from '../components/Attendance'; // Adjust the path as necessary
import { useNavigate } from "react-router-dom";
import { FiHome, FiPackage, FiUser, FiBook, FiClock, FiFileText, FiBriefcase } from "react-icons/fi";
import {IoMdNotificationsOutline} from "react-icons/io";
import axios from "axios";
import Dropdown from "../components/function/dropdown";
import TicketAdminTable from "../components/ticket/TicketAdminTable";
import TeamManagement from "../components/ticket/TeamManagement";
import TicketReports from "../components/ticket/TicketReports";
import EventManagement from "../components/EventManagement"
import Profile from "../components/Profile";
import { toast } from "react-toastify";



const Dashboard = () => {
  const tabMapping = {
    "Quản lý thiết bị": ["Laptop || Desktop", "Màn hình", "Máy in", "Thiết bị trình chiếu", "Khác"],
    "Quản lý tickets": ["Ticket lists", "Teams", "Reports"],
    "Quản lý chấm công": ["Báo cáo chấm công", "Phê duyệt đơn"],
    "Quản lý người dùng": ["Tài khoản", "Quyền hạn", "Hoạt động gần đây"],
    "Quản lý sự kiện": ["Danh sách sự kiện"],

  };

  const [activeTab, setActiveTab] = useState("Laptop || Desktop");
  const [tabs, setTabs] = useState(tabMapping["Quản lý thiết bị"]); // Mặc định là tabs của "Quản lý kho"
  const [selectedCategory, setSelectedCategory] = useState("Dashboard");
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id:"",
    fullname: "",
    role: "",
    avatarUrl: "",
    email: "",
    jobTitle: "",
    department: "",
  });
  const profileMenuRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  useEffect(() => {
    if (tabMapping[selectedCategory]) {
      const newTabs = tabMapping[selectedCategory];
      setTabs(newTabs);
      setActiveTab(newTabs[0]); // Tab đầu tiên là mặc định
    } else {
      setTabs([]); // Nếu không tìm thấy, đặt tabs là mảng rỗng
      setActiveTab(""); // Xóa giá trị tab đang hoạt động
    }
  }, [selectedCategory]);

  
  useEffect(() => {
    // Fetch unread notifications when the component mounts
    fetchLatestNotifications();
  }, []);

  // Hàm fetch notifications
  const fetchLatestNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await axios.get('/api/notifications/latest', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setNotifications(response.data.notifications); // Update notifications
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-as-read', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true }))); // Mark all as read
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

 const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/mark-as-read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setNotifications(notifications.map(notification =>
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberedEmail");
    navigate("/login");
  };

  const handleSaveProfile = async (updatedUser, avatarFile) => {
    console.log ("Payload",updatedUser)
    try {
      // Kiểm tra nếu tài khoản được kích hoạt nhưng chưa nhập mật khẩu
      const isReactivatingAccount = currentUser.disabled && !updatedUser.disabled;

      if (isReactivatingAccount && !updatedUser.newPassword) {
        toast.error("Vui lòng nhập mật khẩu mới để kích hoạt tài khoản!");
        return;
      }
      if (!updatedUser.id) {
        throw new Error("ID của người dùng không tồn tại.");
      }
  
      console.log("Updated User Payload:", updatedUser);

      // Sử dụng FormData để gửi dữ liệu, bao gồm cả file
        const formData = new FormData();
        formData.append("fullname", updatedUser.fullname);
        formData.append("disabled", updatedUser.disabled);
        formData.append("jobTitle", updatedUser.jobTitle);
        formData.append("department", updatedUser.department);
        formData.append("role", updatedUser.role);
        formData.append("employeeCode", updatedUser.employeeCode);
        if (updatedUser.newPassword) {
          formData.append("newPassword", updatedUser.newPassword);
        }
        const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedUser),formData,
      });
  
      if (response.status === 400) {
        toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại!");
        return
      } else if (response.status === 404) {
        toast.error("Người dùng không tồn tại!");
        return;
      } else if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      toast.success("Cập nhật người dùng thành công!");
      const updatedClient = await response.json(); // Lấy dữ liệu cập nhật từ backend
      setClients((prevClients) =>
        prevClients.map((client) =>
          client._id === updatedClient._id
            ? { ...client, ...updatedClient }
            : client
        )
      );
    } catch (error) {
      console.error("Error updating user:", error.message);
      toast.error("Lỗi khi cập nhật người dùng.");
    }
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
      await axios.post("/api/sync-clients",{},
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

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/users', {
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
      const response = await fetch("/api/users/me", {
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
          ? `https://42.96.42.197:5001${data.avatarUrl}`
          : "http://via.placeholder.com/150",
        email: data.email || "",
        department: data.department || "Không xác định",
        attendance: data.attendanceLog || [],
        role:data.role
      });
      console.log(data)
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

              case "Quản lý thiết bị":
                return (
                  <div>
                    {activeTab === "Laptop || Desktop" && <LaptopTable />}
                    {activeTab === "Màn hình" && <MonitorTable />}
                    {activeTab === "Máy in" && <PrinterTable />}
                    {activeTab === "Thiết bị trình chiếu" && <ProjectorTable />}
                    {activeTab === "Khác" && <ToolTable />}
                  </div>
                );

                case "Quản lý tickets":
                  return (
                    <div>
                      {activeTab === "Ticket lists" && <TicketAdminTable currentUser={currentUser} />}
                      {activeTab === "Teams" && <TeamManagement />}
                      {activeTab === "Reports" && <TicketReports />}
                    </div>
                  );

                case "Quản lý sự kiện":
                return (
                  <div>
                    {activeTab === "Danh sách sự kiện" && <EventManagement />} {/* Component quản lý danh sách */}
                  </div>
                );

              case "Quản lý chấm công":
                return (
                  <div>
                    {activeTab === "Báo cáo chấm công" && <Attendance currentUser={currentUser} view="daily"/>}
                    {activeTab === "Phê duyệt đơn" && <Attendance view="history" />}
                  </div>
                );

              case "Quản lý người dùng":
                return (
                  <div>
                    {activeTab === "Tài khoản" && (
                      <UserTable clients={clients} setClients={setClients} handleSyncClients={handleSyncClients} />
                    )}
                    {activeTab === "Quyền hạn" && <p>Hiển thị quản lý quyền hạn</p>}
                    {activeTab === "Hoạt động gần đây" && <p>Hiển thị hoạt động gần đây</p>}
                  </div>
                );

              case "Nhật ký hệ thống":
                return (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[#002147]">Logs</h2>
                    <p>Chức năng quản lý logs hiện tại chưa được triển khai.</p>
                  </div>
                );

              case "Tài liệu":
                return (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[#002147]">
                      Documentation
                    </h2>
                    <p>Chức năng quản lý tài liệu hiện tại chưa được triển khai.</p>
                  </div>
                );

              case "User":
                return (
                  <div>
                    <UserTable clients={clients} setClients={setClients} handleSyncClients={handleSyncClients} />
                  </div>
                );

              case "Room":
                return (
                  <div>
                    <RoomTable clients={clients} setClients={setClients} handleSyncClients={handleSyncClients} />
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
    // { label: "Bảng tin", icon: <FiHome /> },
    { label: "Quản lý thiết bị", icon: <FiPackage /> },
    { label: "Quản lý tickets", icon: <FiFileText /> },
    // { label: "Quản lý chấm công", icon: <FiClock /> },
    // { label: "Quản lý tài liệu", icon: <FiBook /> },
    { label: "Quản lý sự kiện", icon: <FiBook /> }, // Thêm mục mới
    // { label: "User Management", icon: <FiUser /> },
    // { label: "Departments", icon: <FiBriefcase /> },
  ];

  
  return (
    
    <div className="min-h-screen bg-[#f8f8f8]" >
      <nav className="ml-64 sticky top-4 z-40 flex items-center justify-between rounded-full bg-white/10 p-2 backdrop-blur-xl">
        <div className="flex-1 flex justify-center">
           {tabs.length > 0 && ( 
                <div className="flex items-center gap-1 h-[61px] bg-white p-4 rounded-full shadow-xl border">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        // disabled={tab.disabled}
                        className={`flex font-bold items-center gap-2 px-4 py-2 rounded-full transform transition-colors transition-transform duration-300  hover:scale-105 ${
                          activeTab === tab
                            ? "bg-[#002147] text-white"
                            : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        } ${
                          tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {/* Thêm biểu tượng nếu cần */}
                        <span className="text-sm font-medium">{tab}</span>
                      </button>
                    ))}
                  </div>
                   )}
              </div> 
             
                  <div className="flex items-center justify-end space-x-4 sm:w-auto gap-1 h-[61px] w-300 rounded-full bg-white px-4 py-2 shadow-xl shadow-shadow-500 border">
                        <span className="text-[#002147] text-sm mr-2">
                              Hi, {currentUser.fullname || "User"}
                        </span>
                        <Dropdown
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
                                <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 sm:w-[460px]">
                                  <div className="flex items-center justify-between">
                                    <p className="text-base font-bold text-navy-700 ">Thông báo</p>
                                    <p
                                      onClick={markAllAsRead}
                                      className="text-sm font-bold text-navy-700  cursor-pointer"
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
                                              notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                                            }`}onClick={() => markNotificationAsRead(notification._id)}
                                          >
                                            <div>
                                              <p className="text-sm font-semibold text-navy-700 ">
                                                {notification.message}
                                              </p>
                                              <p className="text-xs text-gray-500 ">
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
                            />
                        <Dropdown
                              button={
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
                                  alt="Elon Musk"
                                />
                              }
                              animation="origin-top-right md:origin-top-right transition-all duration-300 ease-in-out"
                              children={
                                <div className="flex w-40 flex-col rounded-[20px] bg-[#f8f8f8] bg-cover bg-no-repeat shadow-xl shadow-shadow-500">
                                  <div className="flex flex-col p-2">
                                  <button
                                    onClick={() => setIsProfileModalOpen(true)} // Mở Modal Profile
                                    className="text-sm font-medium text-[#002147] transition duration-150 ease-out hover:ease-in items-end"
                                  >
                                    Profile
                                  </button>
                                  <button
                                    onClick={() => navigate("/ticket")} // Redirect đến trang /ticket
                                    className="text-sm font-medium text-[#002147] transition duration-150 ease-out hover:ease-in items-end"
                                  >
                                    Ticket Portal
                                  </button>
                                  <hr className="my-2 border-t border-gray-800" />
                                    <button
                                      onClick={handleLogout}
                                      className="text-sm font-medium text-red-500 hover:text-red-500 transition duration-150 ease-out hover:ease-in"
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
    <div className="flex">
      
      {/* Sidebar */}
      <div className="w-64 fixed left-0 top-0 h-full rounded-2xl shadow-lg z-50 flex flex-col border"
        style={{
          zIndex: 10,
        }}
      >
        {/* Sidebar giữ nguyên */}
        <div className="p-6 text-center border-b border-gray-200 ">
          <div className="relative inline-block">
          <img
              src={currentUser.avatarUrl || "http://via.placeholder.com/150"}
              alt="User profile"
              className="w-20 h-20 rounded-full mx-auto ring-2 ring-[#002417] object-cover"
              onError={(e) => {
                e.target.src = "http://via.placeholder.com/150";
              }}
            />
              </div>
              <h2 className="mt-4 font-semibold text-lg" style={{ fontFamily: 'Mulish, sans-serif' }}>
              {currentUser.fullname || "Chưa đăng nhập"}
              </h2>
              <p className={`text-xs italic "text-gray-300" : "text-gray-600"`} style={{ fontFamily: 'Mulish, sans-serif' }}>
              {currentUser.jobTitle || "Chưa xác định"}
              </p>
            </div>
             {/* Navigation */}
              <nav className="flex-1 px-6 py-4 space-y-3 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    className={`flex items-center font-semibold w-full px-3 py-2 rounded-md transform transition-colors transition-transform duration-300  hover:scale-105  ${
                      selectedCategory === item.label
                           ? "bg-[#002147] text-white"
                           : "hover:bg-[#002147] hover:text-white text-gray-700"
                    }`}
                    onClick={() => setSelectedCategory(item.label)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
        
        <div className="px-6 py-4 border-t border-gray-200">
            {/* Users Section */}
            <button
              onClick={() => setSelectedCategory("User")}
              className={`flex items-center w-full font-semibold px-3 py-2 rounded-md transform transition-colors transition-transform duration-300  hover:scale-105 mb-4 ${
                selectedCategory === "User"
                  ? "bg-[#002147] text-white"
                  : "hover:bg-[#002147] hover:text-white text-gray-700"
              }`}
            >
              <FiUser size={16} className="mr-3" />
              <span>Quản lý người dùng</span>
            </button>
            {/* Room Section */}
            <button
              onClick={() => setSelectedCategory("Room")}
              className={`flex items-center w-full font-semibold px-3 py-2 rounded-md transform transition-colors transition-transform duration-300  hover:scale-105 mb-4 ${
                selectedCategory === "Room"
                  ? "bg-[#002147] text-white"
                  : "hover:bg-[#002147] hover:text-white text-gray-700"
              }`}
            >
              <FiHome size={16} className="mr-3" />
              <span>Quản lý lớp học</span>
            </button>
          </div>
      </div>
    </div>
      {/* Main Content */}
      <div className="ml-64 h-full p-8 z-10">
        {renderContent()}
      </div>
      {isProfileModalOpen && (
                                      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                                        <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-7xl">
                                          <Profile
                                            user={currentUser}
                                            onSave={handleSaveProfile}
                                            onBack={() => setIsProfileModalOpen(false)} // Đóng Modal
                                          />
                                        </div>
                                      </div>
                                    )}
    </div>
  );
}
export default Dashboard;
