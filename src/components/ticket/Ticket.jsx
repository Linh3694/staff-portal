import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { FiMonitor, FiSettings, FiCalendar, FiSearch, FiFilter } from "react-icons/fi";
import { API_URL } from "../../config";
import { FaRegCircle, FaRegCircleDot } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";




const Ticket = () => {
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
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("authToken");
  const [userTickets, setUserTickets] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const submitTicket = async () => {
    try {
      const formData = new FormData();
      formData.append("title", ticketData.title);
      formData.append("description", ticketData.description);
      formData.append("priority", ticketData.priority);
      formData.append("notes", ticketData.notes);
      ticketData.images.forEach((file) => formData.append("attachments", file));
  
      const res = await axios.post(`${API_URL}/tickets`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
  
      console.log("API Response:", res.data); // Debug log để kiểm tra phản hồi từ API
  
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
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "search") {
      fetchUserTickets();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUserTickets();
  }, [searchTerm, filterStatus]);

  const fetchUserTickets = async () => {
    if (!currentUser?._id) return;
    try {
      let url = `${API_URL}/tickets?creator=${currentUser._id}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserTickets(res.data.tickets || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách ticket:", error);
    }
  };


  return (
    <div className="h-screen py-8 px-4 flex justify-center">
      <div className="w-full flex flex-row gap-6 max-h-[650px]">        
        {/* Bên trái - Danh sách ticket */}
        <div className="w-1/3 px-6 py-4 bg-white rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh sách Ticket</h2>
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
              <div className="w-full flex flex-row justify-between items-center ">
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
                onClick={() => setFilterStatus("Processing")}
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
              </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-4 max-h-[400px] overflow-y-auto">
          {userTickets.length === 0 ? (
              <p className="text-gray-500">Không có ticket nào.</p>
            ) : (
              userTickets.map((ticket) => (
                <div key={ticket._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                  {/* Thông tin ticket */}
                  <div>
                    <h3 className="text-[#002147] font-semibold">{ticket.title || "Chưa có tiêu đề"}</h3>
                    <p className="text-[#757575] text-sm mt-2">{ticket.ticketCode}</p>
                  </div>
                  
                  {/* Trạng thái ticket */}
                  <span className={`px-3 py-1 text-sm rounded-lg font-semibold mt-6 ${
                    ticket.status === "Processing" ? "bg-[#F5AA1E] text-white" :
                    ticket.status === "Waiting for Customer" ? "bg-blue-100 text-blue-800" :
                    ticket.status === "Closed" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-600"
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
        <div 
            className="w-[1100px] max-h-[700px] p-6 bg-white rounded-lg shadow-md relative"
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
      </div>
    </div>
  );
};

export default Ticket;