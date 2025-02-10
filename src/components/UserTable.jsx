import React, { useState, useEffect, useMemo } from "react";
import { MdCancel, MdCheckCircle, } from "react-icons/md";
import * as XLSX from "xlsx";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "./Profile";
import { API_URL, UPLOAD_URL, BASE_URL } from "../config"; // import từ file config


const UserTable = ({ handleSyncClients }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]); // thêm
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [isProfileView, setIsProfileView] = useState(false); // Quản lý trạng thái hiển thị
  const [assignedItems, setAssignedItems] = useState([]);
  
  const [newUser, setNewUser] = useState({
    fullname: "",
    email: "",
    employeeCode: "",
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
  

  // Lấy dữ liệu từ ${API_URL}//users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Đảm bảo token đúng
        },
      });
      // console.error("Token không tồn tại, vui lòng đăng nhập lại.");
      // toast.error("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
  
      if (!response.ok) {
        const errorText = await response.text(); // Đọc nội dung lỗi từ backend
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      toast.error(`Lỗi khi tải danh sách người dùng: ${error.message}`);
    }
  };

  // Gọi fetchUsers khi component được mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const statusClasses = {
    Active: "text-green-500 flex items-center",
    Inactive: "text-gray-400 flex items-center",
  };
  
  const statusLabels = {
    Active: "Active",
    Inactive: "Inactive",
  };

  const handleDeleteUser = (userId) => {
    setUserIdToDelete(userId); // Lưu ID người dùng cần xóa
    setIsDeleteModalOpen(true); // Hiển thị modal
  };


  const confirmDeleteUser = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userIdToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      toast.success("Xóa người dùng thành công!");
      setClients((prevClients) => prevClients.filter((client) => client._id !== userIdToDelete));
      setIsDeleteModalOpen(false); // Đóng modal
    } catch (error) {
      console.error("Error deleting user:", error.message);
      toast.error("Lỗi khi xóa người dùng.");
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.fullname.trim() || !newUser.email.trim() || !newUser.employeeCode.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
  
    if (newUser.active && newUser.password) {
      if (typeof newUser.password === "string" && !newUser.password.startsWith("$2")) {
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);
      }
    }
  
    const payload = {
      ...newUser,
      jobTitle: newUser.jobTitle || "Not Provided",
      department: newUser.department || "Unknown",
      role: newUser.role || "user",
    };
  
    console.log("Payload gửi lên:", payload); // Thêm log kiểm tra payload
  
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi từ server: ${errorText}`);
      }
  
      toast.success("Tạo người dùng mới thành công!");
      setIsAddUserModalOpen(false);
      setNewUser({ fullname: "", email: "", employeeCode: "", password: "" });
      await fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error.message);
      toast.error(`Lỗi khi tạo người dùng: ${error.message}`);
    }
  };

  const handleShowProfile = async (userId) => {
    const token = localStorage.getItem("authToken");
  
    try {
      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!userResponse.ok) throw new Error("Không thể tải thông tin người dùng!");
      const userData = await userResponse.json();
      console.log("User data:", userData);
  
      const assignedItemsResponse = await fetch(`${API_URL}/users/${userId}/assigned-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!assignedItemsResponse.ok) throw new Error("Không thể tải danh sách thiết bị được gán!");
      const assignedItemsData = await assignedItemsResponse.json();
      
      // Lấy danh sách tickets mà người dùng là creator
      const ticketsResponse = await fetch(`${API_URL}/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!ticketsResponse.ok) throw new Error("Không thể tải danh sách tickets!");
      const ticketsData = await ticketsResponse.json();
      console.log("Tickets Data:", ticketsData); 
      console.log("User ID:", userId); 
      // Lọc tickets theo userId
      // Lọc tickets theo người dùng dựa trên `creator._id`
      const userTickets = ticketsData.tickets.filter(
        (ticket) => ticket.creator?._id === userId
      );
        console.log("User tickets:", userTickets); 
      console.log("Assigned items:", assignedItemsData);
      setAssignedItems(assignedItemsData);
      setSelectedUser({ ...userData, assignedItems: assignedItemsData, tickets: userTickets });      
      setIsProfileView(true); // Chuyển sang chế độ xem profile
    } catch (error) {
      console.error("Error fetching user profile or assigned items:", error.message);
      toast.error("Không thể tải thông tin người dùng hoặc thiết bị được gán!");
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
  
    // Nếu ô search trống, hiển thị toàn bộ + xóa gợi ý
    if (!query) {
      setSuggestions([]);
      return; 
    }
  
    // Tạo mảng filtered tạm để lấy suggestions
    const filtered = clients.filter((client) => {
      // Gom nhiều trường (fullname, email, jobTitle, department…)
      const combinedText = [
        client.fullname || "",
        client.email || "",
        client.employeeCode || "",
        client.jobTitle || "",
        client.department || "",
      ]
        .join(" ")
        .toLowerCase();
  
      return combinedText.includes(query);
    });
  
    // Gợi ý => lấy 5-10 item đầu
    setSuggestions(filtered.slice(0, 5));
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('Vui lòng chọn file!');
      return;
    }
  
    try {
      // Đọc file Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      console.log("Dữ liệu từ file Excel:", jsonData);
  
      // Chuyển đổi dữ liệu Excel thành mảng
      const formattedData = jsonData.map((row) => ({
        email: row.email,
        fullname: row.fullname || undefined,
        jobTitle: row.title || undefined,
        department: row.department || undefined,
        employeeCode: row.employeeCode || undefined,
      }));
  
      console.log("Dữ liệu định dạng chuẩn:", formattedData);
  
      // Gửi toàn bộ dữ liệu dưới dạng mảng
      const response = await fetch(`${API_URL}/users/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ users: formattedData }), // Gửi mảng users
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi từ server: ${errorText}`);
      }
  
      toast.success('Dữ liệu đã được cập nhật thành công!');
      await fetchUsers(); // Làm mới danh sách người dùng
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu từ Excel:', error.message);
      toast.error('Lỗi khi tải file Excel. Vui lòng kiểm tra định dạng file.');
    }
  };
  
  const handleExportToExcel = async () => {
    try {
      const enrichedClients = await Promise.all(
        clients.map(async (client) => {
          try {
            console.log(`Đang lấy assigned items cho user: ${client.fullname}`);
            const response = await fetch(`${API_URL}/users/${client._id}/assigned-items`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            console.log("Response:", response);
            if (!response.ok) {
              console.warn(`Không thể lấy assigned items cho user: ${client.fullname}`);
              return { ...client, assignedItems: "Không có thiết bị" };
            }
  
            const responseData = await response.json();
            const items = [
              ...(responseData.items?.laptops || []).map((item) => ({ ...item, type: "Laptop" })),
              ...(responseData.items?.monitors || []).map((item) => ({ ...item, type: "Monitor" })),
              ...(responseData.items?.printers || []).map((item) => ({ ...item, type: "Printer" })),
              ...(responseData.items?.projectors || []).map((item) => ({ ...item, type: "Projector" })),
              ...(responseData.items?.tools || []).map((item) => ({ ...item, type: "Tool" })),
            ];
  
            const assignedItems =
              items.length > 0
                ? items.map((item) => `${item.type}: ${item.name} (SN: ${item.serial || "N/A"})`).join("; ")
                : "Không có thiết bị";
  
            return {
              ...client,
              assignedItems,
            };
          } catch (error) {
            
            return { ...client, assignedItems: "Không có thiết bị" };
          }
        })
      );
  
      const dataToExport = enrichedClients.map((client) => ({
        "Tên người dùng": client.fullname || "Không có",
        "Email": client.email || "Không có",
        "Mã nhân viên": client.employeeCode || "Không có",
        "Chức vụ": client.jobTitle || "Không có",
        "Phòng ban": client.department || "Không có",
        "Vai trò": client.role || "Không có",
        "Thiết bị được gán": client.assignedItems || "Không có thiết bị",
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách người dùng");
  
      XLSX.writeFile(workbook, "DanhSachNguoiDung.xlsx");
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error.message);
      toast.error("Lỗi khi xuất file Excel. Vui lòng thử lại!");
    }
  };


  // Lọc clients theo từ khóa tìm kiếm
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients; // Nếu ô search trống
  
    const keyword = searchTerm.toLowerCase();
  
    return clients.filter((client) => {
      const combinedText = [
        client.fullname || "",
        client.email || "",
        client.employeeCode || "",
        client.jobTitle || "",
        client.department || "",
      ]
        .join(" ")
        .toLowerCase();
  
      return combinedText.includes(keyword);
    });
  }, [clients, searchTerm]);

  const sortedClients = useMemo(() => {
    let sortableClients = [...filteredClients];
    if (sortConfig.key) {
      sortableClients.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableClients;
  }, [filteredClients, sortConfig]);

  // Phân trang dữ liệu
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedClients.slice(start, end);
  }, [sortedClients, currentPage, itemsPerPage]);

  // Tổng số trang
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Xử lý chỉnh sửa người dùng
  const handleEditUser = (user) => {
    if (!user || !user._id) {
      console.error("Người dùng không hợp lệ:", user);
      toast.error("Không thể chỉnh sửa người dùng này.");
      return;
    }
    console.log("User to edit:", user); // Debug giá trị user
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (updatedUser, avatarFile) => {
    try {
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
      if (avatarFile) {
        // Ảnh
        formData.append("avatar", avatarFile);
      }
  
      const response = await fetch(`${API_URL}/users/${updatedUser._id}`, {
        method: "PUT",
        headers: {
          // KHÔNG set "Content-Type"
          // fetch sẽ tự thêm boundary cho multipart/form-data
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        if (response.status === 400) toast.error("Dữ liệu không hợp lệ!");
        else if (response.status === 404) toast.error("Người dùng không tồn tại!");
        else toast.error(`Có lỗi xảy ra: ${response.statusText}`);
        return;
      }
  
      const updatedUserFromServer = await response.json();
      // updatedUserFromServer.avatarUrl có thể là "/uploads/Avatar/xxxx.jpg"
  
      toast.success("Cập nhật người dùng thành công!");
      await fetchUsers(); // gọi lại để refresh danh sách
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error.message);
      toast.error("Lỗi khi cập nhật người dùng.");
    }
  };


  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Vui lòng chọn một file hợp lệ.");
      return;
    }
    setAvatar(file);
    const fileUrl = URL.createObjectURL(file);
    setAvatarUrl(fileUrl);
  };

  const handleAvatarUpload = async (file, userId) => {
    console.log("Uploading avatar for user:", userId, "File:", file);
  
    const formData = new FormData();
    formData.append("avatar", file);
  
    try {
      const response = await fetch(`${API_URL}/users/${userId}/avatar`, {
        method: "PUT",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(errorText);
      }
  
      const data = await response.json();
      console.log("Avatar updated successfully:", data);
      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error.message);
      toast.error("Lỗi khi tải lên avatar!");
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
       {!isProfileView ? (
      <>
          <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-2xl font-bold text-navy-700">Danh sách người dùng</div>
          </div>

      {/* Thanh tìm kiếm */}
      <div className="flex justify-between items-center mb-2 mt-1">
      <input
        type="text"
        placeholder="Tìm kiếm người dùng..."
        className="border border-gray-300 rounded-md px-4 py-2 w-[300px]"
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => {
          // Khi focus, nếu searchTerm đã có thì hiển thị suggestions
          if (searchTerm && suggestions.length > 0) {
            setSuggestions(suggestions);
          }
        }}
      />
        <div className="flex justify-between items-right space-x-2 ">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3 py-2 bg-orange-red text-sm font-bold text-white rounded-lg shadow-md hover:bg-orange-red-dark transform transition-transform duration-300 hover:scale-105"
              >
                Tạo mới
              </button>
              <button
                onClick={handleExportToExcel}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635] transform transition-transform duration-300 hover:scale-105"
              >
                Xuất Excel
              </button>
              {/* Thêm nút Upload Excel */}
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                id="upload-excel"
                onChange={handleUploadExcel}
              />
              <label
                htmlFor="upload-excel"
                className="px-3 py-2 bg-[#009483] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#196619] cursor-pointer transform transition-transform duration-300 hover:scale-105"
              >
                Edit Excel
              </label>
        </div>

      </div>

      {/* Bảng */}
      <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
        
          <thead>
            <tr className="!border-px !border-gray-400">
              <th
                  className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start cursor-pointer"
                  onClick={() =>
                    setSortConfig({
                      key: "fullname",
                      direction: sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  <p className="text-sm font-bold text-gray-600">
                    TÊN {sortConfig.key === "fullname" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </p>
                </th>
                <th
                  className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start cursor-pointer"
                  onClick={() =>
                    setSortConfig({
                      key: "employeeCode",
                      direction: sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  <p className="text-sm font-bold text-gray-600">
                    MÃ NHÂN VIÊN {sortConfig.key === "employeeCode" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </p>
                </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">CHỨC VỤ</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">QUYỀN</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">TÌNH TRẠNG</p>
              </th>
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-center">
                <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td>
                <button 
                className="font-bold text-navy-700 hover:text-navy-900"
                onClick={() => handleShowProfile(client._id)}>{client.fullname}</button>
               <br/>
                  <span className="text-gray-500 italic text-sm">{client.email || "Not Provided"}</span>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.employeeCode || "Chưa có"}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.jobTitle || "Not Provided"}</p>
                  <p className="text-sm font-semibold italic text-gray-600">{client.department || "Not Provided"}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.role}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                    <div className={statusClasses[client.disabled ? "Inactive" : "Active"]}>
                      {client.disabled ? (
                        <MdCancel className="mr-1" />
                      ) : (
                        <MdCheckCircle className="mr-1" />
                      )}
                      <p className="text-sm font-bold">
                        {statusLabels[client.disabled ? "Inactive" : "Active"]}
                      </p>
                    </div>
                  </td>
                  <td className="min-w-[150px] border-white/0 py-3 pr-4 text-center">
                        <div className="flex justify-center space-x-2">
                          {/* Nút Edit */}
                          <button
                          onClick={() => handleEditUser(client)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiEdit size={14} />
                          </button>
                          <button
                          onClick={() => handleDeleteUser(client._id)}
                          className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                        >
                          <FiTrash2 size={14} />
                        </button>
                        </div>
                      </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex justify-between items-center mt-4">
            <div>
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147] disabled:bg-[#002147] disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="text-xs px-4 py-2">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2 py-1 text-xs font-semibold text-white border rounded bg-[#FF5733] hover:bg-[#002147] disabled:bg-[#002147] disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
            </div>
                <div className="flex items-center space-x-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                  className="border border-gray-300 font-semibold rounded-md px-5 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm">Users/Page</span>
                </div>
        </div>

        </>
        ) : (
          <Profile
          userId={selectedUser._id}          // <= chỉ cần ID
          onBack={() => setIsProfileView(false)}
        />
      )}
      
        {/* ------------------------------------------------------------------------------- Modal delete -------------------------------------------------------- */}
        {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Xác nhận xóa</h3>
                <p className="text-gray-600">Bạn có chắc chắn muốn xóa người dùng này không?</p>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ------------------------------------------------------------------------------- Modal cập nhật thông tin -------------------------------------------------------- */}
        {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Cập nhật thông tin người dùng</h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <label className="block mt-4">
                      Họ và tên:
                      <input
                        type="text"
                        value={selectedUser.fullname}
                        onChange={(e) => setSelectedUser({ ...selectedUser, fullname: e.target.value })}
                        className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                      />
                        {/* Thêm input Mã nhân viên */}
                      <label className="block mt-4">
                        Mã nhân viên:
                        <input
                          type="text"
                          value={selectedUser.employeeCode || ""}
                          onChange={(e) => setSelectedUser({ ...selectedUser, employeeCode: e.target.value })}
                          className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                        />
                      </label>
                      <label className="block mt-4">
                        Chức vụ:
                        <input
                          type="text"
                          value={selectedUser.jobTitle || ""}
                          onChange={(e) => setSelectedUser({ ...selectedUser, jobTitle: e.target.value })}
                          className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                        />
                      </label>
                      <label className="block mt-4">
                        Phòng ban:
                        <input
                          type="text"
                          value={selectedUser.department || ""}
                          onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                          className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                        />
                      </label>
                       {/* Thêm trường chọn Role */}
                          <label className="block mt-4">
                            Vai trò:
                            <select
                              value={selectedUser.role}
                              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                              className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                            >
                              <option value="user">Người dùng</option>
                              <option value="admin">Quản trị viên</option>
                            </select>
                          </label>
                    </label>
                    <div>
                          Ảnh đại diện (Avatar):
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                          />
                        </div>
                        {avatarUrl && (
                          <div className="mt-4">
                            <img src={avatarUrl} alt="Avatar Preview" className="w-32 h-32 rounded-full" />
                          </div>
                        )}
                        <button
                          onClick={handleAvatarUpload}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                        >
                          Upload Avatar
                        </button>

                    <div className="flex items-center justify-between mt-4">
                      <label htmlFor="activateAccount" className="text-sm font-bold">
                        Kích hoạt tài khoản
                      </label>
                      <input
                        type="checkbox"
                        id="activateAccount"
                        checked={!selectedUser.disabled}
                        onChange={(e) => setSelectedUser({ ...selectedUser, disabled: !e.target.checked })}
                        className="toggle-switch"
                      />
                    </div>

                    {!selectedUser.disabled && (
                      <label className="block mt-4">
                        Mật khẩu mới:
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu mới"
                          onChange={(e) => setSelectedUser({ ...selectedUser, newPassword: e.target.value })}
                          className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                          required
                        />
                      </label>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveUser(selectedUser)}
                        className="px-4 py-2 bg-[#002147] text-white rounded shadow hover:bg-blue-600"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
           
            
                {isAddUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-800">Tạo người dùng mới</h3>
                          <button
                            onClick={() => setIsAddUserModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            &times;
                          </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCreateUser();
                            }}
                          >
                            <label className="block mt-4">
                              Tên:
                              <input
                                type="text"
                                value={newUser.fullname}
                                onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                                required
                                placeholder="Nhập tên đầy đủ"
                              />
                            </label>
                            <label className="block mt-4">
                              Email:
                              <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                                required
                                placeholder="Nhập địa chỉ email"
                              />
                            </label>
                            <label className="block mt-4">
                              Mã nhân viên:
                              <input
                                type="text"
                                value={newUser.employeeCode}
                                onChange={(e) => setNewUser({ ...newUser, employeeCode: e.target.value })}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                                required
                                placeholder="Nhập mã nhân viên"
                              />
                            </label>
                            <label className="block mt-4">
                              Vai trò:
                              <select
                                value={newUser.role || "user"}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                              >
                                <option value="user">Người dùng</option>
                                <option value="admin">Quản trị viên</option>
                              </select>
                            </label>
                            <div className="flex items-center justify-between mt-4">
                              <label htmlFor="activateAccount" className="text-sm font-bold">
                                Kích hoạt tài khoản
                              </label>
                              <input
                                type="checkbox"
                                id="activateAccount"
                                checked={newUser.active || false}
                                onChange={(e) => setNewUser({ ...newUser, active: e.target.checked })}
                                className="toggle-switch"
                              />
                            </div>
                            {newUser.active && (
                              <label className="block mt-4">
                                Mật khẩu:
                                <input
                                  type="password"
                                  value={newUser.password || ""}
                                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                  className="border border-gray-300 rounded-md px-4 py-2 w-full mt-1"
                                  placeholder="Nhập mật khẩu"
                                  required
                                />
                              </label>
                            )}
                            <div className="flex justify-end mt-6">
                              <button
                                onClick={() => setIsAddUserModalOpen(false)}
                                className="px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400"
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                              >
                                Tạo
                              </button>
                            </div>
                          </form>
                      </div>
                    </div>
                  )}
              
      
      {/* Pagination Buttons */}
      
  </div> 
  );
};

export default UserTable;