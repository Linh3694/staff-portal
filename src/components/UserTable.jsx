import React, { useState, useEffect, useMemo } from "react";
import { MdCancel, MdCheckCircle, } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiEdit, FiTrash2, FiCopy } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdEmail, MdWork, MdPerson, MdBusiness } from "react-icons/md";
import LaptopProductCard from "./productcard/laptopProductCard";


const UserTable = ({ handleSyncClients }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [assignedItems, setAssignedItems] = useState([]);
  const [isLaptopModalOpen, setIsLaptopModalOpen] = useState(false);
  const [selectedLaptopData, setSelectedLaptopData] = useState(null);
  const [newUser, setNewUser] = useState({
    fullname: "",
    email: "",
    employeeCode: "",
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing


  


  // Lấy dữ liệu từ http://localhost:5001/api//users
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/users", {
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

  const handleOpenLaptopModal = async (laptopData) => {
    console.log("Laptop Data Truyền vào:", laptopData);
  
    // Nếu `laptopData.assigned` chứa ID, fetch thêm thông tin chi tiết
    const assignedDetails = await Promise.all(
      laptopData.assigned.map(async (userId) => {
        try {
          console.log(localStorage.getItem("token"));
          const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          console.log("Response Status:", response.status);
          console.log("Response Text:", await response.text());
  
          if (!response.ok) throw new Error("Không thể tải thông tin người dùng.");
  
          const userData = await response.json();
          return {
            id: userData._id,
            fullname: userData.fullname || "Không xác định",
            jobTitle: userData.jobTitle || "Không xác định",
            department: userData.department || "Không xác định",
          };
        } catch (error) {
          console.error("Error fetching user details:", error.message);
          return { id: userId, fullname: "Không xác định", jobTitle: "-", department: "-" };
        }
      })
    );
  
    setSelectedLaptopData({
      ...laptopData,
      name: laptopData.name || "Không xác định",
      serial: laptopData.serial || "N/A",
      manufacturer: laptopData.manufacturer || "N/A",
      status: laptopData.status || "N/A",
      specs: laptopData.specs || { processor: "N/A", ram: "N/A", storage: "N/A", display: "N/A" },
      assigned: assignedDetails, // Thêm thông tin mở rộng
    });
  
    setIsLaptopModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/${userIdToDelete}`, {
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
      const response = await fetch("http://localhost:5001/api/users", {
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

  const handleShowProfile = async (user) => {
    setSelectedUser(user);
  
    try {
      const response = await fetch(`http://localhost:5001/api/users/${user._id}/assigned-items`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Không thể tải danh sách thiết bị.");
  
      const data = await response.json();
      setAssignedItems(data); // Cập nhật danh sách thiết bị
    } catch (error) {
      console.error("Error fetching assigned items:", error.message);
      setAssignedItems([]); // Nếu lỗi, set danh sách rỗng
    }
  
    setIsProfileModalOpen(true);
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
      const response = await fetch(`http://localhost:5001/api/users/bulk-update`, {
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
            // Fetch thông tin assigned-items cho từng user
            const response = await fetch(`http://localhost:5001/api/users/${client._id}/assigned-items`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
  
            if (!response.ok) throw new Error("Failed to fetch assigned items.");
  
            const assignedItems = await response.json();
  
            return {
              ...client,
              assignedItems: assignedItems.map(
                (item) => `${item.name || "Không xác định"} (SN: ${item.serial || "N/A"})`
              ),
            };
          } catch (error) {
            console.error(`Error fetching assigned items for user ${client._id}:`, error.message);
            return {
              ...client,
              assignedItems: ["Không có"],
            };
          }
        })
      );
  
      // Chuẩn bị dữ liệu cho Excel
      const dataToExport = enrichedClients.map((client) => ({
        Tên: client.fullname || "Không có",
        Email: client.email || "Không có",
        Mã_nhân_viên: client.employeeCode || "Không có",
        Chức_Vụ: client.jobTitle || "Không có",
        Phòng_Ban: client.department || "Không có",
        Vai_Trò: client.role || "Không có",
        "Thiết_bị_sử_dụng": client.assignedItems.join("; "), // Nối các thiết bị thành chuỗi
      }));
  
      // Tạo worksheet và workbook
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách người dùng");
  
      // Xuất file Excel
      XLSX.writeFile(workbook, "Danh_sach_nguoi_dung.xlsx");
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Error exporting Excel:", error.message);
      toast.error("Lỗi khi xuất file Excel.");
    }
  };

  // Lọc clients theo từ khóa tìm kiếm
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const keyword = searchTerm.toLowerCase();
      return (
        (client.fullname?.toLowerCase().includes(keyword) || false) ||
        (client.email?.toLowerCase().includes(keyword) || false)
      );
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
      // Kiểm tra nếu tài khoản được kích hoạt nhưng chưa nhập mật khẩu
      if (!updatedUser.disabled && !updatedUser.newPassword) {
        toast.error("Vui lòng nhập mật khẩu mới để kích hoạt tài khoản!");
        return;
      }
      if (!updatedUser._id) {
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
        if (avatar) {
          formData.append("avatar", avatarFile); // Thêm file avatar nếu có
        }
  
      const response = await fetch(`http://localhost:5001/api/users/${updatedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedUser),formData,
      });
  
      if (response.status === 400) {
        toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại!");
        return;
      } else if (response.status === 404) {
        toast.error("Người dùng không tồn tại!");
        return;
      } else if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      toast.success("Cập nhật người dùng thành công!");
      await fetchUsers(); // Làm mới dữ liệu
      const updatedClient = await response.json(); // Lấy dữ liệu cập nhật từ backend
      setClients((prevClients) =>
        prevClients.map((client) =>
          client._id === updatedClient._id ? { ...client, ...updatedClient } : client
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error.message);
      toast.error("Lỗi khi cập nhật người dùng.");
    }
  };

  

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    const fileUrl = URL.createObjectURL(file);
    setAvatarUrl(fileUrl);
  };

  const handleAvatarUpload = async () => {
    if (!avatar) return;


    const formData = new FormData();
    formData.append('avatar', avatar);
    formData.append('userId', selectedUser._id); // Include the user ID
    try {
      const response = await fetch('http://localhost:/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl); // Assuming the server returns the URL of the uploaded avatar
        toast.success('Avatar uploaded successfully!');
      } else {
        toast.error('Failed to upload avatar.');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar.');
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full h-full px-6 pb-6 border sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-2xl font-bold text-navy-700">Danh sách người dùng</div>
          </div>

      {/* Thanh tìm kiếm */}
      <div className="flex justify-between items-center mb-2 mt-1">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email"
          className="border border-gray-300 rounded-md px-4 py-2 w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <button
                    onClick={() => handleShowProfile(client)}
                    className="text-sm font-bold text-navy-700 hover:underline"
                  >
                    {client.fullname}
                  </button> <br/>
                  <span className="text-gray-500 italic text-sm">{client.email || "Not Provided"}</span>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.employeeCode || "Chưa có"}</p>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.jobTitle || "Not Provided"}</p>
                  <p className="text-sm font-semibold italic">{client.department || "Not Provided"}</p>
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
            {/* ------------------------------------------------------------------------------- Modal Profile -------------------------------------------------------- */}
            {isProfileModalOpen && selectedUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-[500px]">
                      {/* Header */}
                      <div className="flex items-center justify-center mb-4">
                        <img
                          src={selectedUser.avatarUrl || "https://via.placeholder.com/150"}
                          alt="Avatar"
                          className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                        />
                      </div>
                      
                      {/* Thông tin người dùng */}
                      <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
                        {selectedUser.fullname || "Không có tên"}
                      </h3>
                      <p className="text-gray-600 text-center mb-4 font-bold text-sm italic">
                         {selectedUser.employeeCode || "Chưa cập nhật"}
                      </p>
                
                      <div className="space-y-2 text-center">
                        <div className="flex items-center text-sm font-bold text-navy-700 bg-grey-100">
                          <MdEmail className="mr-2 text-[#FF5733]" />
                          <span>{selectedUser.email || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-700">
                          <MdWork className="mr-2 text-[#FF5733]" />
                          <span>{selectedUser.jobTitle || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-700">
                          <MdBusiness className="mr-2 text-[#FF5733]" />
                          <span>{selectedUser.department || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-700">
                          <MdPerson className="mr-2 text-[#FF5733]" />
                          <span>Vai trò: {selectedUser.role || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-700">
                        {selectedUser.disabled ? (
                          <>
                            <MdCancel className="mr-2 text-[#FF5733]" />
                            <span>Trạng thái: Inactive</span>
                          </>
                        ) : (
                          <>
                            <MdCheckCircle className="mr-2 text-[#009483]" />
                            <span>Trạng thái: Active</span>
                          </>
                        )}
                      </div>
                    </div>

                      {/* Assigned Items */}
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-[#002147] mb-2">Thiết bị sử dụng</h4>
                            <div className="flex flex-wrap gap-2">
                              {assignedItems.map((item, index) => (
                                  <span
                                    key={item.id || index} // Sử dụng `item.id` nếu có, nếu không fallback sang `index`
                                    onClick={() => handleOpenLaptopModal(item)} 
                                    className="px-3 py-1 bg-[#002147] text-white font-bold rounded-full text-xs cursor-pointer"
                                  >
                                    {item.name} - SN: {item.serial}
                                  </span>
                                ))}
                            </div>
                          </div>
                         
                
                      {/* Footer */}
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setIsProfileModalOpen(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                        {isLaptopModalOpen && selectedLaptopData && (
                              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={() => setIsLaptopModalOpen(false)}>
                                <div  onClick={(e) => e.stopPropagation()}>
                                  <LaptopProductCard
                                    laptopData={selectedLaptopData}
                                    onAddRepair={(newRepair) => console.log("Thêm sửa chữa", newRepair)}
                                    onDeleteRepair={(laptopId, repairId) =>
                                      console.log("Xóa sửa chữa", laptopId, repairId)
                                    }
                                    onCloseModal={() => setIsLaptopModalOpen(false)}
                                  />
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
              
      </div>
      {/* Pagination Buttons */}
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
  </div> 
  );
};

export default UserTable;