import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config"; // import từ file config
import TicketAdminModal from "./TicketAdminModal";

const TicketAdminTable = ({ currentUser }) => {
  // ---------------------------------------------------------
  // 1. State chung về danh sách tickets
  // ---------------------------------------------------------
  const [tickets, setTickets] = useState([]);
  const [originalTickets, setOriginalTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const openTicketModal = async (ticketId) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
        setShowTicketModal(true);
      } else {
        toast.error("Không thể tải thông tin ticket.");
      }
    } catch (error) {
      console.error("Lỗi khi fetch ticket:", error);
      toast.error("Không thể tải thông tin ticket.");
    }
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  };
  // ---------- -----------------------------------------------
  // 2. State sắp xếp
  // ---------------------------------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ---------------------------------------------------------
  // 3. State cho modal Assigned (chỉ mở khi ticket status = Assigned)
  // ---------------------------------------------------------
  const [assignedTicket, setAssignedTicket] = useState(null);
  const token = localStorage.getItem("authToken");

  // Action user chọn bên trong modal: accept / cancel / transfer
  const [cancelReason, setCancelReason] = useState(""); // State for cancel reason

  // ---------------------------------------------------------
  // 4. Danh sách người dùng & phân loại
  // ---------------------------------------------------------
  const [users, setUsers] = useState([]);
  const [technicalUsers, setTechnicalUsers] = useState([]);

  // ---------------------------------------------------------
  // 5. Filter chính: "all" hoặc "assignedToMe"
  // ---------------------------------------------------------
  const [filter, setFilter] = useState("all");

  // ---------------------------------------------------------
  // 6. Bộ lọc nhiều ưu tiên / nhiều trạng thái
  // ---------------------------------------------------------
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // ---------------------------------------------------------
  // 7. Fetch danh sách tickets
  // ---------------------------------------------------------
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTickets(response.data.tickets);
      setOriginalTickets(response.data.tickets);
      setLoading(false);
    } catch (error) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu."
      );
      setLoading(false);
    }
  };
  const fetchTicketById = async (ticketId) => {
    console.log("Fetching ticket by ID:", ticketId);
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
      } else {
        console.error("❌ Không thể tải ticket:", response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi getTicketById (Admin):", error);
    }
  };

  // ---------------------------------------------------------
  // 8. Fetch danh sách users
  // ---------------------------------------------------------
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let allUsers = [];
      if (Array.isArray(response.data)) {
        allUsers = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        allUsers = response.data.users;
      }
      setUsers(allUsers);

      const validUsers = allUsers.filter(
        (user) => user.role === "technical" || user.role === "admin"
      );
      setTechnicalUsers(validUsers);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải danh sách người dùng.");
    }
  };

  // ---------------------------------------------------------
  // 9. Tính màu nền cho từng độ ưu tiên
  // ---------------------------------------------------------
  const getPriorityBackgroundColor = (priority) => {
    switch (priority) {
      case "Low":
        return "#d1fae5";
      case "Medium":
        return "#fef9c3";
      case "High":
        return "#e98d9e";
      case "Urgent":
        return "#C13346";
      default:
        return "#f3f4f6";
    }
  };

  // Nhãn tiếng Việt
  const priorityLabels = {
    Low: "Thấp",
    Medium: "Trung bình",
    High: "Cao",
    Urgent: "Khẩn cấp",
  };

  // Dot color
  const getPriorityDotColor = (priority) => {
    switch (priority) {
      case "Low":
        return "#22c55e";
      case "Medium":
        return "#eab308";
      case "High":
        return "#ef4444";
      case "Urgent":
        return "#FF5733";
      default:
        return "#6b7280";
    }
  };

  // ---------------------------------------------------------
  // 10. Sắp xếp tickets
  // ---------------------------------------------------------
  const priorityOrder = { Low: 1, Medium: 2, High: 3, Urgent: 4 };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null; // Không sort
      }
    }
    setSortConfig({ key, direction });

    if (direction === null) {
      setTickets([...originalTickets]);
    } else {
      const sortedTickets = [...tickets].sort((a, b) => {
        if (key === "priority") {
          return direction === "asc"
            ? priorityOrder[a[key]] - priorityOrder[b[key]]
            : priorityOrder[b[key]] - priorityOrder[a[key]];
        } else if (key === "status") {
          return direction === "asc"
            ? a[key].localeCompare(b[key])
            : b[key].localeCompare(a[key]);
        }
        return 0;
      });
      setTickets(sortedTickets);
    }
  };

  // ---------------------------------------------------------
  // 11. Lọc tickets theo filter chính & bộ lọc phụ
  // ---------------------------------------------------------
  const filteredTickets = tickets.filter((ticket) => {
    // A) Lọc theo "all" hoặc "assignedToMe"
    let match =
      filter === "all" ||
      (filter === "assignedToMe" && ticket.assignedTo?._id === currentUser.id);

    // B) Lọc theo nhiều ưu tiên
    if (selectedPriorities.length > 0) {
      match = match && selectedPriorities.includes(ticket.priority);
    }

    // C) Lọc theo nhiều trạng thái
    if (selectedStatuses.length > 0) {
      match = match && selectedStatuses.includes(ticket.status);
    }
    return match;
  });

  // ---------------------------------------------------------
  // 12. Hàm chuyển đổi bảng chính (Tất cả / Giao cho tôi)
  // ---------------------------------------------------------
  const handleMainFilterChange = (mainFilter) => {
    setFilter(mainFilter);
  };

  // ---------------------------------------------------------
  // 13. Toggle ưu tiên (chọn/bỏ)
  // ---------------------------------------------------------
  const handlePriorityClick = (priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((p) => p !== priority);
      } else {
        return [...prev, priority];
      }
    });
  };

  // ---------------------------------------------------------
  // 14. Toggle trạng thái (chọn/bỏ)
  // ---------------------------------------------------------
  const handleStatusClick = (status) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // ---------------------------------------------------------
  // 16. Các hàm hành động trong modal (Nhận / Hủy / Chuyển)
  // 16b) Hủy
  const handleCancel = async () => {
    console.log("Hủy ticket:", assignedTicket);
    if (!assignedTicket) return;

    // Kiểm tra nếu không nhập cancelReason
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ ticket!");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        status: "Cancelled",
        cancelReason: cancelReason, // Sử dụng cancelReason từ state
      };
      console.log("[Cancel] Gửi lên server:", payload);

      const response = await axios.put(
        `${API_URL}/tickets/${assignedTicket._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Đã huỷ yêu cầu!");
        setAssignedTicket(null);
        fetchTickets();
      } else {
        toast.error("Huỷ yêu cầu thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi huỷ yêu cầu:", error);
      toast.error("Có lỗi xảy ra khi huỷ yêu cầu!");
    }
  };
  // ---------------------------------------------------------
  // 17. tính năng chat
  // ---------------------------------------------------------
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ---------------------------------------------------------
  // 18. useEffect gọi fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);
  // ---------------------------------------------------------
  // 20. JSX render
  // ---------------------------------------------------------
  return (
    <div className="p-8">
      <div className="w-full h-full p-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl border">
        <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
          {/* Thanh công cụ lọc */}
          <div className="flex text-sm space-x-4 w-full mb-4 mt-2">
            {/* Hai bảng chính */}
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                filter === "all" ? "bg-[#FF5733] text-white" : "text-[#002147]"
              }`}
              onClick={() => handleMainFilterChange("all")}
            >
              Tất cả
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                filter === "assignedToMe"
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handleMainFilterChange("assignedToMe")}
            >
              Giao cho tôi
            </button>

            {/* Độ ưu tiên */}
            <span className="w-20 h-8 font-semibold mt-2 ml-4">
              Độ ưu tiên:
            </span>

            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedPriorities.includes("Urgent")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handlePriorityClick("Urgent")}
            >
              Gấp
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedPriorities.includes("High")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handlePriorityClick("High")}
            >
              Cao
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedPriorities.includes("Medium")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handlePriorityClick("Medium")}
            >
              Trung bình
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedPriorities.includes("Low")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handlePriorityClick("Low")}
            >
              Thấp
            </button>

            {/* Trạng thái */}
            <span className="w-20 h-8 font-semibold mt-2">Trạng thái: </span>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedStatuses.includes("unassigned")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handleStatusClick("unassigned")}
            >
              Chưa nhận
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedStatuses.includes("Processing")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handleStatusClick("Processing")}
            >
              Đang xử lý
            </button>
            <button
              className={`w-24 h-8 rounded-lg font-bold shadow-lg border ${
                selectedStatuses.includes("closed")
                  ? "bg-[#FF5733] text-white"
                  : "text-[#002147]"
              }`}
              onClick={() => handleStatusClick("closed")}
            >
              Đóng
            </button>
          </div>

          {/* Bảng hiển thị Tickets */}
          <table className="w-full">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">ID</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">TIÊU ĐỀ</p>
                </th>

                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">NGƯỜI TẠO</p>
                </th>
                <th
                  className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center">
                    <p className="text-sm font-bold text-gray-500">ƯU TIÊN</p>
                    {sortConfig.key === "priority" && (
                      <span
                        className="ml-1 text-xs"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {sortConfig.direction === "asc"
                          ? "▲"
                          : sortConfig.direction === "desc"
                          ? "▼"
                          : "↔"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    <p className="text-sm font-bold text-gray-500">
                      TRẠNG THÁI
                    </p>
                    {sortConfig.key === "status" && (
                      <span className="ml-1 text-xs">
                        {sortConfig.direction === "asc"
                          ? "▲"
                          : sortConfig.direction === "desc"
                          ? "▼"
                          : "↔"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">NGƯỜI XỬ LÝ</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">DEADLINES</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Không có dữ liệu tickets nào để hiển thị.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-gray-100"
                    onClick={() => openTicketModal(ticket._id)}
                  >
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-bold text-navy-700">
                        {ticket.ticketCode}
                      </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-bold text-navy-700">
                        {ticket.title}
                      </p>
                    </td>

                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-bold text-navy-700">
                        {ticket.creator?.fullname || "Không xác định"}
                      </p>
                      <p className="text-xs font-semi italic text-navy-500">
                        {ticket.creator?.jobTitle || "Không xác định"}
                      </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4 text-start">
                      <div
                        className="inline-flex items-center justify-center px-2 py-1 rounded-lg border"
                        style={{
                          backgroundColor: getPriorityBackgroundColor(
                            ticket.priority
                          ),
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: getPriorityDotColor(
                              ticket.priority
                            ),
                          }}
                        ></span>
                        <p className="text-sm font-bold text-gray-700">
                          {priorityLabels[ticket.priority] || "Không xác định"}
                        </p>
                      </div>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-bold text-navy-700">
                        {ticket.status}
                      </p>
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      {ticket.assignedTo ? (
                        <div>
                          <p className="text-sm font-bold text-navy-700">
                            {ticket.assignedTo.fullname || "Không xác định"}
                          </p>
                          <p className="text-xs font-semi italic text-navy-500">
                            {ticket.assignedTo.jobTitle || "Không xác định"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm italic font-semibold text-gray-500">
                          Chưa có người nhận
                        </p>
                      )}
                    </td>
                    <td className="min-w-[150px] border-white/0 py-3 pr-4">
                      <p className="text-sm font-bold text-navy-700">
                        {new Date(ticket.sla).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Modal hiển thị chi tiết ticket */}
          {showTicketModal && selectedTicket && (
            <TicketAdminModal
              ticket={selectedTicket}
              currentUser={currentUser}
              onClose={closeTicketModal}
              handleCancelTicket={handleCancel}
              fetchTicketById={fetchTicketById}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketAdminTable;
