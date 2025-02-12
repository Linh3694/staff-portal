import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { FiMonitor, FiSettings, FiCalendar, FiSearch, FiFilter } from "react-icons/fi";
import { API_URL } from "../../config";


const Ticket = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);
  const [ticketData, setTicketData] = useState({
    type: "",
    description: "",
    images: [],
    attachments: [],
    priority: "Medium",
  });

  const [ticketCreatedId, setTicketCreatedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("authToken");
  const [userTickets, setUserTickets] = useState([]);

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
    <div className="min-h-screen py-8 px-4 flex justify-center">
      <div className="w-full flex flex-row gap-6 min-h-[700px]">        
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
              <div className="w-full justify-between items-center flex flex-row">
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

          <div className="mt-3 flex flex-col gap-4">
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
        <div className="w-2/3 p-6 bg-white rounded-lg shadow-md">

          <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Ticket Portal</h1>

          <div className="flex space-x-4 justify-center mb-6">
            <button
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "create" ? "bg-[#002147] text-white font-bold" : "bg-gray-200 text-navy-700 font-bold"
              }`}
              onClick={() => setActiveTab("create")}
            >
              Tạo Ticket
            </button>
          </div>

          <hr className="mb-6 border-gray-300" />

          {activeTab === "create" && (
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-800">Chọn loại hỗ trợ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
                <div
                  onClick={() => setTicketData((prev) => ({ ...prev, type: "device" }))}
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105 ${
                    ticketData.type === "device" ? "border-[#009483] bg-[#009483] text-white" : "border-gray-300 hover:border-[#009483] text-gray-600"
                  }`}
                >
                  <FiMonitor className="h-10 w-10 mb-2" />
                  <p className="font-medium">Hỗ trợ về thiết bị</p>
                </div>

                <div
                  onClick={() => setTicketData((prev) => ({ ...prev, type: "software" }))}
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105 ${
                    ticketData.type === "software" ? "border-[#009483] bg-[#009483] text-white" : "border-gray-300 hover:border-[#009483] text-gray-600"
                  }`}
                >
                  <FiSettings className="h-10 w-10 mb-2" />
                  <p className="font-medium">Hỗ trợ cài đặt phần mềm</p>
                </div>

                <div
                  onClick={() => setTicketData((prev) => ({ ...prev, type: "event" }))}
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105 ${
                    ticketData.type === "event" ? "border-[#009483] bg-[#009483] text-white" : "border-gray-300 hover:border-[#009483] text-gray-600"
                  }`}
                >
                  <FiCalendar className="h-10 w-10 mb-2" />
                  <p className="font-medium">Hỗ trợ sự kiện</p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="px-4 py-2 bg-[#FF5733] text-white rounded-md disabled:opacity-50" disabled={!ticketData.type}>
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ticket;