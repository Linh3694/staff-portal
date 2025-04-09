import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import { FaFilter } from "react-icons/fa6";
import { API_URL, BASE_URL } from "../../config";
import { toast } from "react-toastify";

// Import 2 file tách riêng
import TicketCreate from "./TicketCreate";
import TicketDetail from "./TicketDetail";

const Ticket = ({ currentUser }) => {
  // ---------------------- STATE & LOGIC CHUNG ----------------------
  const [activeTab, setActiveTab] = useState("create"); // (Có thể bỏ nếu không cần tab)
  const [step, setStep] = useState(1);

  const [ticketData, setTicketData] = useState({
    type: "",
    title: "",
    description: "",
    images: [],
    attachments: [],
    notes: "",
    priority: "Medium",
  });

  const [ticketCreatedId, setTicketCreatedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const token = localStorage.getItem("authToken");
  const [userTickets, setUserTickets] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Chat & feedback
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // ---------------------- API CALLS ----------------------
  const fetchUserTickets = async () => {
    try {
      let url = `${API_URL}/tickets`;
      if (currentUser?.id) {
        url += `?creator=${currentUser.id}`;
      }
      if (filterStatus) {
        url += `${currentUser?.id ? "&" : "?"}status=${filterStatus}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setUserTickets(res.data.tickets || []);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách ticket:", error);
    }
  };

  const fetchTicketById = async (ticketId) => {
    if (!ticketId) return;
    try {
      const res = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết ticket:", error);
    }
  };

  const submitTicket = async () => {
    try {
      const formData = new FormData();
      formData.append("title", ticketData.title);
      formData.append("description", ticketData.description);
      formData.append("priority", ticketData.priority);
      formData.append("notes", ticketData.notes);

      if (currentUser?.id) {
        formData.append("creator", currentUser.id);
      } else {
        console.error("Lỗi: Không tìm thấy userId của người tạo ticket.");
        return;
      }

      ticketData.images.forEach((file) => formData.append("attachments", file));

      const res = await axios.post(`${API_URL}/tickets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success && res.data.ticket?.ticketCode) {
        setTicketCreatedId(res.data.ticket.ticketCode);
        setStep(5); // chuyển sang bước 5
      } else {
        console.error("Lỗi: Không có mã Ticket trả về từ server");
      }

      // Fetch lại danh sách ticket sau khi tạo
      await fetchUserTickets();
      setStep(5);
    } catch (error) {
      console.error("Lỗi khi tạo ticket:", error);
    }
  };

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

  const handleFeedback = async () => {
    try {
      const hasPreviousRating =
        selectedTicket.feedback && selectedTicket.feedback.rating;
      if (!hasPreviousRating) {
        // Lần đầu
        if (!rating) {
          toast.error("Vui lòng chọn số sao trước khi gửi.");
          return;
        }
      } else {
        // Đã có rating => phải có comment
        if (!rating) {
          toast.error("Vui lòng chọn số sao để cập nhật đánh giá.");
          return;
        }
        if (!review.trim()) {
          toast.error("Bạn cần nhập nhận xét khi thay đổi đánh giá.");
          return;
        }
      }

      const res = await axios.post(
        `${API_URL}/tickets/${selectedTicket._id}/feedback`,
        {
          rating,
          comment: review,
          badges: selectedBadges, // ✅ Thêm dòng này
        },

        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Đánh giá thành công!");
        // load lại ticket
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Có lỗi xảy ra khi gửi đánh giá.");
      }
    } catch (error) {
      console.error("Error feedback:", error);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    }
  };

  const handleReopenTicket = async () => {
    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { status: "Processing" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được mở lại, vui lòng chờ kỹ thuật xử lý.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi mở lại ticket");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
    }
  };

  const handleFeedbackAndClose = async () => {
    // Gửi feedback
    await handleFeedback();
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { status: "Closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được cập nhật sang trạng thái Closed.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi cập nhật trạng thái ticket.");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Lỗi khi cập nhật trạng thái ticket.");
    }
  };

  const handleUrgent = async () => {
    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { priority: "High" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket priority updated to High.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Error updating priority.");
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Error updating priority.");
    }
  };

  // Hàm xử lý huỷ ticket với lý do nhập vào
  const handleCancelTicket = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ ticket.");
      return;
    }
    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { status: "Cancelled", cancellationReason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được huỷ.");
        fetchTicketById(selectedTicket._id);
        setShowCancelModal(false);
        setCancelReason("");
      } else {
        toast.error("Lỗi khi huỷ ticket.");
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      toast.error("Error cancelling ticket.");
    }
  };

  // ---------------------- USE EFFECTS ----------------------
  // Tự động reload mỗi 5s nếu đã có selectedTicket
  useEffect(() => {
    let interval = null;
    if (selectedTicket?._id) {
      interval = setInterval(() => {
        fetchTicketById(selectedTicket._id);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTicket?._id]);

  // Khi user click xem chi tiết, set messages
  useEffect(() => {
    if (selectedTicket && selectedTicket.messages) {
      const mapped = selectedTicket.messages.map((m) => ({
        text: m.text,
        sender: m.sender?.fullname || "N/A",
        senderId: m.sender?._id,
        senderAvatar: m.sender?.avatarUrl
          ? `${BASE_URL}/uploads/Avatar/${m.sender.avatarUrl}`
          : "/default-avatar.png",
        time: new Date(m.timestamp).toLocaleString("vi-VN"),
        isSelf: m.sender?._id === currentUser?.id,
        type: m.type || "text",
      }));
      setMessages(mapped);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket?._id) {
      setRating(selectedTicket.feedback?.rating || 0);
      setReview(selectedTicket.feedback?.comment || "");
      setSelectedBadges(selectedTicket.feedback?.badges || []); // ✅ Gán lại badge nếu đã có
    }
  }, [selectedTicket?._id]);

  // Mỗi khi searchTerm / filterStatus thay đổi => load list
  useEffect(() => {
    fetchUserTickets();
  }, [searchTerm, filterStatus]);

  // ---------------------- RENDER ----------------------
  return (
    <div className="h-screen p-8 flex justify-center overflow-y-hidden">
      <div className="w-full h-full flex flex-row gap-6">
        {/* CỘT BÊN TRÁI - DANH SÁCH TICKET */}
        <div className="w-1/4 h-full px-6 py-4 bg-white rounded-2xl shadow-lg">
          <div className="flex flex-row items-center justify-between mb-8">
            <span className="text-xl font-bold text-gray-800">
              Danh sách Ticket
            </span>
            <button
              onClick={() => {
                setShowCreateTicket(true);
                setSelectedTicket(null);
              }}
              className="px-2 py-1 bg-[#FF5733] text-white text-xs font-semibold rounded-lg shadow-md hover:bg-[#E44D26] transition-all"
            >
              Tạo Ticket
            </button>
          </div>

          {/* Tìm kiếm & Filter */}
          <div className="mb-4">
            <div className="relative mb-3 flex items-center gap-2">
              <div className="relative w-full">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-none text-sm rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="absolute right-2">
                <button
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                  className="bg-[#002855] text-white px-3 py-2 rounded-full font-semibold flex items-center gap-1 shadow-sm hover:bg-[#003055] transition"
                >
                  <FaFilter size={12} />
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {[
                      "",
                      "Open",
                      "Processing",
                      "Waiting for Customer",
                      "Closed",
                      "Cancelled",
                    ].map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterDropdown(false);
                        }}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                          filterStatus === status
                            ? "bg-gray-200 font-semibold"
                            : ""
                        }`}
                      >
                        {
                          {
                            "": "Tất cả",
                            Open: "Chưa nhận",
                            Processing: "Đang xử lý",
                            "Waiting for Customer": "Chờ phản hồi",
                            Closed: "Đóng",
                            Cancelled: "Hủy",
                          }[status]
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LIST TICKET */}
          <div className="mt-3 flex flex-col gap-4 h-[86%] overflow-hidden hover:overflow-y-auto">
            {userTickets.length === 0 ? (
              <p className="text-gray-500">Không có ticket nào.</p>
            ) : (
              userTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm cursor-pointer"
                  onClick={() => {
                    fetchTicketById(ticket._id);
                    setShowCreateTicket(false);
                  }}
                >
                  <div className="w-full flex-col">
                    <h3 className="text-[#002147] font-semibold">
                      {ticket.title || "Chưa có tiêu đề"}
                    </h3>

                    <div className="flex flex-row items-center justify-between">
                      <p className="text-[#757575] text-xs mt-2">
                        {ticket.ticketCode}
                      </p>
                      <span
                        className={`px-3 py-1 text-xs rounded-lg font-semibold mt-6 ${
                          ticket.status === "Processing"
                            ? "bg-[#F5AA1E] text-white"
                            : ticket.status === "Waiting for Customer"
                            ? "bg-[#F05023] text-white"
                            : ticket.status === "Closed"
                            ? "bg-[#3DB838] text-white"
                            : "bg-[#002855] text-white"
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
                          : ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT BÊN PHẢI */}
        {showCreateTicket && !selectedTicket && (
          <TicketCreate
            currentUser={currentUser}
            step={step}
            setStep={setStep}
            ticketData={ticketData}
            setTicketData={setTicketData}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            submitTicket={submitTicket}
            ticketCreatedId={ticketCreatedId}
          />
        )}
        {selectedTicket && !showCreateTicket && (
          <TicketDetail
            selectedTicket={selectedTicket}
            currentUser={currentUser}
            messages={messages}
            setMessages={setMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            rating={rating}
            setRating={setRating}
            review={review}
            setReview={setReview}
            handleFeedback={handleFeedback}
            selectedBadges={selectedBadges}
            setSelectedBadges={setSelectedBadges}
            handleReopenTicket={handleReopenTicket}
            handleFeedbackAndClose={handleFeedbackAndClose}
            handleUrgent={handleUrgent}
            handleCancelTicket={handleCancelTicket}
            setShowCancelModal={setShowCancelModal}
            fetchTicketById={fetchTicketById}
          />
        )}
      </div>
      {/* Modal huỷ ticket */}
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
  );
};

export default Ticket;
