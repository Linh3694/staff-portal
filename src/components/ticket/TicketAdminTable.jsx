import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../config"; // import từ file config


const TicketAdminTable = ({ currentUser }) => {
  console.log("Current user:", currentUser);

  // ---------------------------------------------------------
  // 1. State chung về danh sách tickets
  // ---------------------------------------------------------
  const [tickets, setTickets] = useState([]); 
  const [originalTickets, setOriginalTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // 2. State sắp xếp
  // ---------------------------------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ---------------------------------------------------------
  // 3. State cho modal Assigned (chỉ mở khi ticket status = Assigned)
  // ---------------------------------------------------------
  const [isAssignedModalOpen, setIsAssignedModalOpen] = useState(false);
  const [assignedTicket, setAssignedTicket] = useState(null);

  // Action user chọn bên trong modal: accept / cancel / transfer
  const [selectedAction, setSelectedAction] = useState("accept");

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
      console.log("Danh sách tickets:", response.data.tickets);
      setTickets(response.data.tickets);
      setOriginalTickets(response.data.tickets);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu.");
      setLoading(false);
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
      (filter === "assignedToMe" &&
        ticket.assignedTo?.email === currentUser.email);

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
  // 15. Mở modal Assigned: chỉ mở nếu ticket.status === "Assigned"
  // ---------------------------------------------------------
  const handleAssignedTicketClick = (ticket) => {
    if (ticket.status !== "Assigned") {
      setAssignedTicket(ticket);
      setSelectedAction("accept"); // ví dụ mặc định
      setIsAssignedModalOpen(true);
    } else {
      toast.info("Ticket này không ở trạng thái Assigned.");
    }
  };

  // ---------------------------------------------------------
  // 16. Các hàm hành động trong modal (Nhận / Hủy / Chuyển)
  // ---------------------------------------------------------
  // 16a) Nhận (accept): chuyển ticket -> processing, assignedTo = currentUser
  const handleAccept = async () => {
    if (!assignedTicket) return;
  
    try {
      const token = localStorage.getItem("authToken");
      const updatedTicket = {
        ...assignedTicket,
        status: "Processing",
        assignedTo: currentUser?.id,
      };
      
      console.log("[Accept] Gửi lên server:", updatedTicket);
      
      const response = await axios.put(
        `${API_URL}/tickets/${assignedTicket._id}`,
        updatedTicket,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Nhận yêu cầu thành công! Ticket chuyển sang Processing.");
        setIsAssignedModalOpen(false);
        setAssignedTicket(null);
        fetchTickets(); // Refresh bảng
      } else {
        toast.error("Nhận yêu cầu thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi nhận yêu cầu!");
    }
  };

  // 16b) Hủy
  const handleCancel = async () => {
    if (!assignedTicket) return;
    try {
      const token = localStorage.getItem("authToken");
      const updatedTicket = {
        ...assignedTicket,
        status: "Cancelled",
        cancelReason: assignedTicket.cancelReason || "",
      };
      console.log("[Cancel] Gửi lên server:", updatedTicket);

      const response = await axios.put(
        `${API_URL}/tickets/${assignedTicket._id}`,
        updatedTicket,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Đã hủy yêu cầu!");
        setIsAssignedModalOpen(false);
        setAssignedTicket(null);
        fetchTickets();
      } else {
        toast.error("Hủy yêu cầu thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi hủy yêu cầu!");
    }
  };

  // 16c) Chuyển
  const handleTransfer = async () => {
    if (!assignedTicket) return;
    if (!assignedTicket.transferTo) {
      toast.error("Vui lòng chọn người nhận mới!");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const updatedTicket = {
        ...assignedTicket,
        status: "Assigned", // hoặc vẫn "Assigned", 
        assignedTo: assignedTicket.transferTo, 
        // Lưu ý: Thực tế bạn cần {_id, fullname, email} - 
        // chứ không chỉ user._id. Tùy backend yêu cầu.
      };
      console.log("[Transfer] Gửi lên server:", updatedTicket);

      const response = await axios.put(
        `${API_URL}/tickets/${assignedTicket._id}`,
        updatedTicket,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Đã chuyển ticket thành công!");
        setIsAssignedModalOpen(false);
        setAssignedTicket(null);
        fetchTickets();
      } else {
        toast.error("Chuyển ticket thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi chuyển ticket!");
    }
  };

  // ---------------------------------------------------------
  // 17. useEffect gọi fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  // ---------------------------------------------------------
  // 18. JSX render
  // ---------------------------------------------------------
  return (
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl border">
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
          <span className="w-20 h-8 font-semibold mt-2 ml-4">Độ ưu tiên:</span>

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
                <p className="text-sm font-bold text-gray-500">MÔ TẢ</p>
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
                    <span className="ml-1 text-xs" style={{ fontSize: "0.75rem" }}>
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
                  <p className="text-sm font-bold text-gray-500">TRẠNG THÁI</p>
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
                  onClick={() => handleAssignedTicketClick(ticket)}
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
                      {ticket.description || "Không có mô tả"}
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
                          backgroundColor: getPriorityDotColor(ticket.priority),
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

        {/* assignedModal: chỉ mở khi ticket.status = "Assigned" */}
        {isAssignedModalOpen && assignedTicket && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            onClick={() => setIsAssignedModalOpen(false)}
          >
            <div
              className="bg-white w-[40%] rounded-lg shadow-lg p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-[#002147] mb-2 text-start">
                {assignedTicket.ticketCode}: {assignedTicket.title}
              </h3>

              {/* Thông tin ưu tiên */}
              <div
                className="inline-flex items-center justify-center px-2 py-1 rounded-lg border mb-4"
                style={{
                  backgroundColor: getPriorityBackgroundColor(
                    assignedTicket.priority
                  ),
                }}
              >
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{
                    backgroundColor: getPriorityDotColor(assignedTicket.priority),
                  }}
                ></span>
                <p className="text-sm font-bold text-[#757575]">
                  {priorityLabels[assignedTicket.priority] || "Không xác định"}
                </p>
              </div>

              <div className="flex space-x-5">
                {/* Bên trái: Nội dung ticket */}
                <div className="flex-1 pr-6 bg-[#f8f8f8] rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base flex items-center justify-center rounded-lg h-10 font-bold mt-2 bg-[#E4E9EF] text-[#002147]">
                        NỘI DUNG YÊU CẦU
                      </h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div>
                        <p className="text-base font-bold text-[#002147] mb-2 ml-3">
                          Người yêu cầu
                        </p>
                        <p className="text-sm text-[#757575] mb-4 ml-3">
                          {assignedTicket.creator?.fullname || "Không có mô tả"} -{" "}
                          {assignedTicket.creator?.email || "Không có mô tả"}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#002147] mb-2 ml-3">
                          Tiêu đề
                        </p>
                        <p className="text-sm text-[#757575] mb-4 ml-3">
                          {assignedTicket.title || "Không có mô tả"}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#002147] mb-2 ml-3 ">
                          Chi tiết
                        </p>
                        <p className="text-sm text-[#757575] mb-4 ml-3">
                          {assignedTicket.description || "Không xác định"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bên phải: Nút hành động */}
                <div className="w-[30%] flex flex-col space-y-4">
                  <div className="flex flex-col space-y-4 bg-[#f8f8f8] p-4 rounded-3xl text-sm">
                    {/* Nhận yêu cầu */}
                    <button
                      className={`py-2 px-4 rounded-lg font-bold shadow ${
                        selectedAction === "accept"
                          ? "bg-[#FF5733] text-white"
                          : "bg-gray-300 text-white"
                      } hover:bg-[#FF5733]`}
                      onClick={() => {
                        setSelectedAction("accept");
                      }}
                    >
                      Nhận yêu cầu
                    </button>

                    {/* Hủy yêu cầu */}
                    <button
                      className={`py-2 px-4 rounded-lg font-bold shadow ${
                        selectedAction === "cancel"
                          ? "bg-[#FF5733] text-white"
                          : "bg-gray-300 text-white"
                      } hover:bg-[#FF5733]`}
                      onClick={() => {
                        setSelectedAction("cancel");
                      }}
                    >
                      Hủy yêu cầu
                    </button>

                    {/* Chuyển */}
                    <button
                      className={`py-2 px-4 rounded-lg font-bold shadow ${
                        selectedAction === "transfer"
                          ? "bg-[#FF5733] text-white"
                          : "bg-gray-300 text-white"
                      } hover:bg-[#FF5733]`}
                      onClick={() => {
                        setSelectedAction("transfer");
                      }}
                    >
                      Chuyển
                    </button>
                  </div>

                  <div className="bg-[#f8f8f8] p-4 rounded-3xl">
                    {/* Khi selectedAction = accept => input SLA, note... */}
                    {selectedAction === "accept" && (
                      <>
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">
                            Hạn chót (SLA)
                          </label>
                          <input
                            type="date"
                            className="w-full px-4 py-2 mb-4 border rounded-lg"
                            value={
                              assignedTicket.sla
                                ? new Date(assignedTicket.sla)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setAssignedTicket((prev) => ({
                                ...prev,
                                sla: e.target.value,
                              }))
                            }
                          />
                          <label className="text-sm font-bold text-gray-700 mb-2 block">
                            Ghi chú
                          </label>
                          <textarea
                            className="w-full px-4 py-2 border rounded-lg h-20"
                            placeholder="Nhập ghi chú"
                            onChange={(e) =>
                              setAssignedTicket((prev) => ({
                                ...prev,
                                note: e.target.value,
                              }))
                            }
                          ></textarea>
                          {/* Nút xác nhận Nhận */}
                          <button
                            className="mt-3 bg-[#FF5733] text-white py-2 px-4 rounded-lg font-bold shadow hover:bg-[#cc4529]"
                            onClick={handleAccept}
                          >
                            Xác nhận Nhận
                          </button>
                        </div>
                      </>
                    )}

                    {/* Khi selectedAction = cancel => nhập lý do hủy */}
                    {selectedAction === "cancel" && (
                      <>
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">
                            Lý do hủy
                          </label>
                          <textarea
                            className="w-full min-h-40 px-4 py-2 border rounded-lg h-20"
                            placeholder="Nhập lý do hủy"
                            onChange={(e) =>
                              setAssignedTicket((prev) => ({
                                ...prev,
                                cancelReason: e.target.value,
                              }))
                            }
                          ></textarea>
                          {/* Nút xác nhận Hủy */}
                          <button
                            className="mt-3 bg-[#FF5733] text-white py-2 px-4 rounded-lg font-bold shadow hover:bg-[#cc4529]"
                            onClick={handleCancel}
                          >
                            Xác nhận Hủy
                          </button>
                        </div>
                      </>
                    )}

                    {/* Khi selectedAction = transfer => chọn người chuyển */}
                    {selectedAction === "transfer" && (
                      <>
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">
                            Người xử lý mới
                          </label>
                          <select
                            className="w-full px-4 py-2 border rounded-lg"
                            onChange={(e) =>
                              setAssignedTicket((prev) => ({
                                ...prev,
                                transferTo: e.target.value, 
                                // Thực tế: Cần object { _id, fullname, email }, 
                                // Tùy backend
                              }))
                            }
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Chọn người xử lý
                            </option>
                            {technicalUsers.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.fullname} - {user.email}
                              </option>
                            ))}
                          </select>
                          {/* Nút xác nhận Chuyển */}
                          <button
                            className="mt-3 bg-[#FF5733] text-white py-2 px-4 rounded-lg font-bold shadow hover:bg-[#cc4529]"
                            onClick={handleTransfer}
                          >
                            Xác nhận Chuyển
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút đóng modal */}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold shadow hover:bg-gray-400"
                  onClick={() => {
                    setAssignedTicket(null);
                    setIsAssignedModalOpen(false);
                    setSelectedAction("accept"); 
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TicketAdminTable;