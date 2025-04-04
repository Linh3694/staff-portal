import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { API_URL, BASE_URL } from "../../config";
import { toast } from "react-toastify";

function TicketTeam() {
  const [members, setMembers] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Trạng thái cho việc chọn user
  const [searchTerm, setSearchTerm] = useState(""); // text hiển thị trong input
  const [filteredUsers, setFilteredUsers] = useState([]); // danh sách user gợi ý
  const [selectedUser, setSelectedUser] = useState(null); // user object hoặc _id khi đã chọn

  // Lấy thông tin supportTeam từ ticket (đầu tiên)
  const fetchSupportTeam = async () => {
    try {
      const res = await axios.get(`${API_URL}/tickets/support-team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        setTeamName(res.data.teamName);
        setMembers(res.data.members);
      }
    } catch (error) {
      console.error("Error fetching support team:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        console.log(res.data.users);
        setAllUsers(res.data.users);
      } else if (Array.isArray(res.data)) {
        // Nếu trả về là một mảng user thay vì { success, users }
        console.log(res.data);
        setAllUsers(res.data);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  useEffect(() => {
    fetchSupportTeam();
    fetchAllUsers();
  }, []);

  // Mỗi khi searchTerm thay đổi, lọc danh sách user
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = allUsers.filter((u) =>
        u.fullname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, allUsers]);

  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) {
        stars.push(<FaStar size={16} key={i} className="text-orange-red" />);
      } else if (avg >= i - 0.5) {
        stars.push(
          <FaStarHalfAlt size={16} key={i} className="text-orange-red" />
        );
      } else {
        stars.push(<FaRegStar size={16} key={i} className="text-orange-400" />);
      }
    }
    return stars;
  };

  // Thêm user vào supportTeam
  const handleAddUser = async () => {
    if (!selectedUser) {
      toast.error("Vui lòng chọn user trước khi thêm.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/tickets/support-team/add-user`,
        { userId: selectedUser },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Đã thêm user vào team!");
        setShowAddModal(false);
        setSearchTerm("");
        setSelectedUser(null);
        fetchSupportTeam();
      } else {
        toast.error(res.data.message || "Lỗi khi thêm user.");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Không thể thêm user.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{teamName || "Support Team"}</h1>
        <button
          className="px-4 py-2 bg-[#002855] text-white rounded-lg font-semibold"
          onClick={() => setShowAddModal(true)}
        >
          Thêm mới
        </button>
      </div>

      {/* Danh sách team */}
      <div className="grid grid-cols-5 gap-4">
        {members.map((member) => (
          <div
            key={member._id}
            className="bg-white shadow rounded-lg p-4 flex flex-col items-center"
          >
            <img
              src={
                member.avatarUrl
                  ? `${BASE_URL}/uploads/Avatar/${member.avatarUrl}`
                  : "/default-avatar.png"
              }
              alt={member.fullname}
              className="w-20 h-20 rounded-full object-cover mb-2 border"
            />
            <h2 className="font-semibold text-base">{member.fullname}</h2>
            <p className="text-sm text-gray-500">{member.jobTitle || "N/A"}</p>
            <div className="mt-2 flex flex-row items-center gap-2">
              <span className="text-lg font-bold">
                {member.averageRating ? member.averageRating.toFixed(1) : "0.0"}
              </span>
              <div className="flex">
                {renderStars(member.averageRating || 0)}
              </div>
            </div>
            {member.badgesCount &&
              Object.keys(member.badgesCount).length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {Object.entries(member.badgesCount).map(([badge, count]) => (
                    <span
                      key={badge}
                      className="bg-[#002855] text-white font-bold text-xs px-2 py-1 rounded-full"
                    >
                      {badge} ({count})
                    </span>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Modal thêm user */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <h2 className="text-xl font-bold mb-4">
              Thêm user vào Support Team
            </h2>

            {/* Ô nhập tên user */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Nhập tên user..."
                className="w-full border p-2 rounded-md"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedUser(null);
                }}
              />
              {/* Hiển thị gợi ý */}
              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border shadow-md z-10 max-h-40 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setSearchTerm(u.fullname);
                        setSelectedUser(u._id);
                        setFilteredUsers([]);
                      }}
                    >
                      {u.fullname}{" "}
                      <span className="text-xs text-gray-400">({u.email})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm("");
                  setSelectedUser(null);
                }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-[#002855] text-white rounded-md"
                onClick={handleAddUser}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketTeam;
