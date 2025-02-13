import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { FiSearch } from "react-icons/fi";
import { API_URL } from "../../config";
import { FaRegCircle, FaRegCircleDot, FaStar } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";

const Ticket = ({currentUser}) => {
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);
  const [ticketData, setTicketData] = useState({
    type: "",
    description: "",
    images: [],
    attachments: [],
    notes: "",
    priority: "Medium",
  });

  const [ticketCreatedId, setTicketCreatedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const token = localStorage.getItem("authToken");
  const [userTickets, setUserTickets] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rating, setRating] = useState(selectedTicket?.feedback?.rating || 0);
  const [review, setReview] = useState(selectedTicket?.feedback?.comment || "");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchTicketById = async (ticketId) => {
    console.log("📥 Fetching Ticket ID:", ticketId); // 🔥 Debug
    if (!ticketId) {
      console.error("🚨 Lỗi: Ticket ID bị undefined!");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📜 Dữ liệu từ API:", res.data.ticket); // ✅ Kiểm tra dữ liệu từ API
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết ticket:", error);
    }
  };

  const fetchUserTickets = async () => {
    try {
      let url = `${API_URL}/tickets`;
      
      if (currentUser?.id) {
        url += `?creator=${currentUser.id}`;
      } else {
        console.warn("⚠️ Không tìm thấy currentUser, gửi request không có creator");
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
        // Cập nhật ngay UI
        setMessages(prev => [
          ...prev,
          {
            text: newMessage,
            sender: currentUser?.fullname || "Me",
            senderId: currentUser?.id,
            senderAvatar: currentUser?.avatar || "/logo.png",
            time: new Date().toLocaleString("vi-VN"),
            isSelf: true,
          },
        ]);
        setNewMessage("");
        // await fetchTicketById(selectedTicket._id);
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
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
        formData.append("creator", currentUser.id); // 👈 Gửi ID của creator
      } else {
        console.error("Lỗi: Không tìm thấy userId của người tạo ticket.");
        return;
      }
      ticketData.images.forEach((file) => formData.append("attachments", file));
      console.log("Dữ liệu gửi đi:", Object.fromEntries(formData)); // ✅ Log kiểm tra dữ liệu
      const res = await axios.post(`${API_URL}/tickets`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });  
      if (res.data.success && res.data.ticket?.ticketCode) {
        setTicketCreatedId(res.data.ticket.ticketCode);
        setStep(5); // Chuyển sang bước 5 sau khi tạo ticket thành công
      } else {
        console.error("Lỗi: Không có mã Ticket trả về từ server");
      }
  
      // Fetch lại danh sách ticket để đảm bảo hiển thị đúng
      await fetchUserTickets();
  
      // Chuyển sang bước 5 sau khi tạo ticket xong
      setStep(5);
    } catch (error) {
      console.error("Lỗi khi tạo ticket:", error);
    }
  };

  // Hàm gọi API gửi feedback
const handleFeedback = async () => {
  try {
    // Kiểm tra logic bắt buộc
    const hasPreviousRating = selectedTicket.feedback && selectedTicket.feedback.rating;
    if (!hasPreviousRating) {
      // Lần đầu
      if (!rating) {
        alert("Vui lòng chọn số sao trước khi gửi.");
        return;
      }
      // Comment không bắt buộc -> OK
    } else {
      // Đã có rating cũ => bắt buộc có comment
      if (!rating) {
        alert("Vui lòng chọn số sao để cập nhật đánh giá.");
        return;
      }
      if (!review.trim()) {
        alert("Bạn cần nhập nhận xét khi thay đổi đánh giá.");
        return;
      }
    }

    // Gửi request POST /tickets/:ticketId/feedback
    const res = await axios.post(
      `${API_URL}/tickets/${selectedTicket._id}/feedback`,
      { rating, comment: review },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.data.success) {
      alert("Đánh giá thành công!");
      // Cập nhật lại giao diện, load lại ticket
    } else {
      alert("Có lỗi xảy ra khi gửi đánh giá.");
    }
  } catch (error) {
    console.error("Error feedback:", error);
    alert("Không thể gửi đánh giá. Vui lòng thử lại sau.");
  }
};

  const ProgressIndicator = ({ step }) => {
    return (
      <div className="flex items-center justify-center mb-8">
        {/* Step 2 - Đã hoàn thành ✅ hoặc Đang làm 🔴 */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
            {step === 2 ? (
              <FaRegCircleDot size={28} className="text-[#FF5733] drop-shadow-md" /> // Đang làm 🔴
            ) : step > 2 ? (
              <FaCheckCircle size={28} className="text-[#FF5733] bg-white rounded-full" /> // Đã hoàn thành ✅
            ) : (
              <FaRegCircle className="bg-[#FF5733] text-2xl rounded-full" /> // Mặc định ⚪
            )}
          </div>
          <div className={`w-24 h-[2px] transition-all duration-300 ${step >= 3 ? "bg-gray-300" : "bg-gray-300"}`}></div>
        </div>
  
        {/* Step 3 - Đang làm 🔴 hoặc chưa làm ⚪ */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
            {step === 3 ? (
              <FaRegCircleDot size={28} className="text-[#FF5733] drop-shadow-md" /> // Đang làm 🔴
            ) : step > 3 ? (
              <FaCheckCircle size={28} className="text-[#FF5733] bg-white rounded-full" /> // Đã hoàn thành ✅
            ) : (
              <FaRegCircle className="text-[#FF5733] text-2xl" /> // Mặc định ⚪
            )}
          </div>
          <div className={`w-24 h-[2px] transition-all duration-300 ${step >= 4 ? "bg-gray-300" : "bg-gray-300"}`}></div>
        </div>
  
        {/* Step 4 - Đang làm 🔴 hoặc chưa làm ⚪ */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
          {step === 4 ? (
              <FaRegCircleDot size={28} className="text-[#FF5733] drop-shadow-md" /> // Đang làm 🔴
            ) : step > 4 ? (
            <FaCheckCircle className="bg-[#FF5733] text-2xl" /> // Đã hoàn thành ✅
          ) : (
            <FaRegCircle className="text-[#FF5733] text-2xl" /> // Mặc định ⚪
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (selectedTicket) {
      setRating(selectedTicket.feedback?.rating || 0);
      setReview(selectedTicket.feedback?.comment || "");
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket && selectedTicket.messages) {
      console.log(selectedTicket.messages)
      console.log(selectedTicket)
      const mapped = selectedTicket.messages.map((m) => ({
        text: m.text,
        sender: m.sender?.fullname || "N/A", // ✅ Lấy đúng fullname
        senderId: m.sender?._id, // ✅ Lấy ID của sender
        senderAvatar: m.sender?.avatarUrl || "/logo.png", // ✅ Hiển thị avatar
        time: new Date(m.timestamp).toLocaleString("vi-VN"),
        isSelf: m.sender?._id === currentUser?.id, // ✅ Kiểm tra user hiện tại
      }));
  
      console.log("📥 Tin nhắn sau khi map:", mapped); // ✅ Debug dữ liệu tin nhắn
      setMessages(mapped);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (activeTab === "search") {
      fetchUserTickets();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUserTickets();
  }, [searchTerm, filterStatus]);

  


  return (
    <div className="h-screen py-8 px-4 flex justify-center">
      <div className="w-full flex flex-row gap-6 max-h-[700px]">        
        {/* Bên trái - Danh sách ticket */}
        <div className="w-1/3 px-6 py-4 bg-white rounded-lg">
          <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-800">Danh sách Ticket</span>
            <button
            onClick={() => {
              setShowCreateTicket(true);
              setSelectedTicket(null); // Reset ticket khi tạo mới
            }}
            className="px-2 py-2 bg-[#FF5733] text-white font-bold rounded-lg shadow-md hover:bg-[#E44D26] transition-all"
          >
            Tạo Ticket
          </button>
        </div>
          {/* Tìm kiếm & Filter */}
          <div className="mb-4">
            {/* Ô tìm kiếm */}
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-none rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex items-center gap-2 mt-6">
              <div className="w-full rounded-lg p-4 flex flex-col gap-2 border"> 
              <p className="text-[#002147] font-semibold">Trạng thái:</p> 
              <div className="w-full grid grid-cols-3 gap-2 ">
              <button
                className={`px-3 py-1 rounded-full transition ${
                  filterStatus === "" ? "bg-blue-200 text-blue-800 font-semibold" : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setFilterStatus("")}
              >
                Tất cả
              </button>
              <button
                className={`px-3 py-1 rounded-full transition ${
                  filterStatus === "Open" ? "bg-blue-200 text-[#002147] font-semibold" : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setFilterStatus("Open")}
              >
                Chưa nhận
              </button>
              <button
                className={`px-3 py-1 rounded-full transition ${
                  filterStatus === "Processing" ? "bg-blue-200 text-blue-800 font-semibold" : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setFilterStatus("assignedOrProcessing")}
              >
                Đang xử lý
              </button>
              <button
                className={`px-3 py-1 rounded-full transition ${
                  filterStatus === "Waiting for Customer" ? "bg-blue-200 text-blue-800 font-semibold" : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setFilterStatus("Waiting for Customer")}
              >
                Chờ phản hồi
              </button>
              <button
                className={`px-3 py-1 rounded-full transition ${
                  filterStatus === "Closed" ? "bg-blue-200 text-blue-800 font-semibold" : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setFilterStatus("Closed")}
              >
                Đóng
              </button>
              {/* Hủy */}
                <button
                  className={`px-3 py-1 rounded-full transition ${
                    filterStatus === "Cancelled" ? "bg-blue-200 text-blue-800 font-semibold" : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setFilterStatus("Cancelled")}
                >
                  Hủy
                </button>
              </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-4 max-h-[400px] overflow-y-auto">
          {userTickets.length === 0 ? (
              <p className="text-gray-500">Không có ticket nào.</p>
            ) : (
              userTickets.map((ticket) => (
                <div k
                ey={ticket._id} 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm"
                onClick={() => {
                  fetchTicketById(ticket._id);
                  setShowCreateTicket(false); // Ẩn form tạo ticket khi xem chi tiết
                }}
                >
                  {/* Thông tin ticket */}
                  <div>
                    <h3 className="text-[#002147] font-semibold">{ticket.title || "Chưa có tiêu đề"}</h3>
                    <p className="text-[#757575] text-sm mt-2">{ticket.ticketCode}</p>
                  </div>
                  
                  {/* Trạng thái ticket */}
                  <span className={`px-3 py-1 text-sm rounded-lg font-semibold mt-6 ${
                    ticket.status === "Processing" ? "bg-[#F5AA1E] text-white" :
                    ticket.status === "Waiting for Customer" ? "bg-[#F05023] text-white" :
                    ticket.status === "Closed" ? "bg-[#3DB838] text-white" :
                    "bg-[#00687F] text-white"
                  }`}>
                    {ticket.status === "Open" ? "Chưa nhận" :
                    ticket.status === "Processing" ? "Đang xử lý" :
                    ticket.status === "Waiting for Customer" ? "Chờ phản hồi" :
                    ticket.status === "Closed" ? "Đóng" :
                    ticket.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>


        {/* Bên phải - Tạo ticket */}
        {showCreateTicket && !selectedTicket && (
        <div 
            className="w-[1100px] max-h-[900px] p-6 bg-white rounded-lg shadow-md relative"
          >
            {/* Icon góc dưới phải */}
            <img
              src="/ticket/icon3.png" 
              alt="WSHN Logo"
              className="absolute bottom-0 right-0 w-[240px] "
            />

            {/* Icon góc trên phải */}
            <img
              src="/ticket/icon1.png" 
              alt="Corner Right"
              className="absolute top-2 right-0 w-[120px]"
            />

            {/* Icon góc dưới trái */}
            <img
              src="/ticket/icon2.png" 
              alt="Corner Left"
              className="absolute bottom-16 left-0 w-[120px]"
            />
            
          {/* Container chính */}
          <div className="w-full p-6">
            {/* Nội dung từng Step */}
            <div className="w-full flex flex-col items-center justify-start pt-5">
              {step === 1 && (
                <div>
                  <h1 className="text-center text-2xl font-bold text-gray-800 mb-5">
                    Xin chào WISer{" "}
                    <span className="text-[#FF5733] font-semibold">{currentUser?.fullname}</span>, bạn cần chúng tớ{" "}
                    <span className="text-[#002147] font-semibold">hỗ trợ</span> gì ạ ^^
                  </h1>
                  <h1 className="text-center text-[#FF5733] text-md font-bold underline">
                    Hướng dẫn tạo ticket trên 360° WISers
                  </h1>
                  {/* Các lựa chọn */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
                      {[
                        { 
                          type: "device", 
                          label: "Hỗ trợ chung", 
                          image: "/ticket/overall.png",
                          description: "“Hỗ trợ chung” áp dụng cho các yêu cầu hỗ trợ kỹ thuật và vận hành hàng ngày, bao gồm sửa chữa, bảo trì và hướng dẫn sử dụng thiết bị."
                        },
                        { 
                          type: "event", 
                          label: "Hỗ trợ sự kiện", 
                          image: "/ticket/event.png",
                          description: "“Hỗ trợ sự kiện” áp dụng cho các yêu cầu hỗ trợ kỹ thuật trong quá trình tổ chức sự kiện trong trường."
                        },
                        { 
                          type: "hrorder", 
                          label: "Order Nhân sự", 
                          image: "/ticket/hrorder.png",
                          description: "“Order nhân sự” áp dụng cho các yêu cầu bổ sung nhân sự trong các tình huống cụ thể."
                        },
                      ].map(({ type, label, image, description }) => (
                        <div
                          key={type}
                          onClick={() => {
                            setTicketData((prev) => ({ ...prev, type }));
                            setSelectedOption(description);
                          }}
                          className={`relative w-[240px] h-[200px] flex flex-col items-center justify-end text-lg font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                            ticketData.type === type
                              ? " bg-[#E6EEF6] shadow-lg"  // Viền xanh khi chọn
                              : " border-transparent bg-gray-100"
                          }`}
                        >
                          {/* Ảnh đại diện */}
                          <img 
                            src={image} 
                            alt={label} 
                            className="absolute top-[-30px] w-[180px] h-[180px] object-contain"
                          />
                          {/* Văn bản hiển thị */}
                          <div className="pb-4">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Phần mô tả hiển thị bên dưới */}
                    {selectedOption && (
                      <div className="mt-6 p-4 border border-dashed rounded-lg text-[#002147] font-semibold text-center max-w-2xl mx-auto">
                        {selectedOption}
                      </div>
                    )}
                </div>
              )}

          {step === 2 && (
            <div className="w-full flex flex-col items-center">
              {ticketData.type === "event" ? (
                // 🛠 Giao diện riêng cho "Hỗ trợ sự kiện"
                <div className="w-full max-w-2xl">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết cho chúng tớ nhé
                  </h1>
                  <ProgressIndicator step={step} />
                  <div className="w-full flex flex-col gap-4">
                    {/* Tên sự kiện */}
                    <div>
                      <label className="text-lg font-semibold text-[#002147]">Tên sự kiện</label>
                      <input
                        type="text"
                        placeholder="Nhập nội dung"
                        value={ticketData.title}
                        onChange={(e) => setTicketData((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      />
                      <p className="text-gray-500 text-sm mt-1">Ngắn gọn, tối đa XX kí tự</p>
                    </div>

                    {/* Ngày bắt đầu và kết thúc */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={ticketData.startDate || ""}
                          onChange={(e) => setTicketData((prev) => ({ ...prev, startDate: e.target.value }))}
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">Ngày kết thúc</label>
                        <input
                          type="date"
                          value={ticketData.endDate || ""}
                          onChange={(e) => setTicketData((prev) => ({ ...prev, endDate: e.target.value }))}
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                    </div>

                    {/* Mô tả sự kiện */}
                    <div>
                      <label className="text-lg font-semibold text-[#002147]">Mô tả</label>
                      <textarea
                        className="w-full h-[100px] mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                        rows={5}
                        placeholder="Nhập mô tả"
                        value={ticketData.description}
                        onChange={(e) => setTicketData((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // 🛠 Giao diện mặc định cho "Hỗ trợ chung" và "Order nhân sự"
                <div className="w-[80%] flex flex-col items-center">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết cho chúng tớ nhé
                  </h1>
                  <ProgressIndicator step={step} />

                  <div className="w-[80%]">
                    <label className="text-lg font-semibold text-[#002147]">Nội dung</label>
                    <input
                      type="text"
                      placeholder="Nhập nội dung"
                      value={ticketData.title}
                      onChange={(e) => setTicketData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                    />
                    <p className="text-gray-500 text-sm mt-1">Ngắn gọn, tối đa XX kí tự</p>

                    <label className="text-lg font-semibold text-[#002147] mt-6 block">Mô tả</label>
                    <textarea
                      className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      rows={5}
                      placeholder="Nhập mô tả"
                      value={ticketData.description}
                      onChange={(e) => setTicketData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

              {step === 3 && (
                <div>
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy cung cấp cho chúng tớ hình ảnh nếu có thể nhé
                  </h1>
                  <ProgressIndicator step={step} />
                  {/* Hộp tải lên ảnh */}
                  <div 
                    className="w-full border-dashed border-2 border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 mt-6 cursor-pointer"
                    onClick={() => document.getElementById("fileUpload").click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      setTicketData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
                    }}
                  >
                    <img src="/ticket/upload.png" alt="Upload Icon" className="w-16 h-16 mb-4" />
                    <p className="text-md font-medium">Kéo thả hoặc chọn tệp từ máy tính</p>
                    <input
                      id="fileUpload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setTicketData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
                      }}
                    />
                  </div>
                  <div className="w-full flex justify-between items-center italic">
                      <p className="text-sm text-gray-400">Định dạng hỗ trợ: png, jpg, jpeg, heic</p>
                      <p className="text-sm text-gray-400">Dung lượng tối đa: XX MB</p>
                  </div>
                  {/* Danh sách ảnh đã tải lên */}
                  {ticketData.images.length > 0 && (
                    <div className="w-[70%] mt-6">
                      <h2 className="text-xl font-semibold text-[#002147] mb-2">Ảnh đã tải lên</h2>
                      <div className="flex gap-3 overflow-x-auto whitespace-nowrap py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                        {ticketData.images.map((file, index) => (
                          <div key={index} className="relative w-[100px] h-[100px] inline-block flex-shrink-0">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="Uploaded Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              onClick={() => {
                                setTicketData((prev) => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index),
                                }));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div>
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                  Note lại cho chúng tớ những điều cần thiết nhé
                  </h1>
                  <ProgressIndicator step={step} />
                  <div>
                    <span className="font-semibold text-lg">Ghi chú</span>
                    <textarea className="w-full h-[150px] mt-3 p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      rows={3} placeholder="Nhập ghi chú..."
                      value={ticketData.notes}
                      onChange={(e) => setTicketData((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="w-full flex flex-col items-center text-center pt-12">
                <img src="/ticket/final.png" className="w-48 h-64 mb-4" alt="Success Icon" />
                <h1 className="text-2xl font-bold text-gray-800">Cám ơn WISer {currentUser?.fullname}!</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Yêu cầu của bạn đã được ghi nhận. Nhân viên hỗ trợ sẽ liên hệ lại với bạn sớm nhất có thể.
                </p>
                {ticketCreatedId && (
                  <p className="mt-4 text-xl font-semibold text-blue-600">
                    Mã Ticket của bạn: <span className="font-bold">{ticketCreatedId}</span>
                  </p>
                )}
              </div>
              )}
            </div>  

            {/* Nút điều hướng (CỐ ĐỊNH) */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
                {step > 1 && (
                  <button
                    className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
                    onClick={() => {
                      if (step === 5) {
                        // Nếu đang ở bước 5, quay về bước 1 để tạo ticket mới
                        setTicketData({ type: "", description: "", images: [], notes: "", priority: "Medium" });
                        setStep(1);
                      } else {
                        // Lùi về bước trước đó
                        setStep(step - 1);
                      }
                    }}
                  >
                    {step === 5 ? "Trang chính" : "Quay lại"}
                  </button>
                )}

                {step < 5 && (
                  <button
                    className="px-6 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#E44D26] transition disabled:opacity-50"
                    disabled={
                      (step === 1 && !ticketData.type) ||
                      (step === 2 && (!ticketData.title || !ticketData.description)) ||
                      (step === 3 && ticketData.images.length === 0)
                    }
                    onClick={() => {
                      if (step === 4) {
                        // Nếu đang ở bước 4, submit ticket lên server
                        submitTicket();
                      } else {
                        // Chuyển sang bước tiếp theo
                        setStep(step + 1);
                      }
                    }}
                  >
                    {step === 4 ? "Hoàn tất" : "Tiếp tục"}
                  </button>
                )}
              </div>
            </div> 
        </div>
         )}
         {/* Khi xem chi tiết ticket */}
        {selectedTicket && (
          <div className="bg-white w-[1100px] max-h-[700px] rounded-xl shadow-xl p-6">
            <h1 className="text-start text-2xl font-bold text-[#002147] mb-5">
              {selectedTicket.title || "Chưa có tiêu đề"}
            </h1>

            {/* Bố cục chính */}
              <div className="grid grid-cols-2 gap-6">
                {/* Bên trái */}
                <div className="space-y-6">
                  {/* Thông tin chung */}
                  <div className="bg-[#F8F8F8] p-4 rounded-xl border-gray-200">
                    <h2 className="text-lg font-semibold text-[#002147] mb-4">Thông tin chung</h2>
                    <div className="bg-[#E4E9EF] p-4 rounded-lg grid grid-cols-2 gap-3">
                      <p className="text-gray-600 font-medium">Mã yêu cầu</p>
                      <p className="text-[#002147] font-semibold text-right">{selectedTicket.ticketCode}</p>

                      <p className="text-gray-600 font-medium">Người thực hiện</p>
                      <p className="text-[#002147] font-semibold text-right">{selectedTicket.assignedTo.fullname}</p>

                      <p className="text-gray-600 font-medium">Ngày yêu cầu</p>
                      <p className="text-[#002147] font-semibold text-right">{new Date(selectedTicket.createdAt).toLocaleDateString("vi-VN")}</p>

                      <p className="text-gray-600 font-medium ">Trạng thái</p>
                      <p className={`font-semibold text-right ${selectedTicket.status === "Processing" ? "text-[#F5AA1E]" : selectedTicket.status === "Closed" ? "text-[#3DB838]" : "text-[#00687F]"}`}>
                        {selectedTicket.status === "Processing" ? "Đang xử lý" :
                        selectedTicket.status === "Closed" ? "Đã đóng" : selectedTicket.status}
                      </p>
                    </div>
                  </div>

                  {/* Trao đổi (Khung chat) */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600 mb-4">Trao đổi</h2>
                    <div className="mt-4 space-y-4 max-h-48 overflow-y-auto px-2">
                      {messages.map((m, idx) => (
                        <div key={idx} className={`flex items-center gap-3 ${m.isSelf ? "justify-end" : "justify-start"}`}>
                          {/* Avatar người gửi */}
                          {!m.isSelf && (
                            <img
                              src={m.senderAvatar || "/logo.png"} // Avatar của sender
                              alt="Avatar"
                              className="w-11 h-11 rounded-full border shadow-md object-cover"
                            />
                          )}
                          {/* Nội dung tin nhắn */}
                            <div className="flex flex-col max-w-[70%]">
                                <div>
                                  <div
                                    className={`px-3 py-2 rounded-lg text-sm ${
                                      m.isSelf ? "bg-blue-500 text-white text-right" : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {m.text}
                                  </div>
                              
                                  <div className="text-[11px] text-gray-400 mt-1">
                                    {m.time}
                                  </div>
                                </div>
                            </div>
                          {/* Avatar người nhận (currentUser) */}
                          {m.isSelf && (
                            <img
                              src={currentUser?.avatarUrl || "/logo.png"} // Avatar của user hiện tại
                              alt="Avatar"
                              className="w-11 h-11 rounded-full border shadow-md object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                      <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        ➤
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bên phải */}
                <div className="space-y-6">
                  {/* Nội dung yêu cầu */}
                  <div className="max-h-[420px] bg-[#F8F8F8] p-6 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold text-[#002147] mb-4 bg-gray-200 px-4 py-2 rounded-lg text-center">
                      Nội dung yêu cầu
                    </h2>
                    <div className="mt-4">
                      <p className="font-semibold text-[#002147]">Tiêu đề</p>
                      <p className="text-gray-500">{selectedTicket.title || "Chưa có tiêu đề"}</p>
                    </div>
                    <div className="mt-8">
                      <p className="font-semibold text-[#002147]">Chi tiết</p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {selectedTicket.description || "Không có mô tả chi tiết."}
                      </p>
                    </div>
                  </div>
                  {/* Đánh giá */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600 mb-4">Đánh giá</h2>
                    <div className="flex items-center mt-4">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`cursor-pointer text-2xl ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                          onClick={() => setRating(i + 1)}
                        />
                      ))}
                    </div>
                    {/* Không bắt buộc comment nếu chưa từng đánh giá */}
                    {/* Bắt buộc comment nếu đã từng đánh giá => hiển thị "Yêu cầu nhận xét" */}
                    {selectedTicket.feedback?.rating ? (
                      <textarea
                        placeholder="Hãy viết nhận xét của bạn..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full mt-4 p-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      // Trường hợp lần đầu rating có thể để ẩn (nếu không bắt buộc comment), 
                      // hoặc hiển thị kèm chú thích "Không bắt buộc" tùy ý
                      <textarea
                        placeholder="Không bắt buộc. Bạn có thể để trống."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full mt-4 p-2 border border-gray-300 rounded-lg"
                      />
                    )}

                    <button
                      onClick={handleFeedback}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      {selectedTicket.feedback?.rating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ticket;