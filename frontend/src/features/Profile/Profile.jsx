import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdComputer,
  MdDesktopMac,
  MdPrint,
  MdVideocam,
  MdBuild,
} from "react-icons/md";
import { API_URL, BASE_URL } from "../../core/config";

/**
 * Profile hiển thị thông tin user (theo userId),
 * cho phép chỉnh sửa, upload ảnh,
 * kèm 2 tab:
 *  - "Thiết bị" (Devices) -> hiển thị 5 danh mục
 *  - "Tickets" -> hiển thị tickets user là creator
 */
const Profile = ({ userId, onBack }) => {
  // --------------------------------------------------
  // 1. STATE
  // --------------------------------------------------
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "devices" | "tickets"
  const [newPassword, setNewPassword] = useState("");
  const [assignedItems, setAssignedItems] = useState(null); // { laptops: [], monitors: [], ...}
  const [tickets, setTickets] = useState([]); // danh sách ticket (nếu cần)

  // Danh mục devices
  const catalogeIcons = [
    { id: "laptops", name: "Laptop", icon: MdComputer },
    { id: "monitors", name: "Màn hình", icon: MdDesktopMac },
    { id: "printers", name: "Máy in", icon: MdPrint },
    { id: "projectors", name: "Thiết bị trình chiếu", icon: MdVideocam },
    { id: "tools", name: "Công cụ khác", icon: MdBuild },
  ];
  const [selectedCataloge, setSelectedCataloge] = useState("laptops");

  // --------------------------------------------------
  // 2. FETCH data ban đầu
  // --------------------------------------------------
  useEffect(() => {
    if (!userId) return;
    fetchUserData(userId);
    fetchAssignedItems(userId);
    fetchUserTickets(userId);
  }, [userId]);

  // Lấy thông tin user
  const fetchUserData = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải thông tin người dùng!");
      const data = await res.json();

      setUser(data);
      setEditedUser({ ...data });
      if (data.avatarUrl) {
        // Nếu backend trả "/uploads/xxx", ta ghép BASE_URL
        setAvatarUrl(`${BASE_URL}/uploads/Avatar/${data.avatarUrl}`);
      }
    } catch (error) {
      console.error(error.message);
      toast.error("Không thể tải thông tin người dùng!");
    }
  };

  // Lấy thiết bị gán
  const fetchAssignedItems = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/users/${id}/assigned-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách thiết bị!");
      const data = await res.json();
      // data.items = { laptops: [...], monitors: [...], etc. }
      setAssignedItems(data.items);
    } catch (error) {
      console.error(error.message);
      toast.error("Lỗi khi tải thiết bị!");
    }
  };

  // Lấy tickets: filter userId == creator._id
  const fetchUserTickets = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải tickets!");
      const allTickets = await res.json(); // { tickets: [...] }

      const userTickets = allTickets.tickets?.filter(
        (ticket) => ticket.creator?._id === id
      );
      setTickets(userTickets || []);
    } catch (error) {
      console.error(error.message);
      toast.error("Lỗi khi tải tickets!");
    }
  };

  // --------------------------------------------------
  // 3. HANDLE AVATAR
  // --------------------------------------------------
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    // Preview tạm
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  // --------------------------------------------------
  // 4. HANDLE INPUT
  // --------------------------------------------------
  const handleInputChange = (field, value) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // --------------------------------------------------
  // 5. SAVE / UPDATE
  // --------------------------------------------------
  const handleSave = async () => {
    if (!editedUser) return;

    // Nếu user đang disabled mà ta chuyển sang active => yêu cầu newPassword
    const isReactivating = user?.disabled && !editedUser.disabled;
    if (isReactivating && !newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới khi kích hoạt tài khoản!");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("fullname", editedUser.fullname || "");
      formData.append("email", editedUser.email || "");
      formData.append("department", editedUser.department || "");
      formData.append("jobTitle", editedUser.jobTitle || "");
      formData.append("role", editedUser.role || "user");
      formData.append("employeeCode", editedUser.employeeCode || "");
      formData.append("disabled", editedUser.disabled ? "true" : "false");

      if (isReactivating) {
        formData.append("newPassword", newPassword);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 400) toast.error("Dữ liệu không hợp lệ!");
        else if (res.status === 404) toast.error("Người dùng không tồn tại!");
        else toast.error(`Có lỗi xảy ra: ${res.statusText}`);
        return;
      }

      const updated = await res.json();
      toast.success("Cập nhật thông tin thành công!");

      // Cập nhật state
      setUser(updated);
      setEditedUser({ ...updated });
      if (updated.avatarUrl) {
        setAvatarUrl(`${BASE_URL}${updated.avatarUrl}`);
      }
      setIsEditing(false);
      setAvatarFile(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Cập nhật thông tin thất bại.");
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  if (!user) {
    return (
      <div>
        <button onClick={onBack}>Quay lại</button>
        <p>Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  // Tính tổng thiết bị
  const getTotalDevices = () => {
    if (!assignedItems) return 0;
    const { laptops, monitors, printers, projectors, tools } = assignedItems;
    return (
      (laptops?.length || 0) +
      (monitors?.length || 0) +
      (printers?.length || 0) +
      (projectors?.length || 0) +
      (tools?.length || 0)
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-6">
      {/* Nút Quay lại */}
      <button
        onClick={onBack}
        className="mb-4 text-base font-bold px-3 py-1 bg-[#002147] text-white rounded-lg"
      >
        Quay lại
      </button>

      <div className="flex">
        {/* Sidebar tab */}
        <div className="w-1/5 border border-gray-200 rounded-xl p-7">
          <button
            className={`block w-full text-left font-bold mb-4 ${
              activeTab === "profile" ? "text-[#002147]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Hồ sơ
          </button>
          <button
            className={`block w-full text-left font-bold mb-4 ${
              activeTab === "devices" ? "text-[#002147]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("devices")}
          >
            Thiết bị
          </button>
          <button
            className={`block w-full text-left font-bold ${
              activeTab === "tickets" ? "text-[#002147]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("tickets")}
          >
            Tickets
          </button>
        </div>

        {/* Main content */}
        <div className="w-4/5 bg-white">
          {/* TAB PROFILE */}
          {activeTab === "profile" && (
            <div>
              {/* Banner Profile */}
              <div
                className="text-white p-6 bg-[#002147] flex items-center ml-4 rounded-xl"
                style={{
                  backgroundImage: `url('/profile_theme.png')`,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <img
                  src={avatarUrl || "https://via.placeholder.com/150"}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white mr-6"
                />
                <div>
                  <h1 className="text-2xl font-bold">{user.fullname}</h1>
                  <p className="text-lg">
                    {user.jobTitle || "Chưa có chức vụ"}
                  </p>
                  <p className="text-sm">
                    {user.department || "Không xác định"}
                  </p>
                </div>
              </div>

              {/* Chi tiết */}
              <div className="mt-6 border border-gray-200 ml-4 rounded-xl p-4">
                {!isEditing ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-2xl font-bold text-[#002147]">
                        Thông tin chi tiết
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-[#FF5733] font-semibold"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500">Họ tên</p>
                        <p className="font-semibold">{user.fullname}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-semibold">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Mã nhân viên</p>
                        <p className="font-semibold">
                          {user.employeeCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Chức vụ</p>
                        <p className="font-semibold">{user.jobTitle}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phòng ban</p>
                        <p className="font-semibold">{user.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Role</p>
                        <p className="font-semibold">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tình trạng tài khoản</p>
                        <p className="font-semibold">
                          {user.disabled ? "Đã vô hiệu hóa" : "Hoạt động"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-2xl font-bold text-[#002147]">
                        Chỉnh sửa thông tin
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500">Họ tên</p>
                        <input
                          type="text"
                          value={editedUser.fullname || ""}
                          onChange={(e) =>
                            handleInputChange("fullname", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <input
                          type="email"
                          value={editedUser.email || ""}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                      <div>
                        <p className="text-gray-500">Mã nhân viên</p>
                        <input
                          type="text"
                          value={editedUser.employeeCode || ""}
                          onChange={(e) =>
                            handleInputChange("employeeCode", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                      <div>
                        <p className="text-gray-500">Chức vụ</p>
                        <input
                          type="text"
                          value={editedUser.jobTitle || ""}
                          onChange={(e) =>
                            handleInputChange("jobTitle", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                      <div>
                        <p className="text-gray-500">Phòng ban</p>
                        <input
                          type="text"
                          value={editedUser.department || ""}
                          onChange={(e) =>
                            handleInputChange("department", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                      <div>
                        <p className="text-gray-500">Role</p>
                        <select
                          value={editedUser.role || "user"}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        >
                          <option value="user">User</option>
                          <option value="marcom">Marcom</option>
                          <option value="bos">Ban Đào Tạo</option>
                          <option value="admission">Tuyển Sinh</option>
                          <option value="hr">HR</option>
                          <option value="technical">IT</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-gray-500">Tình trạng tài khoản</p>
                        <select
                          value={editedUser.disabled ? "disabled" : "active"}
                          onChange={(e) =>
                            handleInputChange(
                              "disabled",
                              e.target.value === "disabled"
                            )
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full"
                        >
                          <option value="active">Hoạt động</option>
                          <option value="disabled">Đã vô hiệu hóa</option>
                        </select>
                      </div>
                      {/* Nếu tài khoản bị vô hiệu -> enable -> cần mật khẩu mới */}
                      {!editedUser.disabled && user?.disabled && (
                        <div>
                          <p className="text-gray-500">Mật khẩu mới</p>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            placeholder="Nhập mật khẩu mới"
                          />
                        </div>
                      )}

                      {/* Cập nhật ảnh */}
                      <div>
                        <p className="text-gray-500">Cập nhật ảnh</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="text-sm border border-gray-300 rounded-lg p-2 w-full"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end text-sm font-bold">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedUser({ ...user });
                          setAvatarFile(null);
                        }}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg mr-2"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        className="bg-[#FF5733] text-white px-3 py-1 rounded-lg"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB DEVICES */}
          {activeTab === "devices" && (
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <p className="text-2xl font-bold text-[#002147]">Thiết bị</p>
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF5733] text-white text-sm">
                  {getTotalDevices()}
                </span>
              </div>

              {/* Thanh chọn danh mục thiết bị */}
              <div className="flex space-x-4 mb-6">
                {catalogeIcons.map((cat) => (
                  <button
                    key={cat.id}
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      selectedCataloge === cat.id
                        ? "bg-[#002147] text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                    onClick={() => setSelectedCataloge(cat.id)}
                  >
                    <cat.icon size={24} />
                  </button>
                ))}
              </div>

              {/* Hiển thị card thiết bị theo danh mục */}
              <div className="grid grid-cols-2 gap-4">
                {selectedCataloge === "laptops" &&
                  assignedItems?.laptops?.map((laptop) => (
                    <div
                      key={laptop._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                    >
                      <MdComputer size={24} />
                      <div>
                        <p className="font-bold">
                          {laptop.name || "Không có tên"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Serial: {laptop.serial || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}

                {selectedCataloge === "monitors" &&
                  assignedItems?.monitors?.map((monitor) => (
                    <div
                      key={monitor._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                    >
                      <MdDesktopMac size={24} />
                      <div>
                        <p className="font-bold">
                          {monitor.name || "Không có tên"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Serial: {monitor.serial || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}

                {selectedCataloge === "printers" &&
                  assignedItems?.printers?.map((printer) => (
                    <div
                      key={printer._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                    >
                      <MdPrint size={24} />
                      <div>
                        <p className="font-bold">
                          {printer.name || "Không có tên"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Serial: {printer.serial || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}

                {selectedCataloge === "projectors" &&
                  assignedItems?.projectors?.map((pj) => (
                    <div
                      key={pj._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                    >
                      <MdVideocam size={24} />
                      <div>
                        <p className="font-bold">{pj.name || "Không có tên"}</p>
                        <p className="text-sm text-gray-600">
                          Serial: {pj.serial || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}

                {selectedCataloge === "tools" &&
                  assignedItems?.tools?.map((tool) => (
                    <div
                      key={tool._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                    >
                      <MdBuild size={24} />
                      <div>
                        <p className="font-bold">
                          {tool.name || "Không có tên"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Serial: {tool.serial || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB TICKETS */}
          {activeTab === "tickets" && (
            <div className="p-4">
              <p className="text-2xl font-bold text-[#002147] mb-4">Tickets</p>
              {tickets && tickets.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 p-6 max-h-[270px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex flex-col space-y-2"
                    >
                      <p className="font-bold">
                        {ticket.title || "Không có tiêu đề"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Trạng thái: {ticket.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        Độ ưu tiên: {ticket.priority}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Không có tickets nào được tạo.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
