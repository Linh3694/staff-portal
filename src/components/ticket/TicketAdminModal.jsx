// /src/components/ticket/TicketAdminModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { toast } from "react-toastify";
import TechnicalRating from "./TechnicalRating";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

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
      const mapped = ticket.messages.map((m) => {
        return {
          text: m.text,
          sender: m?.sender?.fullname || "N/A",
          senderId: m?.sender?._id,
          senderAvatar: m.sender?.avatarUrl
            ? `${BASE_URL}/uploads/Avatar/${m.sender.avatarUrl}`
            : "/default-avatar.png",
          time: new Date(m.timestamp).toLocaleString("vi-VN"),
          isSelf: m?.sender?._id === currentUser?.id,
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

  // Tab “Tiến trình”
  const ProgressTab = () => {
    return (
      <div className="p-4 space-y-3 overflow-auto">
        <p className="font-semibold text-[#002147]">
          Trạng thái: {ticket.status}
        </p>

        {ticket.subTasks && ticket.subTasks.length > 0 ? (
          ticket.subTasks.map((task) => (
            <div
              key={task._id}
              className="bg-gray-100 p-2 rounded-lg flex justify-between items-center"
            >
              <span>{task.title}</span>
              <span className="text-xs italic">{task.status}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">
            Không có sub-task nào cho ticket này.
          </p>
        )}

        {/* Admin/Technical có thể update status? Tùy logic */}
      </div>
    );
  };

  // Tab “Trao đổi”
  // Tab “Trao đổi”
  const DiscussionTab = ({ ticket, currentUser, messages, setMessages }) => {
    // Sử dụng state cục bộ cho input tin nhắn
    const [localMessage, setLocalMessage] = useState("");
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Khi danh sách tin nhắn thay đổi, cuộn xuống cuối
    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    // Giữ focus trên input
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [localMessage]);

    const handleSendMessage = async () => {
      if (!localMessage.trim() || !ticket?._id) return;
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.post(
          `${API_URL}/tickets/${ticket._id}/messages`,
          { text: localMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          // Thêm tin nhắn mới vào danh sách hiện tại
          const newMsg = {
            text: localMessage,
            sender: currentUser?.fullname || "N/A",
            senderAvatar: currentUser?.avatarUrl
              ? `${BASE_URL}/uploads/Avatar/${currentUser.avatarUrl}`
              : "/default-avatar.png",
            time: new Date().toLocaleString("vi-VN"),
            isSelf: true,
          };
          setMessages((prev) => [...prev, newMsg]);
          setLocalMessage("");
        } else {
          toast.error("Không thể gửi tin nhắn.");
        }
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        toast.error("Lỗi khi gửi tin nhắn.");
      }
    };

    return (
      <div className="bg-white w-full h-full p-4 flex flex-col">
        <div className="flex-1 mt-2 mb-4 overflow-auto space-y-4">
          {(Array.isArray(messages) ? messages : []).map((m, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 ${
                m.isSelf ? "justify-end" : "justify-start"
              }`}
            >
              {!m.isSelf && (
                <img
                  src={m.senderAvatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full border shadow-md object-cover"
                />
              )}
              <div className="flex flex-col max-w-[70%]">
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    m.isSelf
                      ? "bg-[#E4E9EF] text-[#002147]"
                      : "bg-[#EBEBEB] text-[#757575]"
                  }`}
                >
                  {m.text}
                </div>
                <div className="text-[11px] text-[#757575] mt-1">{m.time}</div>
              </div>
              {m.isSelf && (
                <img
                  src={currentUser?.avatarUrl || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full border shadow-md object-cover"
                />
              )}
            </div>
          ))}
          {/* Element tham chiếu để cuộn xuống cuối */}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder="Nhập tin nhắn..."
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            className="w-full p-2 border-none bg-[#EBEBEB] rounded-full text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="bg-[#FF5733] text-white p-2 rounded-full flex items-center"
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
        <div className="flex flex-col w-3/4 h-full">
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
        <div className="w-1/4 max-h-fit overflow-y-hidden hover:overflow-y-auto flex-shrink-0 border rounded-2xl p-3 flex flex-col justify-center my-auto">
          <div className="p-2 text-[#002147] flex flex-col">
            <div className="space-y-6">
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
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                    ticket.status === "Processing"
                      ? "bg-[#F5AA1E] text-white"
                      : ticket.status === "Waiting for Customer"
                      ? "bg-orange-500 text-white"
                      : ticket.status === "Closed"
                      ? "bg-[#3DB838] text-white"
                      : ticket.status === "Assigned"
                      ? "bg-[#002855] text-white"
                      : ticket.status === "Open"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  {ticket.status === "Open"
                    ? "Chưa nhận"
                    : ticket.status === "Processing"
                    ? "Đang xử lý"
                    : ticket.status === "Assigned"
                    ? "Đã nhận"
                    : ticket.status === "Waiting for Customer"
                    ? "Chờ phản hồi"
                    : ticket.status === "Closed"
                    ? "Đóng"
                    : ticket.status || "N/A"}
                </span>
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
                ticket.status === "Processing") && (
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
                <div className="pt-[2%]">
                  <button
                    className="w-full px-4 py-2 bg-orange-red text-white rounded-lg font-semibold hover:bg-orange-500 transition"
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
                          if (typeof window !== "undefined")
                            window.location.reload(); // Or refetch ticket data here
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
                    className="w-full flex-1 px-4 py-2 bg-red-600 hover:bg-orange-red text-white text-sm font-semibold rounded-lg"
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
