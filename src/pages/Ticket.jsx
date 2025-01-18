import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css"; // Đảm bảo import Tailwind
import { FiMonitor, FiSettings, FiCalendar } from "react-icons/fi";
import { API_URL, UPLOAD_URL } from "../config"; 


const Ticket = () => {
  // -------------------- State chung --------------------
  const [activeTab, setActiveTab] = useState("create"); // "create" | "search"
  const [step, setStep] = useState(1);

  // Data tạo ticket
  const [ticketData, setTicketData] = useState({
    type: "",
    description: "",
    images: [],
    attachments: [],
    priority: "Medium",
    eventName: "",
    eventLocation: "", // Địa điểm tổ chức mới thêm
    eventSupportType: "",
    staffCount: "",
    deviceName: "",
    deviceCount: "",
    eventTime: "", // dd/mm/yyyy
    eventNote: "",
  });

  const [ticketCreatedId, setTicketCreatedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("authToken");

  // Danh sách ticket (tab Tra cứu)
  const [userTickets, setUserTickets] = useState([]);

  // -------------------- useEffect --------------------
  useEffect(() => {
    // Lấy currentUser từ localStorage
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "search") {
      fetchUserTickets();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Lấy danh sách ticket
  const fetchUserTickets = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await axios.get(
        `${API_URL}/tickets?creator=${currentUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserTickets(res.data.tickets || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách ticket:", error);
    }
  };

  // -------------------- Wizard Handler --------------------
  const goNext = () => {
    const maxStep = ticketData.type === "event" ? 7 : 6;
    setStep((prev) => Math.min(maxStep, prev + 1));
  };
  const goBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    try {
      // Khởi tạo FormData
      const formData = new FormData();
      console.log("Priority trước khi gửi:", ticketData.priority);
      // Thêm các trường thông tin
      formData.append("title", ticketData.type === "event" ? `Sự kiện: ${ticketData.eventName}` : `Hỗ trợ ${ticketData.type}`);
      formData.append("description", ticketData.description);
      formData.append("priority", ticketData.priority);
      formData.append("creator", currentUser?._id);

      console.log("Priority:", ticketData.priority);

      // Thêm attachments (nếu có)
      ticketData.images.forEach((file) => {
        formData.append("attachments", file); // Key "attachments" trùng với backend
      });

      // Gửi dữ liệu
      const res = await axios.post("${API_URL}/tickets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Định dạng multipart
        },
      });
      console.log(res.data)

      if (res.data.ticket) {
        setTicketCreatedId(res.data.ticket.ticketCode); // Cập nhật mã ticket
        setStep(4); // Chuyển sang bước "Done"
      } else {
        alert("Lỗi khi tạo ticket, vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo ticket:", err);
      alert("Có lỗi khi tạo ticket, vui lòng thử lại.");
    }
  };
  // -------------------- Step Render Functions --------------------
  // Step 1: Chọn loại hỗ trợ (dùng card thay cho select)
const renderStep1 = () => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-xl font-semibold text-[#002147]"> Chọn ticket bạn muốn tạo:</h2>

    {/* Thay thế <select> bằng 3 card */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
      {/* Card cho "device" */}
      <div
        onClick={() => setTicketData((prev) => ({ ...prev, type: "device" }))}
        className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105
          ${
            ticketData.type === "device"
              ? "border-[#009483] bg-[#009483] text-white"
              : "border-gray-300 hover:border-[#009483] text-gray-600"
          }
        `}
      >
        {/* Icon giả định  */}
        <FiMonitor className="h-10 w-10 mb-2" />
        <p className="font-medium">Hỗ trợ về thiết bị</p>
      </div>

      {/* Card cho "software" */}
      <div
        onClick={() => setTicketData((prev) => ({ ...prev, type: "software" }))}
        className={`border font-semibold rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105
          ${
            ticketData.type === "software"
              ? "border-[#009483] bg-[#009483] text-white"
              : "border-gray-300 hover:border-[#009483] text-gray-600 "
          }
        `}
      >
        {/* Icon giả định */}
        <FiSettings className="h-10 w-10 mb-2" />
        <p className="font-medium">Hỗ trợ cài đặt phần mềm</p>
      </div>

      {/* Card cho "event" */}
      <div
        onClick={() => setTicketData((prev) => ({ ...prev, type: "event" }))}
        className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transform transition-transform duration-300 hover:scale-105
          ${
            ticketData.type === "event"
              ? "border-[#009483] bg-[#009483] text-white"
              : "border-gray-300 hover:border-[#009483] text-gray-600 "
          }
        `}
      >
        {/* Icon giả định */}
        <FiCalendar className="h-10 w-10  mb-2" />
        <p className="font-medium">Hỗ trợ sự kiện</p>
      </div>
    </div>

    <div className="flex justify-end mt-4">
      <button
        className="px-4 py-2 bg-[#FF5733] text-white rounded-md disabled:opacity-50"
        disabled={!ticketData.type}
        onClick={() => {
          if (ticketData.type === "event") {
            setStep(2); 
          } else if (ticketData.type === "device" || ticketData.type === "software") {
            setStep(2); 
          }
        }}
      >
        Next
      </button>
    </div>
  </div>
);

const renderStep2DeviceSoftware = () => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-xl font-semibold text-gray-800">Nhập mô tả chi tiết</h2>

    <label className="font-medium">Tiêu đề:</label>
    <input
      type="text"
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.title}
      onChange={(e) => setTicketData((prev) => ({ ...prev, title: e.target.value }))}
    />

    <label className="font-medium">Chi tiết:</label>
    <textarea
      rows={3}
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.description}
      onChange={(e) => setTicketData((prev) => ({ ...prev, description: e.target.value }))}
    />

    <label className="font-medium">Mức ưu tiên:</label>
    <select
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.priority}
      onChange={(e) => setTicketData((prev) => ({ ...prev, priority: e.target.value }))}
    >
      <option value="Low">Thấp</option>
      <option value="Medium">Trung Bình</option>
      <option value="High">Cao</option>
      <option value="Urgent">Khẩn cấp</option>
    </select>

    <label className="font-medium">Ảnh minh họa:</label>
    <input
      type="file"
      accept=".png, .jpg"
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          setTicketData((prev) => ({ ...prev, images: [...prev.images, file] }));
        }
      }}
    />
    <div className="mt-2">
  {ticketData.images.map((img, i) => (
    <div key={i} className="flex items-center space-x-2">
      <p className="text-sm text-gray-600">{img.name || img}</p>
      <button
        className="text-red-500 text-sm"
        onClick={() => {
          setTicketData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== i),
          }));
        }}
      >
        Xóa
      </button>
    </div>
  ))}
</div>

    <label className="font-medium">Ghi chú (tùy chọn):</label>
    <textarea
      rows={2}
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.notes}
      onChange={(e) => setTicketData((prev) => ({ ...prev, notes: e.target.value }))}
    />

    <div className="flex justify-between mt-4">
      <button
        className="px-4 py-2 bg-gray-300 text-navy-700 rounded-md"
        onClick={() => setStep(1)}
      >
        Back
      </button>
      <button
        className="px-4 py-2 bg-[#FF5733] text-white rounded-md"
        onClick={() => setStep(3)}
      >
        Next
      </button>
    </div>
  </div>
);

const renderStep3Summary = () => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-xl items-center font-semibold text-gray-800">Tổng hợp thông tin</h2>
    {ticketData.type === "event" ? (
      <>
        <p><strong>Tên sự kiện:</strong> {ticketData.eventName}</p>
        <p><strong>Chi tiết:</strong> {ticketData.description}</p>
        <p><strong>Địa điểm:</strong> {ticketData.eventLocation}</p>
        <p><strong>Yêu cầu về nhân sự:</strong> {ticketData.staffCount}</p>
        <p><strong>Yêu cầu về thiết bị:</strong> {ticketData.devices || "Không"}</p>
        <p><strong>Ngày diễn ra:</strong> {ticketData.eventDate}</p>
        <p><strong>Ghi chú:</strong> {ticketData.notes || "Không"}</p>
      </>
    ) : (
      <>
        <p><strong>Tiêu đề:</strong> {ticketData.title}</p>
        <p><strong>Chi tiết:</strong> {ticketData.description}</p>
        <p><strong>Ghi chú:</strong> {ticketData.notes || "Không"}</p>
        <p><strong>Ảnh minh họa:</strong></p>
        <div>
          {ticketData.images.map((img, i) => (
            <p key={i} className="text-sm text-gray-600">
              - {img.name || img}
            </p>
          ))}
        </div>
      </>
    )}

    <div className="flex justify-between mt-4">
      <button
        className="px-4 py-2 bg-gray-300 text-navy-700 rounded-md"
        onClick={() => setStep(2)}
      >
        Back
      </button>
      <button
        className="px-4 py-2 bg-[#009483] text-white rounded-md"
        onClick={handleSubmit}
      >
        Xác nhận và tạo ticket
      </button>
    </div>
  </div>
);

const renderStep4Done = () => (
  <div className="flex flex-col items-center space-y-4">
    <h2 className="text-xl font-semibold text-gray-800">
      Ticket đã được tạo thành công!
    </h2>
    <p className="text-lg text-gray-600">
      Mã Ticket của bạn: <span className="font-bold text-[#002147]">{ticketCreatedId}</span>
    </p>
    <button
      className="px-4 py-2 bg-indigo-600 text-white rounded-md"
      onClick={() => {
        // Reset form
        setTicketData({
          type: "",
          title: "",
          description: "",
          images: [],
          notes: "",
        });
        setTicketCreatedId(null);
        setStep(1);
      }}
    >
      Tạo ticket khác
    </button>
  </div>
);

const renderStep2EventDetail = () => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-xl font-semibold text-gray-800">Mô tả chi tiết sự kiện</h2>

    <label className="font-medium">Tên sự kiện:</label>
    <input
      type="text"
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.eventName}
      onChange={(e) => setTicketData((prev) => ({ ...prev, eventName: e.target.value }))}
    />

    <label className="font-medium">Chi tiết:</label>
    <textarea
      rows={3}
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.description}
      onChange={(e) => setTicketData((prev) => ({ ...prev, description: e.target.value }))}
    />

    <label className="font-medium">Yêu cầu về nhân sự:</label>
    <input
      type="number"
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder="Số lượng nhân sự cần cho sự kiện"
      value={ticketData.staffCount}
      onChange={(e) => setTicketData((prev) => ({ ...prev, staffCount: e.target.value }))}
    />

    <label className="font-medium">Yêu cầu về thiết bị:</label>
    <textarea
      rows={2}
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder="Tên thiết bị và số lượng, mỗi thiết bị trên 1 dòng"
      value={ticketData.devices}
      onChange={(e) => setTicketData((prev) => ({ ...prev, devices: e.target.value }))}
    />

    <label className="font-medium">Ngày diễn ra sự kiện:</label>
    <input
      type="date"
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.eventDate}
      onChange={(e) => setTicketData((prev) => ({ ...prev, eventDate: e.target.value }))}
    />

    <label className="font-medium">Ghi chú (tùy chọn):</label>
    <textarea
      rows={2}
      className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={ticketData.notes}
      onChange={(e) => setTicketData((prev) => ({ ...prev, notes: e.target.value }))}
    />

    <div className="flex justify-between mt-4">
      <button
        className="px-4 py-2 bg-gray-300 text-navy-700 rounded-md"
        onClick={() => setStep(1)}
      >
        Back
      </button>
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        onClick={() => setStep(3)}
      >
        Next
      </button>
    </div>
  </div>
);


  // -------------------- Wizard Container (Tab 1) --------------------
  const renderWizardSteps = () => {
    // Xác định số bước dựa trên loại ticket
    const stepsArray =
      ticketData.type === "event" ? [1, 2, 3, 4] : [1, 2, 3, 4];
  
    return (
      <div className="w-full mx-auto">
        {/* Thanh progress */}
        <div className="flex w-50% items-center justify-center mb-6 px-4" style={{ width: "50%", margin: "0 auto" }}>
          {stepsArray.map((s, i) => (
            <React.Fragment key={s}>
              {/* Vòng tròn (step) */}
              <div
                className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all
                  ${step >= i + 1 ? "bg-[#FFC107] text-white" : "bg-gray-200 text-gray-500"}
                `}
              >
                {s}
              </div>
  
              {/* Đường line ngang giữa các bước */}
              {i < stepsArray.length - 1 && (
                <div
                  className={`flex-1 h-1 ${
                    step > i + 1 ? "bg-[#FFC107]" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
  
        {/* Nội dung từng bước */}
        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 &&
            (ticketData.type === "event"
              ? renderStep2EventDetail()
              : renderStep2DeviceSoftware())}
          {step === 3 && renderStep3Summary()}
          {step === 4 && renderStep4Done()}
        </div>
      </div>
    );
  };

  // -------------------- Tab 2: Tra cứu Ticket --------------------
  const renderSearchTab = () => (
    <div className="w-full mx-auto items-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Danh sách ticket của bạn
      </h2>
      {userTickets.length === 0 ? (
        <p className="text-gray-500">Bạn chưa có ticket nào.</p>
      ) : (
        <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
          <table className="w-full ">
            <thead>
              <tr className="!border-px !border-gray-400">
              <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 text-center">
                <p className="text-sm font-bold text-gray-500">MÃ TICKET</p>
              </th>
              <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 text-center">
                <p className="text-sm font-bold text-gray-500">TIÊU ĐỀ</p>
              </th>
              <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 text-center">
                <p className="text-sm font-bold text-gray-500">TRẠNG THÁI</p>
              </th>
              <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 text-center">
                <p className="text-sm font-bold text-gray-500">NGƯỜI XỬ LÝ</p>
              </th>
              <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 text-center">
                <p className="text-sm font-bold text-gray-500">ƯU TIÊN</p>
              </th>
              </tr>
            </thead>
            <tbody className="bg-white text-center">
              {userTickets.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-gray-100 transition-all duration-150"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-navy-700">
                    {t.ticketCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-700 font-semibold">{t.title}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-navy-700">
                    {t.status === "Open" || t.status === "Assigned"
                      ? "Chờ tiếp nhận"
                      : t.status === "Processing"
                      ? "Đang xử lý"
                      : t.status}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-700 font-semibold">
                    {t.status === "Open" || t.status === "Assigned"
                      ? "Chờ tiếp nhận"
                      : t.status === "Processing" && t.assignedTo
                      ? t.assignedTo.fullname
                      : "Không xác định"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-navy-700">
                    {t.priority}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // -------------------- Render UI chính --------------------
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        backgroundImage: `url("/ticket_theme.png")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-5xl bg-white top-16 border mx-auto p-6 rounded-xl shadow-2xl min-h-[700px] relative">
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">
          Ticket Portal
        </h1>

        <div className="flex space-x-4 justify-center mb-6">
          <button
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === "create"
                ? "bg-[#002147] text-white font-bold"
                : "bg-gray-200 text-navy-700 font-bold"
            }`}
            onClick={() => setActiveTab("create")}
          >
            Tạo Ticket
          </button>
          <button
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === "search"
                ? "bg-[#002147] text-white font-bold"
                : "bg-gray-200 text-navy-700 font-bold"
            }`}
            onClick={() => setActiveTab("search")}
          >
            Tra cứu Ticket
          </button>
        </div>

        <hr className="mb-6 border-gray-300" /> 
          {activeTab === "create" && renderWizardSteps()}
          {activeTab === "search" && renderSearchTab()}
      </div>
    </div>
  );
};

export default Ticket;