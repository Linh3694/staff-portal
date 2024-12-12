import React, { useState, useEffect, useMemo } from "react";
import { MdCancel, MdCheckCircle, } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const ClientTable = ({ handleSyncClients }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');


  // Lấy dữ liệu từ /api/users
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/users", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Đảm bảo token đúng
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text(); // Đọc nội dung lỗi từ backend
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      alert(`Lỗi khi tải danh sách người dùng: ${error.message}`);
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

  const handleExportToExcel = () => {
    // Tạo dữ liệu export
    const dataToExport = clients.map((client) => ({
      Tên: client.fullname,
      Email: client.email || "Không có",
      Chức_Vụ: client.jobTitle || "Không có",
      Phòng_Ban: client.department || "Không có",
      Vai_Trò: client.role,
      Tình_Trạng: client.disabled ? "Inactive" : "Active",
    }));
  
    // Tạo worksheet từ dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  
    // Tạo workbook và thêm worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách người dùng");
  
    // Ghi workbook ra file Excel
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
    // Tải file xuống
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Danh_sach_nguoi_dung.xlsx");
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

  // Phân trang dữ liệu
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredClients.slice(start, end);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Tổng số trang
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Xử lý chỉnh sửa người dùng
  const handleEditUser = (user) => {
    if (!user || !user._id) {
      console.error("Người dùng không hợp lệ:", user);
      alert("Không thể chỉnh sửa người dùng này.");
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
        alert("Vui lòng nhập mật khẩu mới để kích hoạt tài khoản!");
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
        alert("Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại!");
        return;
      } else if (response.status === 404) {
        alert("Người dùng không tồn tại!");
        return;
      } else if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      alert("Cập nhật người dùng thành công!");
      const updatedClient = await response.json(); // Lấy dữ liệu cập nhật từ backend
      setClients((prevClients) =>
        prevClients.map((client) =>
          client._id === updatedClient._id ? { ...client, ...updatedClient } : client
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error.message);
      alert("Lỗi khi cập nhật người dùng.");
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
      const response = await fetch('http://localhost:5001/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl); // Assuming the server returns the URL of the uploaded avatar
        alert('Avatar uploaded successfully!');
      } else {
        alert('Failed to upload avatar.');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar.');
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4 mt-3">
            <div className="text-xl font-bold text-navy-700 dark:text-white">Danh sách người dùng</div>
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
                onClick={handleSyncClients}
                className="bg-[#FF5733] text-white text-sm font-bold px-3 py-2 rounded-lg shadow-md hover:bg-[#cc4529]"
              >
                Đồng bộ
              </button>
              <button
                onClick={handleExportToExcel}
                className="px-3 py-2 bg-[#002147] text-sm font-bold text-white rounded-lg shadow-md hover:bg-[#001635]"
              >
                Xuất Excel
              </button>
        </div>

      </div>

      {/* Bảng */}
      <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            <tr className="!border-px !border-gray-400">
              <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                <p className="text-sm font-bold text-gray-600">TÊN</p>
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
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <button
                    onClick={() => handleEditUser(client)}
                    className="text-sm font-bold text-navy-700 hover:underline"
                  >
                    {client.fullname}
                  </button> <br/>
                  <span className="text-gray-500 italic text-sm">{client.email || "Not Provided"}</span>
                </td>
                <td className="min-w-[150px] border-white/0 py-3 pr-4">
                  <p className="text-sm font-semibold text-navy-700">{client.jobTitle || "Not Provided"}</p>
                  <p className="text-sm font-semibold">{client.department || "Not Provided"}</p>
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
              </tr>
            ))}
          </tbody>
        </table>

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
      </div>
      {/* Pagination */}
      <div className="flex justify-end items-right mt-4">
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
    </div>

    
  );
};

export default ClientTable;