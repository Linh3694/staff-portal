// /src/components/ticket/TicketAdminModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { toast } from "react-toastify";
import TechnicalRating from "./TechnicalRating";
import { FaArrowRightArrowLeft, FaImage } from "react-icons/fa6";

export default function TicketAdminModal({
  ticket,
  currentUser,
  onClose,
  handleSendMessage,
  handleCancelTicket,
  fetchTicketById,
}) {
  const [detailTab, setDetailTab] = useState("request");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const token = localStorage.getItem("authToken");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setTicketStatus(ticket.status);
  }, [ticket.status]);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  // Tab “Yêu cầu”

  // State cho swap
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapUserId, setSwapUserId] = useState("");

  // Danh sách technical user – có thể lấy từ props hoặc fetch
  const [technicalUsers, setTechnicalUsers] = useState([]);

  useEffect(() => {
    fetchTechnicalUsers();
  }, []);

  const fetchTechnicalUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/tickets/support-team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        // Lấy danh sách thành viên từ supportTeam
        setTechnicalUsers(res.data.members);
      }
    } catch (error) {
      console.error("Lỗi fetch technical users:", error);
    }
  };

  const handleSwapUser = async () => {
    if (!swapUserId) {
      toast.warning("Vui lòng chọn người thực hiện mới!");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.put(
        `${API_URL}/tickets/${ticket._id}`,
        {
          assignedTo: swapUserId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        toast.success("Đã đổi người thực hiện!");
        setShowSwapModal(false);
        await fetchTicketById;
      } else {
        toast.error("Không thể đổi người thực hiện.");
      }
    } catch (error) {
      console.error("Lỗi swap user:", error);
      toast.error("Lỗi swap user.");
    }
  };

  useEffect(() => {
    if (ticket && ticket.messages) {
      // Lọc bỏ duplicate dựa trên _id của tin nhắn
      const uniqueMessagesMap = {};
      ticket.messages.forEach((m) => {
        uniqueMessagesMap[m._id] = m;
      });
      const uniqueMessages = Object.values(uniqueMessagesMap);

      const mapped = uniqueMessages.map((m) => {
        return {
          id: m._id,
          text: m.text,
          sender: m?.sender?.fullname || "N/A",
          senderId: m?.sender?._id,
          senderAvatar: m.sender?.avatarUrl
            ? `${BASE_URL}/uploads/Avatar/${m.sender.avatarUrl}`
            : "/default-avatar.png",
          time: new Date(m.timestamp).toLocaleString("vi-VN"),
          isSelf: m?.sender?._id === currentUser?.id,
          type: m.type || "text",
        };
      });
      setMessages(mapped);
    }
  }, [ticket]);

  const RequestTab = () => {
    return (
      <div className="w-full h-full p-4 flex flex-col gap-3 overflow-y-auto">
        {/* Mô tả chi tiết */}
        <div className="pb-4">
          <p className="font-semibold text-[#002147]">Mô tả chi tiết</p>
          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
            {ticket.description || "Không có mô tả chi tiết."}
          </p>
        </div>

        {/* Ảnh đính kèm */}
        <div className="pb-4">
          <p className="font-semibold text-[#002147] mb-2">Ảnh đính kèm</p>
          {ticket.attachments && ticket.attachments.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto">
              {ticket.attachments.map((item, index) => (
                <img
                  key={index}
                  src={item.url}
                  alt={item.filename || `attachment-${index}`}
                  className="w-[120px] h-[120px] object-cover rounded-lg border shadow-sm"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Không có ảnh đính kèm.</p>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <p className="font-semibold text-[#002147]">* Ghi chú</p>
          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
            {ticket.notes || "Không có ghi chú."}
          </p>
        </div>
      </div>
    );
  };

  // ========== ProgressTab Code Bắt Đầu ==========

  const ProgressTab = () => {
    // Các trạng thái ticket khả dụng
    const statusOptions = [
      { value: "Processing", label: "Đang xử lý", bg: "bg-[#F5AA1E]" },
      { value: "Done", label: "Hoàn thành", bg: "bg-green-500" },
      { value: "Cancelled", label: "Đã huỷ", bg: "bg-orange-red" },
    ];

    // Bản sao cục bộ của ticket (chứa subTasks, history,...)
    const [localTicket, setLocalTicket] = useState(ticket);

    // Trạng thái cục bộ hiển thị trong dropdown
    const [localTicketStatus, setLocalTicketStatus] = useState(ticket.status);

    // Trạng thái cho việc nhập subtask
    const [showAddSubTask, setShowAddSubTask] = useState(false);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

    // Trạng thái cho việc nhập lý do huỷ
    const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // ---------------------------
    // HÀM CẬP NHẬT TRẠNG THÁI TICKET
    // ---------------------------
    const handleUpdateStatus = async (newStatus, cancelReasonParam = "") => {
      try {
        const token = localStorage.getItem("authToken");
        const payload = { status: newStatus };
        if (newStatus === "Cancelled" && cancelReasonParam) {
          payload.cancelReason = cancelReasonParam;
        }

        const res = await axios.put(
          `${API_URL}/tickets/${ticket._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          toast.success("Cập nhật trạng thái thành công!");
          // Cập nhật trạng thái cục bộ và gọi API load lại ticket
          setLocalTicketStatus(newStatus);
          fetchTicketById(ticket._id);
        } else {
          toast.error("Không thể cập nhật trạng thái.");
        }
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        toast.error("Lỗi cập nhật trạng thái.");
      }
    };

    // ---------------------------
    // HÀM CẬP NHẬT TRẠNG THÁI SUBTASK
    // ---------------------------
    const handleUpdateSubTaskStatus = async (subTaskId, newStatus) => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.put(
          `${API_URL}/tickets/${ticket._id}/subtasks/${subTaskId}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          toast.success("Cập nhật subtask thành công!");
          // Cập nhật localTicket ngay (optimistic update)
          setLocalTicket((prev) => ({
            ...prev,
            subTasks: prev.subTasks.map((task) =>
              task._id === subTaskId ? { ...task, status: newStatus } : task
            ),
          }));
          // Fetch lại ticket để đồng bộ
          fetchTicketById(ticket._id);
        } else {
          toast.error("Không thể cập nhật subtask.");
        }
      } catch (error) {
        console.error("Lỗi cập nhật subtask:", error);
        toast.error("Lỗi cập nhật subtask.");
      }
    };

    // ---------------------------
    // HÀM THÊM SUBTASK
    // ---------------------------
    const handleAddSubTask = async () => {
      if (!newSubTaskTitle.trim()) {
        toast.warning("Tiêu đề subtask không được để trống.");
        return;
      }
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.post(
          `${API_URL}/tickets/${ticket._id}/subtasks`,
          {
            title: newSubTaskTitle,
            assignedTo: currentUser.fullname,
            status: "In Progress",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          toast.success("Thêm subtask thành công!");
          // Thêm ngay vào localTicket để hiển thị
          const updated = res.data.ticket; // API trả về ticket đã populate
          setLocalTicket(updated);
          setNewSubTaskTitle("");
          setShowAddSubTask(false);
        } else {
          toast.error("Không thể thêm subtask.");
        }
      } catch (error) {
        console.error("Lỗi thêm subtask:", error);
        toast.error("Lỗi thêm subtask.");
      }
    };

    // ---------------------------
    // RENDER GIAO DIỆN
    // ---------------------------
    return (
      <div className="p-4 space-y-3 overflow-auto">
        {/* PHẦN CHỌN TRẠNG THÁI TICKET */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold">Trạng thái: </span>
          <select
            value={localTicketStatus}
            onChange={(e) => {
              const newStatus = e.target.value;
              if (newStatus !== localTicketStatus) {
                // 1) Chặn Processing -> Done nếu còn subtask In Progress
                if (
                  localTicketStatus === "Processing" &&
                  newStatus === "Done"
                ) {
                  const pendingSubtasks = localTicket.subTasks.filter(
                    (task) => task.status === "In Progress"
                  );
                  if (pendingSubtasks.length > 0) {
                    toast.error(
                      "Bạn cần xử lý hết các subtask trước khi chuyển sang trạng thái Hoàn thành."
                    );
                    return;
                  }
                }
                // 2) Nếu chọn hủy, mở ô nhập lý do
                if (newStatus === "Cancelled") {
                  setShowCancelReasonInput(true);
                  return;
                }
                // 3) Còn lại (chọn Processing hoặc Done trực tiếp)
                handleUpdateStatus(newStatus);
                setLocalTicketStatus(newStatus);
              }
            }}
            className={`font-semibold text-white py-1 border-none rounded-full ${
              statusOptions.find((opt) => opt.value === localTicketStatus)?.bg
            }`}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ô NHẬP LÝ DO HỦY (chỉ hiển thị khi showCancelReasonInput = true) */}
        {showCancelReasonInput && (
          <div className="mt-3">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do huỷ ticket..."
              className="w-full p-2 border-none bg-[#EBEBEB] rounded-xl"
            />
            <button
              onClick={() => {
                if (!cancelReason.trim()) {
                  toast.error("Vui lòng nhập lý do huỷ.");
                  return;
                }
                // Cập nhật trạng thái sang Cancelled
                handleUpdateStatus("Cancelled", cancelReason);
                setLocalTicketStatus("Cancelled");
                setShowCancelReasonInput(false);
              }}
              className="mt-2 px-3 py-1 text-sm font-semibold bg-red-500 text-white rounded-xl"
            >
              Xác nhận
            </button>

            <button
              onClick={() => {
                setCancelReason("");
                setShowCancelReasonInput(false);
              }}
              className="mt-2 ml-2 px-3 py-1 text-sm font-semibold bg-gray-300 text-black rounded-xl"
            >
              Huỷ bỏ
            </button>
          </div>
        )}

        {/* DANH SÁCH SUBTASK */}
        <div className="w-full flex flex-row items-start justify-start gap-2">
          <div className="w-2/3 p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">Danh sách công việc</h3>
              <button
                onClick={() => setShowAddSubTask(true)}
                className="px-3 py-1 font-semibold text-red-600 hover:border-b hover:border-red-600"
              >
                + Việc
              </button>
            </div>
            {/* Form thêm subtask */}
            {showAddSubTask && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Thêm việc cần làm"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  className="p-2 rounded-lg border bg-[#EBEBEB] flex-1 text-sm"
                />
                <button
                  onClick={handleAddSubTask}
                  className="px-3 py-1 bg-[#002855] text-white rounded-lg"
                >
                  Thêm
                </button>
                <button
                  onClick={() => {
                    setShowAddSubTask(false);
                    setNewSubTaskTitle("");
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg"
                >
                  Hủy
                </button>
              </div>
            )}

            {/* Liệt kê subtask */}
            {localTicket.subTasks && localTicket.subTasks.length > 0 ? (
              localTicket.subTasks.map((task) => {
                let displayStatus = "";
                let bg = "";
                let textColor = "";

                // Xác định subtask đầu tiên "In Progress"
                const inProgressTasks = localTicket.subTasks.filter(
                  (t) => t.status === "In Progress"
                );
                const isFirstInProgress =
                  inProgressTasks.length > 0 &&
                  inProgressTasks[0]._id === task._id;

                if (task.status === "Completed") {
                  bg = "bg-[#E4EFE6]";
                  textColor = "text-[#009483]";
                  displayStatus = "Hoàn thành";
                } else if (task.status === "Cancelled") {
                  bg = "bg-[#EBEBEB] line-through";
                  textColor = "text-[#757575]";
                  displayStatus = "Hủy";
                } else if (task.status === "In Progress") {
                  if (isFirstInProgress) {
                    bg = "bg-[#E6EEF6]";
                    textColor = "text-[#002855]";
                    displayStatus = "Đang xử lý";
                  } else {
                    bg = "bg-[#EBEBEB]";
                    textColor = "text-[#757575]";
                    displayStatus = "Chờ xử lý";
                  }
                }

                return (
                  <div
                    key={task._id}
                    className={`flex justify-between items-center px-4 py-2 rounded-lg mb-2 text-sm font-bold ${bg} ${textColor}`}
                  >
                    <span>{task.title}</span>
                    <div className="flex items-center gap-3">
                      {/* Dropdown để đổi trạng thái subtask */}
                      <select
                        disabled={localTicketStatus === "Cancelled"}
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateSubTaskStatus(task._id, e.target.value)
                        }
                        className={`border-none text-right text-sm ${bg} ${textColor}`}
                      >
                        <option value="In Progress">
                          {isFirstInProgress ? "Đang xử lý" : "Chờ xử lý"}
                        </option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Cancelled">Hủy</option>
                      </select>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600">
                Không có sub-task nào cho ticket này.
              </p>
            )}
          </div>

          {/* BẢNG LỊCH SỬ THAY ĐỔI */}
          <div className="w-1/3  border-l pl-4">
            <h3 className="text-base font-semibold mb-2">Lịch sử</h3>
            {localTicket.history && localTicket.history.length > 0 ? (
              <div className="space-y-2">
                {[...localTicket.history].reverse().map((log, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: log.action }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Chưa có lịch sử thay đổi cho ticket này.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== ProgressTab Code Kết Thúc ==========

  // Tab “Trao đổi”
  const DiscussionTab = ({ ticket, currentUser, messages, setMessages }) => {
    // Input text
    const [localMessage, setLocalMessage] = useState("");
    // Để track file upload
    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    // Khu vực chat
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Chỉ cuộn xuống lần đầu hoăc nếu người dùng ở gần đáy
    const [autoScroll, setAutoScroll] = useState(true);

    // Lần đầu mount => cuộn xuống đáy
    useEffect(() => {
      scrollToBottom(false);
      // eslint-disable-next-line
    }, []);

    // Mỗi lần messages thay đổi => chỉ cuộn nếu autoScroll=true
    useEffect(() => {
      if (autoScroll) {
        scrollToBottom(); // có thể dùng smooth/auto tuỳ ý
      }
    }, [messages, autoScroll]);

    // Hàm cuộn xuống đáy
    const scrollToBottom = (smooth = true) => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
        });
      }
    };

    // Theo dõi cuộn để biết user có đang ở đáy không
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      // Nếu user đang ở vị trí cách đáy dưới 80px => autoScroll = true
      if (scrollHeight - scrollTop - clientHeight < 80) {
        setAutoScroll(true);
      } else {
        setAutoScroll(false);
      }
    };

    // Gửi tin nhắn text
    const handleSendMessage = async () => {
      if (!localMessage.trim() || !ticket?._id || isSending) return;
      setIsSending(true);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.post(
          `${API_URL}/tickets/${ticket._id}/messages`,
          { text: localMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setLocalMessage("");
          await fetchTicketById(ticket._id);
        } else {
          toast.error("Không thể gửi tin nhắn.");
        }
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        toast.error("Lỗi khi gửi tin nhắn.");
      } finally {
        setIsSending(false);
      }
    };

    const handleUploadFile = async (file) => {
      if (!file || !ticket?._id) return;
      try {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("authToken");
        const res = await axios.post(
          `${API_URL}/tickets/${ticket._id}/messages`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          // Thay vì setMessages(...) => Gọi hàm fetchTicketById
          await fetchTicketById(ticket._id);
          toast.success("Đã upload ảnh!");
        } else {
          toast.error("Không thể upload ảnh.");
        }
      } catch (error) {
        console.error("Lỗi upload file:", error);
        toast.error("Lỗi khi upload file.");
      }
    };

    // Bắt sự kiện người dùng chọn file từ input
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleUploadFile(file);
      }
    };

    // Bắt sự kiện click nút
    const openFileDialog = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    // Xử lý drag & drop
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    const handleDrop = (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleUploadFile(file);
      }
    };

    // JSX
    return (
      <div
        className="bg-white w-full h-full p-4 flex flex-col"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Danh sách tin nhắn */}
        <div
          className="flex-1 mt-2 mb-4 overflow-auto space-y-4"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {(Array.isArray(messages) ? messages : []).map((m, idx) => {
            const isSelf = m.isSelf;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 ${
                  isSelf ? "justify-end" : "justify-start"
                }`}
              >
                {!isSelf && (
                  <img
                    src={m.senderAvatar || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-11 h-11 rounded-full border shadow-md object-cover"
                  />
                )}
                <div className="flex flex-col max-w-[70%]">
                  {/* Nội dung tin nhắn: text hoặc ảnh */}
                  {m.type === "image" ? (
                    <img
                      src={m.text}
                      alt="uploaded"
                      className={`max-w-xs rounded-lg border ${
                        isSelf ? "border-[#E4E9EF]" : "border-[#EBEBEB]"
                      }`}
                    />
                  ) : (
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isSelf
                          ? "bg-[#E4E9EF] text-[#002147]"
                          : "bg-[#EBEBEB] text-[#757575]"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}

                  <div className="text-[11px] text-[#757575] mt-1">
                    {m.time}
                  </div>
                </div>
                {isSelf && (
                  <img
                    src={m.senderAvatar || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-11 h-11 rounded-full border shadow-md object-cover"
                  />
                )}
              </div>
            );
          })}
          {/* Mỏ neo cuộn */}
          <div ref={messagesEndRef} />
        </div>

        {/* Thanh nhập tin nhắn + nút upload */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Nút Upload file */}
          <button
            onClick={openFileDialog}
            className="bg-gray-200 text-gray-700 p-3 rounded-full flex items-center"
          >
            <FaImage />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept="image/*"
          />

          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full p-3 border-none bg-[#EBEBEB] rounded-full text-sm"
          />

          <button
            onClick={handleSendMessage}
            className="bg-[#FF5733] text-white p-3 rounded-full flex items-center"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
    >
      {/* Modal content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[80%] h-[85%] p-8 rounded-lg shadow-lg flex flex-row gap-6"
      >
        {/* CỘT TRÁI */}
        <div className="flex flex-col w-3/4">
          <h1 className="text-start text-xl font-bold text-[#002147] mb-3">
            {ticket.ticketCode}: {ticket.title || "N/A"}
          </h1>

          {/* Tabs */}
          <div className="flex gap-6 border-b">
            <div className="flex gap-6 border-b">
              <button
                onClick={() => setDetailTab("request")}
                className={`pb-2 ${
                  detailTab === "request"
                    ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                    : "text-[#757575]"
                }`}
              >
                Yêu cầu
              </button>
              {ticket.status !== "Assigned" && (
                <>
                  <button
                    onClick={() => setDetailTab("progress")}
                    className={`pb-2 ${
                      detailTab === "progress"
                        ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                        : "text-[#757575]"
                    }`}
                  >
                    Tiến trình
                  </button>
                  <button
                    onClick={() => setDetailTab("discussion")}
                    className={`pb-2 ${
                      detailTab === "discussion"
                        ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                        : "text-[#757575]"
                    }`}
                  >
                    Trao đổi
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nội dung Tab */}
          <div className="flex-1 overflow-hidden mt-3">
            <div className="h-full max-h-full overflow-y-hidden hover:overflow-y-auto">
              {detailTab === "request" && <RequestTab />}
              {detailTab === "progress" && <ProgressTab />}
              {detailTab === "discussion" && (
                <DiscussionTab
                  ticket={ticket}
                  currentUser={currentUser}
                  messages={messages}
                  setMessages={setMessages}
                />
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI - THÔNG TIN TICKET (CỐ ĐỊNH) */}
        <div className="w-1/4 max-h-fit overflow-y-hidden hover:overflow-y-auto flex-shrink-0 border rounded-2xl p-3 flex flex-col">
          <div className="p-2 text-[#002147] flex flex-col">
            <div className="space-y-[5%]">
              <div className="flex-row flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm text-[#757575]">Mã yêu cầu</p>
                  <p className="text-base font-semibold">
                    {ticket.ticketCode || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Loại yêu cầu</p>
                <p className="text-base font-semibold">
                  {ticket.type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Trạng thái</p>
                {(() => {
                  const statusMapping = {
                    Processing: {
                      label: "Đang xử lý",
                      bg: "bg-[#F5AA1E] text-white",
                    },
                    Done: {
                      label: "Hoàn thành",
                      bg: "bg-green-500 text-white",
                    },
                    Cancelled: {
                      label: "Đã huỷ",
                      bg: "bg-orange-red text-white",
                    },
                    Closed: { label: "Đóng", bg: "bg-[#3DB838] text-white" },
                    Assigned: {
                      label: "Đã nhận",
                      bg: "bg-[#002855] text-white",
                    },
                    "Waiting for Customer": {
                      label: "Chờ phản hồi",
                      bg: "bg-orange-500 text-white",
                    },
                    Open: { label: "Chưa nhận", bg: "bg-gray-600 text-white" },
                  };
                  return (
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                        statusMapping[ticketStatus]?.bg ||
                        "bg-gray-300 text-black"
                      }`}
                    >
                      {statusMapping[ticketStatus]?.label ||
                        ticketStatus ||
                        "N/A"}
                    </span>
                  );
                })()}
              </div>
              <div>
                <p className="text-sm text-[#757575]">Ngày yêu cầu</p>
                <p className="text-base font-semibold">
                  {ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleDateString("vi-VN")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">
                  Ngày hoàn thành dự kiến
                </p>
                <p className="text-base font-semibold">
                  {new Date(ticket.sla).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Người tạo</p>
                <div className="flex items-center gap-2 mt-3">
                  <img
                    src={`${BASE_URL}/uploads/Avatar/${ticket.creator?.avatarUrl}`}
                    alt="Avatar"
                    className="w-16 h-16 rounded-xl object-cover border"
                  />
                  <div>
                    <p className="text-base font-semibold">
                      {ticket.creator?.fullname || "Chưa có"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ticket.creator?.jobTitle === "technical"
                        ? "Kỹ thuật viên"
                        : ticket.creator?.jobTitle || ""}
                    </p>
                  </div>
                </div>
              </div>
              {(ticket.status === "Assigned" ||
                ticket.status === "Processing" ||
                ticket.status === "Done" ||
                ticket.status === "Cancelled" ||
                ticket.status === "Closed") && (
                <div>
                  <p className="text-sm text-[#757575]">
                    {ticket.status === "Assigned"
                      ? "Người được chỉ định"
                      : "Người thực hiện"}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex gap-2">
                      <img
                        src={`${BASE_URL}/uploads/Avatar/${ticket.assignedTo?.avatarUrl}`}
                        alt="Avatar"
                        className="w-16 h-16 rounded-xl object-cover border"
                      />
                      <div>
                        <p className="text-base font-semibold">
                          {ticket.assignedTo?.fullname || "Chưa có"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ticket.assignedTo?.jobTitle === "technical"
                            ? "Kỹ thuật viên"
                            : ticket.assignedTo?.jobTitle || ""}
                        </p>
                        <TechnicalRating technicalId={ticket.assignedTo?._id} />
                      </div>
                    </div>
                    <button
                      className="mt-2 px-2 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300"
                      onClick={() => setShowSwapModal(true)}
                    >
                      <FaArrowRightArrowLeft />
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Swap */}
              {showSwapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg w-96">
                    <h3 className="text-lg font-bold mb-2">
                      Đổi người thực hiện
                    </h3>
                    <select
                      className="border p-2 rounded w-full mb-4"
                      value={swapUserId}
                      onChange={(e) => setSwapUserId(e.target.value)}
                    >
                      <option value="">Chọn người xử lý </option>
                      {technicalUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullname} ({u.email})
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={() => {
                          setShowSwapModal(false);
                          setSwapUserId("");
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                        onClick={handleSwapUser}
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {ticket.status === "Assigned" && (
                <div className="flex flex-row items-center justify-center pt-[2%] gap-2">
                  <button
                    className="w-1/2 px-4 py-2 bg-[#002855] text-white rounded-lg font-semibold hover:bg-[#002855] transition"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("authToken");
                        const res = await axios.put(
                          `${API_URL}/tickets/${ticket._id}`,
                          {
                            status: "Processing",
                            assignedTo: currentUser.id,
                          },
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (res.data.success) {
                          toast.success(
                            "Đã nhận ticket. Chuyển sang trạng thái Đang xử lý."
                          );

                          await fetchTicketById(ticket._id);
                        } else {
                          toast.error("Không thể nhận ticket.");
                        }
                      } catch (error) {
                        console.error("Lỗi khi nhận ticket:", error);
                        toast.error("Lỗi khi nhận ticket.");
                      }
                    }}
                  >
                    Nhận Ticket
                  </button>
                  <button
                    className="w-1/2 px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-orange-500 transition"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Huỷ Ticket
                  </button>
                </div>
              )}
              {showCancelModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-lg w-96">
                    <h3 className="text-lg font-bold mb-4">Huỷ Ticket</h3>
                    <textarea
                      placeholder="Nhập lý do huỷ ticket"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-4"
                      rows={3}
                    />
                    <div className="flex justify-end gap-4">
                      <button
                        className="px-4 py-2 bg-gray-300 text-black rounded-lg"
                        onClick={() => setShowCancelModal(false)}
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg"
                        onClick={handleCancelTicket}
                      >
                        Xác nhận huỷ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
