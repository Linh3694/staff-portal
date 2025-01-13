import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdComputer, MdDesktopMac, MdPrint, MdVideocam, MdBuild } from "react-icons/md"; // Thêm icon


const Profile = ({ user, onBack, onSave, onAvatarUpload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedCataloge, setSelectedCataloge] = useState("laptops");
  const catalogeIcons = [
        { id: "laptops", name: "Laptop", icon: MdComputer },
        { id: "monitors", name: "Màn hình", icon: MdDesktopMac },
        { id: "printers", name: "Máy in", icon: MdPrint },
        { id: "projectors", name: "Thiết bị trình chiếu", icon: MdVideocam },
        { id: "tools", name: "Công cụ khác", icon: MdBuild },
    ];
  const [newPassword, setNewPassword] = useState(""); // Thêm state cho Mật khẩu mới
  const [showPasswordField, setShowPasswordField] = useState(false); // Trạng thái hiển thị trường Mật khẩu mới

  useEffect(() => {
    // Khi props `user` thay đổi, cập nhật state `editedUser` và `avatarUrl`.
    setEditedUser({ ...user });
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const fileUrl = URL.createObjectURL(file);
    setAvatarUrl(fileUrl);
  
    // Cập nhật avatar qua props cha
    onAvatarUpload(file, user._id);
  };
  
  // Thêm base URL nếu cần
  useEffect(() => {
    const baseURL = "http://46.92.42.197:5001"; // Đổi thành base URL của backend
    setAvatarUrl(user.avatarUrl ? `${baseURL}${user.avatarUrl}` : "");
  }, [user]);

  const handleInputChange = (field, value) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: field === "disabled" ? value === "disabled" : value, // Xử lý boolean đúng
    }));
  
    if (field === "disabled") {
      const isDisabled = value === "disabled";
      setShowPasswordField(!isDisabled);
      if (isDisabled) {
        setNewPassword(""); // Reset mật khẩu khi vô hiệu hóa
      }
    }
  };


  const getTotalDevices = () => {
    if (!user.assignedItems || !user.assignedItems.items) return 0;
  
    const { laptops, monitors, printers, projectors, tools } = user.assignedItems.items;
    return (
      (laptops?.length || 0) +
      (monitors?.length || 0) +
      (printers?.length || 0) +
      (projectors?.length || 0) +
      (tools?.length || 0)
    );
  };
  
  const handleSave = async () => {
    const isReactivatingAccount = user.disabled && !editedUser.disabled;
    if (isReactivatingAccount && !newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới khi kích hoạt tài khoản!");
      return;
    }
    try {
      console.log("Dữ liệu gửi đi:", {
        ...editedUser,
        newPassword: isReactivatingAccount ? newPassword : null,
      });
      await onSave(
        {
          ...editedUser,
          newPassword: isReactivatingAccount ? newPassword : null,
        },
        avatar
        
      );
      toast.success("Thông tin đã được cập nhật!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error during save:", error);
      toast.error("Cập nhật thông tin thất bại.");
    }
  };

  return (
    <div className=" w-full max-w-7xl mx-auto mt-6">
      <button
        onClick={onBack}
        className="mb-4 text-base font-bold px-3 py-1 bg-[#002147] text-white rounded-lg shadow hover:bg-gray-400"
      >
        Quay lại
      </button>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/5 max-h-40 border border-gray-200 rounded-xl p-7">
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

        {/* Main Content */}
        <div className="w-4/5 bg-white">
          {activeTab === "profile" && (
            <div>
                    <div
                        className="text-white p-6 rounded-xl bg-[#002147] flex items-center ml-4"
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
                    <p className="text-lg">{user.jobTitle}</p>
                    <p className="text-sm">{user.department}</p>
                    </div>
                    </div>
            
              {/* User Details */}
              <div className="mt-6 border border-gray-200 ml-4 rounded-xl p-4">
              {!isEditing ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                        <p className="text-2xl font-bold text-[#002147]">Thông tin chi tiết</p>
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
                            <p className="text-gray-500">Số điện thoại</p>
                            <p className="font-semibold">{user.phone || "Chưa cập nhật"}</p>
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
                        <p className="text-2xl font-bold text-[#002147]">Chỉnh sửa thông tin</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-500">Họ tên</p>
                            <input
                            type="text"
                            value={editedUser.fullname}
                            onChange={(e) => handleInputChange("fullname", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500">Email</p>
                            <input
                            type="email"
                            value={editedUser.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500">Số điện thoại</p>
                            <input
                            type="text"
                            value={editedUser.phone || ""}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500">Chức vụ</p>
                            <input
                            type="text"
                            value={editedUser.jobTitle}
                            onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500">Phòng ban</p>
                            <input
                            type="text"
                            value={editedUser.department}
                            onChange={(e) => handleInputChange("department", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            />
                        </div>
                        <div>
                            <p className="text-gray-500">Role</p>
                            <select
                            value={editedUser.role}
                            onChange={(e) => handleInputChange("role", e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            >
                            <option value="user">User</option>
                            <option value="technical">Technical</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-gray-500">Tình trạng tài khoản</p>
                            <select
                            value={editedUser.disabled ? "disabled" : "active"}
                            onChange={(e) =>
                                handleInputChange("disabled", e.target.value === "disabled")
                            }
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            >
                            <option value="active">Hoạt động</option>
                            <option value="disabled">Đã vô hiệu hóa</option>
                            </select>
                        </div>
                        {/* Trường "Mật khẩu mới" chỉ hiển thị khi tài khoản đang hoạt động */}
                        {!editedUser.disabled && (
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
                            onClick={() => setIsEditing(false)}
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
          {activeTab === "devices" && (
                <div className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        {/* Phần tử thứ nhất */}
                        <p className="text-2xl font-bold text-[#002147]">Thiết bị</p>
                        
                        {/* Phần tử thứ hai */}
                        <span
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF5733] text-white text-sm"
                        >
                            {getTotalDevices()}
                        </span>
                    </div>
                    {/* Hiển thị danh mục */}
                    <div className="flex space-x-4 mb-6">
                    {catalogeIcons.map((cataloge) => (
                        <button
                        key={cataloge.id}
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${
                            selectedCataloge === cataloge.id ? "bg-[#002147] text-white" : "bg-gray-200 text-gray-600"
                        }`}
                        onClick={() => setSelectedCataloge(cataloge.id)}
                        >
                        <cataloge.icon size={24} />
                        </button>
                    ))}
                    </div>

                    {/* Hiển thị danh sách thiết bị */}
                    <div className="grid grid-cols-2 gap-4">
                    {selectedCataloge === "laptops" &&
                        user.assignedItems?.items?.laptops?.map((laptop) => (
                            <div
                              key={laptop._id}
                              className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                            >
                              <MdComputer size={24} />
                              <div>
                                <p className="font-bold">{laptop.name || "Không có tên"}</p>
                                <p className="text-sm text-gray-600">Serial: {laptop.serial || "N/A"}</p>
                              </div>
                            </div>
                        ))}

                    {selectedCataloge === "monitors" &&
                        user.assignedItems?.items?.monitors?.map((monitor) => (
                            <div
                              key={monitor._id}
                              className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                            >
                              <MdDesktopMac size={24} />
                              <div>
                                <p className="font-bold">{monitor.name || "Không có tên"}</p>
                                <p className="text-sm text-gray-600">Serial: {monitor.serial || "N/A"}</p>
                              </div>
                            </div>
                        ))}

                    {selectedCataloge === "printers" &&
                        user.assignedItems?.items?.printers?.map((printer) => (
                            <div
                              key={printer._id}
                              className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                            >
                              <MdPrint size={24} />
                              <div>
                                <p className="font-bold">{printer.name || "Không có tên"}</p>
                                <p className="text-sm text-gray-600">Serial: {printer.serial || "N/A"}</p>
                              </div>
                            </div>
                        ))}

                    {selectedCataloge === "projectors" &&
                        user.assignedItems?.items?.projectors?.map((projector) => (
                            <div
                              key={projector._id}
                              className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                            >
                              <MdVideocam size={24} />
                              <div>
                                <p className="font-bold">{projector.name || "Không có tên"}</p>
                                <p className="text-sm text-gray-600">Serial: {projector.serial || "N/A"}</p>
                              </div>
                            </div>
                        ))}

                    {selectedCataloge === "tools" &&
                        user.assignedItems?.items?.tools?.map((tool) => (
                            <div
                              key={tool._id}
                              className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex items-center space-x-4"
                            >
                              <MdBuild size={24} />
                              <div>
                                <p className="font-bold">{tool.name || "Không có tên"}</p>
                                <p className="text-sm text-gray-600">Serial: {tool.serial || "N/A"}</p>
                              </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}
          {activeTab === "tickets" && (
                <div className="p-4">
                    <p className="text-2xl font-bold text-[#002147] mb-4">Tickets</p>
                    {user.tickets && user.tickets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {user.tickets.map((ticket) => (
                        <div
                            key={ticket._id}
                            className="bg-gray-200 text-[#002147] rounded-lg px-4 py-2 flex flex-col space-y-2"
                        >
                            <p className="font-bold">{ticket.title}</p>
                            <p className="text-sm text-gray-600">Status: {ticket.status}</p>
                            <p className="text-sm text-gray-600">Priority: {ticket.priority}</p>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-gray-500 italic">Không có tickets nào được tạo.</p>
                    )}
                </div>
                )}
        </div>
      </div>
    </div>
  );
};

export default Profile;