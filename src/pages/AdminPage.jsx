import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiArrowRight, FiLogOut } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", username: "", role: "", password: "", fullname: "" });
  const [isEditing, setIsEditing] = useState(false);


  // Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await fetch("{process.env.REACT_APP_API_BASE_URL}/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  // Redirect to Dashboard
  const handleDashboardRedirect = () => {
    const role = localStorage.getItem("role");
  if (role) {
    if (role === "admin") {
      window.location.href = "/dashboard"; // Chuyển hướng
    } else {
      alert("Bạn không có quyền truy cập trang này.");
    }
  } else {
    alert("Không xác định vai trò người dùng. Vui lòng đăng nhập lại.");
    handleLogout();
  }
  };

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    if (!formData.username || !formData.password || !formData.role) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      const response = await fetch("{process.env.REACT_APP_API_BASE_URL}/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          fullname: formData.fullname,
        }),
      });
      if (response.ok) {
        fetchUsers();
        setIsModalOpen(false);
        resetForm();
      } else {
        console.error("Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
  
    if (!formData.username || !formData.fullname || !formData.role) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
  
    try {
      const response = await fetch(`http://42.96.42.197:5001/api/users/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullname,
          username: formData.username,
          role: formData.role,
        }),
      });
  
      if (response.ok) {
        fetchUsers(); // Refresh danh sách user
        setIsModalOpen(false);
        resetForm();
      } else {
        console.error("Failed to edit user");
      }
    } catch (error) {
      console.error("Error editing user:", error);
    }
  };


  // Reset form
  const resetForm = () => {
    setFormData({ _id: "", username: "", password: "", role: "" });
    setIsEditing(false);
  };

  // Delete User
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://42.96.42.197:5001/api/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchUsers();
      } else {
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#002147] mb-6">Trang quản trị</h1>
          <ul className="space-y-3">
            <li>
              <button className="w-full flex items-center px-4 py-3 rounded-lg bg-[#002147] text-white">
                <span className="mr-3">Quản lý người dùng</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-white shadow px-8 py-4">
          <h2 className="text-lg font-bold text-[#002147]">Quản lý người dùng</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDashboardRedirect}
              className="flex items-center justify-center px-4 py-2 bg-[#002147] text-white rounded-md shadow-md hover:bg-[#001733] transition"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 bg-[#FF5733] text-white rounded-full shadow-md hover:bg-[#cc4529] transition"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#002147]">Danh sách người dùng</h2>
            <button
              className="flex items-center px-4 py-2 bg-[#002147] text-white rounded-md hover:bg-[#001733] transition"
              onClick={() => setIsModalOpen(true)}
            >
              <FiPlus className="mr-2"/>Tạo mới
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Tên đầy đủ</th>
                  <th className="px-4 py-2 text-left">Tên đăng nhập</th>
                  <th className="px-4 py-2 text-left">Chức năng</th>
                  <th className="px-4 py-2 text-left">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{user.fullname || "Không xác định"}</td>
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setFormData({
                              id: user._id || user.id || "",
                              fullname: user.fullname || "",
                              username: user.username || "",
                              role: user.role || "user",
                              password: "",
                            });
                            setIsModalOpen(true);
                          }}
                          className="ml-2 px-1 py-1 bg-[#002147] text-white text-sm rounded-lg shadow-md hover:bg-[#001a38] transition"
                              >
                              <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="ml-2 px-1 py-1 bg-[#FF5733] text-white text-sm rounded-lg shadow-md hover:bg-[#cc4529] transition"
                              >
                                <FiTrash2 size={16} />
                                
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
{/* -----------------------------Modal Thêm mới----------------------------- */}
      {isModalOpen && !isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      <IoMdClose size={24} />
                    </button>
                    <h2 className="text-2xl font-bold mb-6">Thêm người dùng mới</h2>
                    <form onSubmit={handleAddUser}>
                      <div className="space-y-4">
                      <div>
                          <label className="block mb-1">Tên đầy đủ</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-md"
                            value={formData.fullname}
                            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block mb-1">Tên đăng nhập</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-md"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <label className="block mb-1">Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border rounded-md"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block mb-1">Chức năng</label>
                          <select
                            className="w-full px-4 py-2 border rounded-md"
                            value={formData.role || "user"}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          >
                            <option value="user">Chọn chức năng</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                          <button
                            type="button"
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            onClick={() => {
                              resetForm();
                              setIsModalOpen(false);
                            }}
                          >
                            Huỷ
                          </button>
                          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
        )}

{/* -----------------------------Modal cập nhật----------------------------- */}
        {isModalOpen && isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <IoMdClose size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-6">Edit User</h2>
              <form onSubmit={handleEditUser}>
                <div className="space-y-4">
                <div>
                    <label className="block mb-1">Tên đầy đủ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Tên đăng nhập</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Mật khẩu</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Chức năng</label>
                    <select
                      className="w-full px-4 py-2 border rounded-md"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}


    </div>
  );
};

export default Admin;