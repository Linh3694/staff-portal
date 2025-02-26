import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, UPLOAD_URL, BASE_URL } from "../../config"; // import từ file config
import { FiSend } from "react-icons/fi";
import { FaTrashCan, FaCheck, FaXmark } from "react-icons/fa6";

const TicketAdminTable = ({ currentUser }) => {
  console.log("Current user:", currentUser);

  // ---------------------------------------------------------
  // 1. State chung về danh sách tickets
  // ---------------------------------------------------------
  const [tickets, setTickets] = useState([]);
  const [originalTickets, setOriginalTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("exchange");
  const [selectedStatus, setSelectedStatus] = useState();
  const [subTasks, setSubTasks] = useState([]); // Danh sách sub-task
  const [showSubTaskModal, setShowSubTaskModal] = useState(false); // Trạng thái hiển thị modal
  const [newSubTask, setNewSubTask] = useState({ title: "", assignedTo: "" }); // Dữ liệu sub-task mới
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------------------------------------------------
  // 2. State sắp xếp
  // ---------------------------------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ---------------------------------------------------------
  // 3. State cho modal Assigned (chỉ mở khi ticket status = Assigned)
  // ---------------------------------------------------------
  const [isAssignedModalOpen, setIsAssignedModalOpen] = useState(false);
  const [assignedTicket, setAssignedTicket] = useState(null);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [processingTicket, setProcessingTicket] = useState(null);

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
      console.log("Ảnh đính kèm:", processingTicket?.attachments);
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
    console.log("📥 Fetching Ticket ID:", ticketId); // ✅ Debug
    if (!ticketId) {
      console.error("🚨 Lỗi: Ticket ID bị undefined!");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      console.log("📜 Dữ liệu từ API:", res.data.ticket); // ✅ Kiểm tra dữ liệu từ API
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết ticket:", error);
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
    console.log("🚀 Ticket được chọn:", ticket); // Debug
    if (ticket.status === "Assigned") {
      setAssignedTicket(ticket);
      setSelectedAction("accept");
      setIsAssignedModalOpen(true);
    } else if (
      ticket.status === "Processing" ||
      ticket.status === "Waiting for Customer"
    ) {
      setProcessingTicket(ticket);
      setSelectedAction("update");
      setIsProcessingModalOpen(true);
    } else {
      toast.info("Trạng thái này không có hành động đặc biệt.");
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
        toast.success(
          "Nhận yêu cầu thành công! Ticket chuyển sang Processing."
        );
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

  // 🛠 Hàm Xác nhận - Gửi API cập nhật trạng thái ticket
  const handleCancelUpdate = () => {
    setSelectedStatus(null); // Reset trạng thái
    setIsProcessingModalOpen(false); // Đóng modal
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
        setIsProcessingModalOpen(false);
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

  useEffect(() => {
    if (selectedTicket && selectedTicket.messages) {
      const mapped = selectedTicket.messages.map((m) => {
        return {
          text: m.text,
          sender: m?.sender?.fullname || "N/A",
          senderId: m?.sender?._id,
          senderAvatar: m?.sender?.avatar || "/default-avatar.png",
          time: new Date(m.timestamp).toLocaleString("vi-VN"),
          isSelf: m?.sender?._id === currentUser?.id,
        };
      });
      setMessages(mapped);
    }
  }, [selectedTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!selectedTicket || !selectedTicket._id) {
      toast.error("Vui lòng chọn ticket trước khi gửi tin nhắn.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/tickets/${selectedTicket._id}/messages`,
        { text: newMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (res.data.success) {
        // Thêm luôn vào state messages
        setMessages((prev) => [
          ...prev,
          {
            text: newMessage,
            sender: currentUser?.fullname || "Me (tech)",
            senderId: currentUser?.id,
            senderAvatar: currentUser?.avatar || "/default-avatar.png",
            time: new Date().toLocaleString("vi-VN"),
            isSelf: true,
          },
        ]);
        setNewMessage("");

        // Hoặc fetch lại ticket:
        // await fetchTicketById(selectedTicket._id);
      }
    } catch (error) {
      console.error("🚨 Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  // ---------------------------------------------------------
  // 18. useEffect gọi fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedTicket && selectedTicket.messages) {
      console.log("📥 Tin nhắn từ API:", selectedTicket.messages); // ✅ Debug API response

      const mapped = selectedTicket.messages.map((m) => ({
        text: m.text,
        sender: m?.sender?.fullname || "N/A",
        senderId: m?.sender?._id,
        senderAvatar: m?.sender?.avatarUrl
          ? `${BASE_URL}${m.sender.avatarUrl}` // ✅ Format ảnh đầy đủ
          : "/default-avatar.png",
        time: new Date(m.timestamp).toLocaleString("vi-VN"),
        isSelf: m?.sender?._id === currentUser?.id,
      }));

      console.log("📥 Tin nhắn sau khi map:", mapped); // ✅ Debug dữ liệu tin nhắn
      setMessages(mapped);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                  onClick={() => {
                    fetchTicketById(ticket._id);
                    handleAssignedTicketClick(ticket); // Ẩn form tạo ticket khi xem chi tiết
                  }}
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
                    backgroundColor: getPriorityDotColor(
                      assignedTicket.priority
                    ),
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
                          {assignedTicket.creator?.fullname || "Không có mô tả"}{" "}
                          - {assignedTicket.creator?.email || "Không có mô tả"}
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

        {isProcessingModalOpen && processingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white w-[70%] h-[80%] rounded-lg shadow-lg p-6 flex flex-col gap-4 relative">
              <h3 className="text-2xl font-bold text-[#002147] mb-2 text-start">
                {processingTicket.ticketCode}: {processingTicket.title}
              </h3>
              <div className="min-h-[550px] grid grid-cols-3 gap-5">
                {/* 1️⃣ Cột trái - Nội dung yêu cầu */}
                <div className="flex flex-col h-full justify-between">
                  <div className="h-[430px] bg-[#F8F8F8] justify-evenly p-4 rounded-xl shadow-md">
                    {/* Tiêu đề */}
                    <div className="flex flex-col h-full justify-between">
                      {/* Phần nội dung phía trên */}
                      <div>
                        <h3 className="text-lg font-bold text-center text-[#002855] bg-gray-200 px-4 py-2 rounded-lg mb-4">
                          Nội dung yêu cầu
                        </h3>

                        {/* Tiêu đề yêu cầu */}
                        <div className="mb-4">
                          <p className="text-gray-700 font-semibold">Tiêu đề</p>
                          <p className="text-md text-[#757575] p-2">
                            {processingTicket?.title || "Chưa có tiêu đề"}
                          </p>
                        </div>

                        {/* Chi tiết yêu cầu */}
                        <div className="mb-4">
                          <p className="text-gray-700 font-semibold">
                            Chi tiết
                          </p>
                          <div className="overflow-y-auto max-h-[180px] p-2">
                            <p className="text-md text-[#757575] leading-relaxed">
                              {processingTicket?.description ||
                                "Không có mô tả chi tiết."}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Ảnh đính kèm */}
                      <div>
                        <p className="text-gray-500 font-semibold">
                          Ảnh đính kèm
                        </p>
                        <div className="overflow-x-auto whitespace-nowrap flex gap-2 py-2">
                          {processingTicket?.attachments?.length > 0 ? (
                            processingTicket.attachments.map(
                              (attachment, index) => {
                                const imageUrl = attachment.url.startsWith(
                                  "http"
                                )
                                  ? attachment.url
                                  : `${UPLOAD_URL}/${attachment.url}`; // UPLOAD_URL là base URL của server chứa ảnh

                                return (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={attachment.filename}
                                    onError={(e) =>
                                      (e.target.src = "/fallback-image.png")
                                    } // Thay ảnh mặc định nếu lỗi
                                    className="w-24 h-24 object-cover rounded-lg border shadow cursor-pointer"
                                    onClick={() => setSelectedImage(imageUrl)} // Mở modal khi click
                                  />
                                );
                              }
                            )
                          ) : (
                            <p className="text-gray-500 italic">
                              Không có ảnh đính kèm
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Modal Preview Ảnh */}
                      {selectedImage && (
                        <div
                          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                          onClick={() => setSelectedImage(null)}
                        >
                          <div
                            className="relative bg-white p-4 rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Hình ảnh */}
                            <img
                              src={selectedImage}
                              alt="Preview"
                              className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#F8F8F8] p-4 rounded-lg shadow-md">
                    {/* Thiết bị sửa chữa */}
                    <div className="mb-4">
                      <p className="text-gray-500 font-semibold">
                        Thiết bị sửa chữa
                      </p>
                      <div className="flex flex-col gap-2">
                        {processingTicket?.devices?.map((device, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-2 rounded-md shadow"
                          >
                            <p className="text-sm text-gray-700">{device}</p>
                            <button className="text-red-500 text-sm">✕</button>
                          </div>
                        ))}
                      </div>

                      <button className="mt-2 text-blue-500 text-sm font-semibold flex items-center gap-1">
                        <span>+</span> Thêm thiết bị
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2️⃣ Cột giữa - Trao đổi & Lịch sử */}
                <div className=" bg-[#F8F8F8] p-4 rounded-lg flex flex-col">
                  {/* Tabs Chuyển Đổi */}
                  <div className="w-full bg-[#E4E9EF] flex items-center rounded-2xl gap-2 p-1">
                    <button
                      className={`flex-1 text-center py-2 rounded-2xl font-bold transition-all duration-200 ${
                        activeTab === "exchange"
                          ? "bg-[#002855] text-white shadow-md"
                          : "text-gray-500"
                      }`}
                      onClick={() => setActiveTab("exchange")}
                    >
                      Trao đổi
                    </button>
                    <button
                      className={`flex-1 text-center py-2 rounded-2xl font-bold transition-all duration-200 ${
                        activeTab === "history"
                          ? "bg-[#002855] text-white shadow-md"
                          : "text-gray-500"
                      }`}
                      onClick={() => setActiveTab("history")}
                    >
                      Lịch sử
                    </button>
                  </div>

                  {/* Nội dung theo Tab */}
                  <div className="flex flex-col flex-grow rounded-b-lg h-[400px]">
                    {activeTab === "exchange" ? (
                      // Nội dung tab Trao đổi
                      <div className="flex flex-col h-full">
                        {/* Danh sách tin nhắn (cuộn khi cần) */}
                        <div className="flex flex-col space-y-2 overflow-y-auto h-full px-4 mt-4 mb-2">
                          {messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1 ${
                                m.isSelf ? "justify-end" : "justify-start"
                              } mb-2`}
                            >
                              {/* Avatar bên trái nếu là tin nhắn của người khác */}
                              {!m.isSelf && (
                                <img
                                  src={m.senderAvatar}
                                  alt="Avatar"
                                  className="w-11 h-11 rounded-full border shadow-md object-cover"
                                />
                              )}

                              {/* Tin nhắn & thời gian */}
                              <div className="flex flex-col max-w-xs">
                                <div
                                  className={`px-4 py-2 text-sm rounded-lg ${
                                    m.isSelf
                                      ? "bg-[#E4E9EF] text-[#002147]"
                                      : "bg-[#EBEBEB] text-[#757575]"
                                  }`}
                                >
                                  {m.text}
                                </div>
                                <span className="text-[11px] italic text-gray-500 mt-1">
                                  {m.time}
                                </span>
                              </div>

                              {/* Avatar bên phải nếu là tin nhắn của admin (người đang xem) */}
                              {m.isSelf && (
                                <img
                                  src={m.senderAvatar}
                                  alt="Avatar"
                                  className="w-11 h-11 rounded-full border shadow-md object-cover"
                                />
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Thanh nhập tin nhắn (luôn nằm dưới) */}
                        <div className="flex flex-row justify-between items-center gap-2 p-2 ">
                          <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 w-[70%] text-md border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="bg-[#FF5733] text-white p-2 rounded-full flex items-center"
                          >
                            <FiSend size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Nội dung tab Lịch sử
                      <div>
                        <h3 className="text-xl font-bold text-[#002147] mb-4">
                          Lịch sử thao tác
                        </h3>
                        <div className="overflow-y-auto p-2 border rounded-lg bg-gray-50">
                          {selectedTicket?.history?.length > 0 ? (
                            selectedTicket.history.map((log, index) => (
                              <div key={index} className="mb-3">
                                <p className="text-sm font-semibold">
                                  {log.action}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {log.user} -{" "}
                                  {new Date(log.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center">
                              Chưa có lịch sử thao tác.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3️⃣ Cột phải - Thông tin chung & Phân chia công việc */}
                <div className="rounded-md flex flex-col gap-2">
                  {/* Hàng trên cùng: Hoàn thành - Đóng - Hủy */}
                  {/* Hàng chọn trạng thái */}
                  <div className="flex flex-row gap-2 bg-[#f8f8f8] p-2 rounded-lg ">
                    {[
                      { value: "Done", label: "Hoàn thành" },
                      { value: "Closed", label: "Đóng" },
                      { value: "Cancelled", label: "Hủy" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={`flex-1 px-3 py-2 rounded-2xl font-semibold transition ${
                          selectedStatus === option.value
                            ? "bg-[#E44D26] text-white"
                            : "bg-[#EBEBEB] text-[#BEBEBE]"
                        }`}
                        onClick={() => setSelectedStatus(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {/* Thông tin chung */}
                  <div className="bg-[#F8F8F8] p-2 rounded-xl border-gray-200">
                    <h2 className="text-lg font-semibold text-[#002147] mb-4">
                      Thông tin chung
                    </h2>
                    <div className="bg-[#E4E9EF] p-4 rounded-lg grid grid-cols-2 gap-3">
                      <p className="text-gray-600 font-medium">Mã yêu cầu</p>
                      <p className="text-[#002147] font-semibold text-right">
                        {selectedTicket
                          ? selectedTicket.ticketCode
                          : "Đang tải..."}
                      </p>
                      <p className="text-gray-600 font-medium">
                        Người thực hiện
                      </p>
                      <p className="text-[#002147] font-semibold text-right">
                        {selectedTicket
                          ? selectedTicket.assignedTo.fullname
                          : "Không có"}
                      </p>

                      <p className="text-gray-600 font-medium">Ngày yêu cầu</p>
                      <p className="text-[#002147] font-semibold text-right">
                        {new Date(selectedTicket?.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>

                      <p className="text-gray-600 font-medium ">Trạng thái</p>
                      <p
                        className={`font-semibold text-right ${
                          selectedTicket?.status === "Processing"
                            ? "text-[#F5AA1E]"
                            : selectedTicket?.status === "Closed"
                            ? "text-[#3DB838]"
                            : "text-[#00687F]"
                        }`}
                      >
                        {selectedTicket?.status === "Processing"
                          ? "Đang xử lý"
                          : selectedTicket?.status === "Closed"
                          ? "Đã đóng"
                          : selectedTicket?.status}
                      </p>
                    </div>
                  </div>

                  {/* Phân chia công việc */}
                  <div className="bg-[#F8F8F8] p-2 rounded-lg">
                    <h2 className="text-lg font-semibold text-[#002147] mb-2">
                      Sub-task
                    </h2>
                    {/* Danh sách sub-task */}
                    {selectedTicket &&
                      selectedTicket.subTasks &&
                      selectedTicket.subTasks.length > 0 && (
                        <div className="mt-2 max-h-[170px] overflow-y-auto space-y-2">
                          {selectedTicket.subTasks.map((subTask) => (
                            <div
                              key={subTask._id}
                              className={`bg-gray-200 p-2 rounded-lg flex items-center justify-between ${
                                subTask.status === "Completed"
                                  ? "bg-[#E4EFE6]"
                                  : subTask.status === "Cancelled"
                                  ? "bg-[#EBEBEB] line-through"
                                  : "bg-[#E4E9EF]"
                              }`}
                            >
                              {/* Thông tin subtask */}
                              <div
                                className={`w-full flex flex-row justify-between ${
                                  subTask.status === "Completed"
                                    ? "bg-[#E4EFE6]"
                                    : subTask.status === "Cancelled"
                                    ? "bg-[#EBEBEB] line-through"
                                    : "bg-[#E4E9EF]"
                                }`}
                              >
                                <span
                                  className={`ml-2 font-semibold ${
                                    subTask.status === "Completed"
                                      ? "text-[#009483]"
                                      : subTask.status === "Cancelled"
                                      ? "text-gray-500 line-through"
                                      : "text-black"
                                  }`}
                                >
                                  {subTask.title}
                                </span>

                                {/* Các nút thao tác */}
                                <div className="flex items-center flex-row justify-between">
                                  <span className="text-[#757575] font-semibold text-sm mr-2">
                                    {subTask.assignedTo?.fullname ||
                                      subTask.assignedTo}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateSubTaskStatus(
                                        subTask._id,
                                        "Completed"
                                      )
                                    }
                                    className="px-1 py-1 text-[#009483]  transition"
                                  >
                                    <FaCheck />
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateSubTaskStatus(
                                        subTask._id,
                                        "Cancelled"
                                      )
                                    }
                                    className="px-1 py-1  text-[#F05023]  transition"
                                  >
                                    <FaXmark />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSubTask(subTask._id)
                                    }
                                    className="px-1 py-1  text-[#FF5733]  transition"
                                  >
                                    <FaTrashCan />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {/* Nút thêm sub-task */}
                    <button
                      onClick={() => setShowSubTaskModal(true)}
                      className="mt-2 text-[#002147] text-sm font-semibold flex items-center gap-1"
                    >
                      <span>+</span> Thêm Sub-task
                    </button>

                    {/* Modal nhập Sub-task */}
                    {showSubTaskModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
                          <h2 className="text-lg font-bold mb-4">
                            Thêm Sub-task
                          </h2>

                          {/* Form nhập Sub-task */}
                          <input
                            type="text"
                            placeholder="Nhập tiêu đề sub-task..."
                            value={newSubTask.title}
                            onChange={(e) =>
                              setNewSubTask({
                                ...newSubTask,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg mb-2"
                          />

                          {/* Chọn người thực hiện */}
                          <select
                            value={newSubTask.assignedTo}
                            onChange={(e) =>
                              setNewSubTask({
                                ...newSubTask,
                                assignedTo: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg mb-2"
                          >
                            <option value="">Chọn người thực hiện</option>
                            {technicalUsers.map((user) => (
                              <option key={user._id} value={user.fullname}>
                                {user.fullname}
                              </option>
                            ))}
                          </select>

                          {/* Nút xác nhận */}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowSubTaskModal(false)}
                              className="px-4 py-2 bg-[#EBEBEB] rounded-lg"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleAddSubTask}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Nút hành động */}
              <div className="flex items-end justify-end gap-4">
                {/* Nút Hủy */}
                <button
                  className="px-4 py-2 bg-[#EBEBEB] text-gray-500 rounded-lg"
                  onClick={handleCancelUpdate}
                >
                  Hủy bỏ
                </button>

                {/* Nút Xác nhận */}
                <button
                  className="px-4 py-2 bg-[#FF5733] text-white rounded-lg"
                  onClick={handleUpdateStatus}
                >
                  Cập nhật
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
