import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../config"; // import từ file config
import TicketAdminModal from "./TicketAdminModal";

const TicketAdminTable = ({ currentUser }) => {
  // ---------------------------------------------------------
  // 1. State chung về danh sách tickets
  // ---------------------------------------------------------
  const [tickets, setTickets] = useState([]);
  const [originalTickets, setOriginalTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState();
  const [showSubTaskModal, setShowSubTaskModal] = useState(false); // Trạng thái hiển thị modal
  const [newSubTask, setNewSubTask] = useState({ title: "", assignedTo: "" }); // Dữ liệu sub-task mới
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
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
  const [processingTicket, setProcessingTicket] = useState(null);
  const token = localStorage.getItem("authToken");

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
        toast.success(
          "Nhận yêu cầu thành công! Ticket chuyển sang Processing."
        );
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
        setAssignedTicket(null);
        fetchTickets();
      } else {
        toast.error("Chuyển ticket thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi chuyển ticket!");
    }
  };

  // 🛠 Hàm Xác nhận - Gửi API cập nhật trạng thái ticket
  const handleCancelUpdate = () => {
    setSelectedStatus(null); // Reset trạng thái
  };

  const handleUpdateStatus = async () => {
    // Nếu không chọn trạng thái mới, giữ nguyên trạng thái cũ
    const newStatus =
      selectedStatus !== null ? selectedStatus : processingTicket.status;

    if (!newStatus) {
      toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.put(
        `${API_URL}/tickets/${processingTicket._id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Cập nhật trạng thái thành công!");

        // Cập nhật giao diện
        setProcessingTicket((prev) => ({
          ...prev,
          status: newStatus,
        }));

        // Đóng modal sau khi cập nhật thành công
        setSelectedStatus(null); // Reset trạng thái chọn
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Cập nhật thất bại! Vui lòng thử lại.");
    }
  };
  // ---------------------------------------------------------
  // 17. tính năng chat
  // ---------------------------------------------------------
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // useEffect(() => {
  //   if (selectedTicket && selectedTicket.messages) {
  //     const mapped = selectedTicket.messages.map((m) => {
  //       return {
  //         text: m.text,
  //         sender: m?.sender?.fullname || "N/A",
  //         senderId: m?.sender?._id,
  //         senderAvatar: m.sender?.avatarUrl
  //           ? `${BASE_URL}/uploads/Avatar/${m.sender.avatarUrl}`
  //           : "/default-avatar.png",
  //         time: new Date(m.timestamp).toLocaleString("vi-VN"),
  //         isSelf: m?.sender?._id === currentUser?.id,
  //       };
  //     });
  //     setMessages(mapped);
  //   }
  // }, [selectedTicket]);

  // -----------------------------------------
  // 4. Gửi tin nhắn
  // -----------------------------------------

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/tickets/${selectedTicket._id}/messages`,
        { text: newMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        // Load lại ticket để hiển thị tin nhắn mới
        await fetchTicketById(selectedTicket._id);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };
  // -----------------------------------------
  // 5. Polling mỗi 5s để load tin nhắn mới
  // -----------------------------------------
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // ---------------------------------------------------------
  // 18. useEffect gọi fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  // useEffect(() => {
  //   if (processingTicket && processingTicket.messages) {
  //     const mapped = processingTicket.messages.map((m) => ({
  //       text: m.text,
  //       senderId: m.sender?._id,
  //       sender: m.sender?.fullname || "N/A",
  //       senderAvatar: m.sender?.avatarUrl
  //         ? `${BASE_URL}/uploads/Avatar/${m.sender.avatarUrl}`
  //         : "/default-avatar.png",
  //       time: new Date(m.timestamp).toLocaleString("vi-VN"),
  //       isSelf: m.sender?._id === currentUser?.id,
  //     }));
  //     setMessages(mapped);
  //   } else {
  //     setMessages([]);
  //   }
  // }, [processingTicket]);
  // ---------------------------------------------------------
  // 19. JSX render
  // ---------------------------------------------------------
  const handleAddSubTask = async () => {
    if (!newSubTask.title || !newSubTask.assignedTo) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/tickets/${selectedTicket._id}/subtasks`,
        {
          title: newSubTask.title,
          assignedTo: newSubTask.assignedTo,
          status: "In Progress", // 🟡 Trạng thái mặc định
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Thêm subtask thành công!");
        setShowSubTaskModal(false);
        // ✅ Fetch lại ticket ngay lập tức để cập nhật UI
        fetchTicketById(selectedTicket._id);
      }
    } catch (error) {
      console.error("Lỗi khi thêm sub-task:", error);
      toast.error("Không thể thêm sub-task!");
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.delete(
        `${API_URL}/tickets/${selectedTicket._id}/subtasks/${subTaskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Sub-task đã được huỷ");
        // Cập nhật lại ticket để refresh danh sách subtask
        fetchTicketById(selectedTicket._id);
      }
    } catch (error) {
      console.error("Lỗi khi huỷ sub-task:", error);
      toast.error("Không thể huỷ sub-task!");
    }
  };

  const updateSubTaskStatus = async (subTaskId, newStatus) => {
    if (!selectedTicket || !subTaskId) {
      toast.error("Lỗi: Không tìm thấy subtask hoặc ticket.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}/subtasks/${subTaskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Cập nhật trạng thái sub-task thành công!");
        // Cập nhật lại ticket để hiển thị trạng thái mới
        fetchTicketById(selectedTicket._id);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái sub-task:", error);
      toast.error("Không thể cập nhật trạng thái sub-task!");
    }
  };

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
              handleSendMessage={handleSendMessage}
              handleCancelTicket={handleCancel}
              messages={messages}
              fetchTicketById={fetchTicketById}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketAdminTable;
