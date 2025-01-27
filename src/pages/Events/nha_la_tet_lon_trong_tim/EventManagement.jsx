import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCheck, FiX } from "react-icons/fi";
// import { FiMessageSquare, FiHeart } from "react-icons/fi"; // nếu cần dùng thêm icon
import { API_URL, BASE_URL } from "../../../config";

const EventManagement = () => {
  const navigate = useNavigate();

  // -------------------------- STATE TAB CHÍNH --------------------------
  const [activeTab, setActiveTab] = useState("events"); 
    // "events" (quản lý sự kiện) hoặc "approval" (phê duyệt ảnh)

  // -------------------------- SỰ KIỆN --------------------------
  const [events, setEvents] = useState([]); // Danh sách sự kiện
  const [isLoading, setIsLoading] = useState(false);

  // Tạo & Chỉnh sửa sự kiện
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    name: "",
    nameEng: "",
    number: "",
    description: "",
    descriptionEng: "",
    image: null,
    startDate: "",
    endDate: "",
  });

  // Sự kiện đang chỉnh sửa
  const [selectedEvent, setSelectedEvent] = useState(null);

  // -------------------------- ẢNH PHÊ DUYỆT --------------------------
  // Chia riêng 3 mảng ảnh cho 3 trạng thái
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [approvedPhotos, setApprovedPhotos] = useState([]);
  const [deniedPhotos, setDeniedPhotos] = useState([]);

  // Sub-tab của khu vực Phê duyệt ảnh: "pending" | "approved" | "denied"
  const [approvalTab, setApprovalTab] = useState("pending");

  // Ảnh đang được click “Xem nội dung” => mở modal chi tiết
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // -------------------------- API FETCH EVENTS --------------------------
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Không thể tải danh sách sự kiện!");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------- CREATE EVENT --------------------------
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newEvent.name);
      formData.append("nameEng", newEvent.nameEng);
      formData.append("number", newEvent.number);
      formData.append("description", newEvent.description);
      formData.append("descriptionEng", newEvent.descriptionEng);
      if (newEvent.image) formData.append("image", newEvent.image);
      formData.append("startDate", newEvent.startDate);
      formData.append("endDate", newEvent.endDate);

      const response = await axios.post(`${API_URL}/events`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        toast.success("Tạo sự kiện thành công!");
        setShowCreateModal(false);
        setNewEvent({
          name: "",
          nameEng: "",
          number: "",
          description: "",
          descriptionEng: "",
          image: null,
          startDate: "",
          endDate: "",
        });
        fetchEvents();
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Không thể tạo sự kiện!");
    }
  };

  // -------------------------- EDIT EVENT (OPEN MODAL) --------------------------
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  // -------------------------- UPDATE EVENT (PUT) --------------------------
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const formData = new FormData();
      formData.append("name", selectedEvent.name);
      formData.append("nameEng", selectedEvent.nameEng);
      formData.append("number", selectedEvent.number);
      formData.append("description", selectedEvent.description);
      formData.append("descriptionEng", selectedEvent.descriptionEng);
      if (selectedEvent.image instanceof File) {
        // Chỉ append file mới nếu có chọn lại
        formData.append("image", selectedEvent.image);
      }
      formData.append("startDate", selectedEvent.startDate);
      formData.append("endDate", selectedEvent.endDate);

      const response = await axios.put(
        `${API_URL}/events/${selectedEvent._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        toast.success("Cập nhật sự kiện thành công!");
        setShowEditModal(false);
        fetchEvents(); // reload list
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Không thể cập nhật sự kiện!");
    }
  };

  // -------------------------- DELETE EVENT --------------------------
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sự kiện này?")) return;

    try {
      await axios.delete(`${API_URL}/events/${eventId}`);
      toast.success("Xóa sự kiện thành công!");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Không thể xóa sự kiện!");
    }
  };

  // -------------------------- PHÊ DUYỆT ẢNH (FETCH 3 TRẠNG THÁI) --------------------------
  const fetchPhotosForApproval = async () => {
    try {
      // Giả định bạn có 3 endpoint riêng:
      const resPending = await axios.get(`${API_URL}/photos/pending`);
      const resApproved = await axios.get(`${API_URL}/photos/approved`);
      const resDenied = await axios.get(`${API_URL}/photos/denied`);

      setPendingPhotos(resPending.data);
      setApprovedPhotos(resApproved.data);
      setDeniedPhotos(resDenied.data);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Không thể tải danh sách ảnh!");
    }
  };

  // Khi người dùng chuyển sang tab "approval", ta fetch danh sách ảnh
  useEffect(() => {
    if (activeTab === "approval") {
      fetchPhotosForApproval();
    }
  }, [activeTab]);

  // -------------------------- APPROVE / REJECT HANDLERS --------------------------
  const handleApprovePhoto = async (photoId) => {
    try {
      const response = await axios.put(`${API_URL}/photos/${photoId}/approve`);
      if (response.status === 200) {
        toast.success("Ảnh đã được phê duyệt!");
        const approvedPhoto = response.data.photo;

        // Xoá khỏi pending
        setPendingPhotos((prev) => prev.filter((p) => p._id !== photoId));
        // Xoá khỏi denied
        setDeniedPhotos((prev) => prev.filter((p) => p._id !== photoId));
        // Thêm vào approved
        setApprovedPhotos((prev) => [...prev, approvedPhoto]);

        // Nếu đang xem chi tiết, đóng modal
        if (selectedPhoto && selectedPhoto._id === photoId) {
          setSelectedPhoto(null);
        }
      }
    } catch (error) {
      console.error("Error approving photo:", error);
      toast.error("Không thể duyệt ảnh!");
    }
  };

  const handleRejectPhoto = async (photoId) => {
    try {
      const response = await axios.put(`${API_URL}/photos/${photoId}/reject`);
      if (response.status === 200) {
        toast.success("Ảnh đã bị từ chối!");
        const deniedPhoto = response.data.photo;
  
        // Xóa ảnh khỏi pending
        setPendingPhotos((prev) => prev.filter((p) => p._id !== photoId));
        // Xóa ảnh khỏi approved (nếu có)
        setApprovedPhotos((prev) => prev.filter((p) => p._id !== photoId));
        // Thêm vào danh sách ảnh đã bị từ chối
        setDeniedPhotos((prev) => [...prev, deniedPhoto]);
  
        // Nếu đang xem chi tiết, đóng modal
        if (selectedPhoto && selectedPhoto._id === photoId) {
          setSelectedPhoto(null);
        }
      }
    } catch (error) {
      console.error("Error rejecting photo:", error);
      toast.error("Không thể từ chối ảnh!");
    }
  };

  // -------------------------- EFFECT LẦN ĐẦU (FETCH EVENTS) --------------------------
  useEffect(() => {
    fetchEvents();
  }, []);

  // -------------------------- RENDER JSX --------------------------
  return (
    <div className="min-h-screen">
      {/* -------------------------- HEADER -------------------------- */}
      <header className="bg-[#fcf5e3] flex items-center justify-between w-full h-[80px] lg:px-6 xs:px-2">
        <div className="w-[1390px] mx-auto flex flex-row items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center lg:space-x-2 xs:space-x-0">
            <img
              src="/tet2025/image/wellsping-logo.png"
              alt="Logo 1"
              className="lg:h-20 lg:w-36 xs:w-32 xs:h-16"
            />
            <img
              src="/tet2025/image/happyjourney.png"
              alt="Logo 2"
              className="lg:h-28 w-auto xs:h-12 xs:hidden lg:block"
            />
          </div>
          {/* Điều hướng trở lại /event */}
          <button
            onClick={() => navigate("/event_tet2025")}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
          >
            Quay lại
          </button>
        </div>
      </header>

      {/* -------------------------- SECTION BACKGROUND -------------------------- */}
      <section
        style={{
          backgroundImage: `url('/tet2025/image/background-primary.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "100%",
          height: "100%",
          minHeight: "100vh",
          maxWidth: "1920px",
          margin: "0 auto",
          padding: "40px 0",
        }}
      >
        {/* -------------------------- NAV (TAB) -------------------------- */}
        <nav className="top-4 z-40 flex items-center justify-center rounded-full p-2">
          <div className="flex items-center gap-1 h-[61px] p-4">
            <button
              className={`flex font-bold items-center gap-2 px-4 py-2 rounded-full transform transition-colors transition-transform duration-300 hover:scale-105 ${
                activeTab === "events"
                  ? "bg-[#FCF5E3] text-[#DC0909]"
                  : "bg-transparent text-[#FCF5E3] hover:bg-[#FCF5E3] hover:text-[#DC0909]"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Sự kiện
            </button>
            <button
              className={`flex font-bold items-center gap-2 px-4 py-2 rounded-full transform transition-colors transition-transform duration-300 hover:scale-105 ${
                activeTab === "approval"
                  ? "bg-[#FCF5E3] text-[#DC0909]"
                  : "bg-transparent text-[#FCF5E3] hover:bg-[#FCF5E3] hover:text-[#DC0909]"
              }`}
              onClick={() => setActiveTab("approval")}
            >
              Phê duyệt ảnh
            </button>
          </div>
        </nav>

        {/* -------------------------- TAB SỰ KIỆN -------------------------- */}
        {activeTab === "events" && (
          <div className="w-[1596px] mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#FCF5E3]">Quản lý sự kiện</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
              >
                Thêm sự kiện mới
              </button>
            </div>

            {/* Table */}
            <div className="mt-1 bg-[#FCF5E3] p-4 rounded-2xl shadow-lg overflow-x-scroll xl:overflow-x-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#333333]">
                      SỐ THỨ TỰ
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#333333]">
                      TÊN SỰ KIỆN
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#333333]">
                      NGÀY BẮT ĐẦU
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#333333]">
                      NGÀY KẾT THÚC
                    </th>
                    <th className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#333333]">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : events.length > 0 ? (
                    events.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-100 transition">
                        <td className="border-b-[1px] border-gray-200 py-4 px-4">
                          <p className="text-md font-bold text-gray-700">{event.number}</p>
                        </td>
                        <td className="border-b-[1px] border-gray-200 py-4 px-4 text-md font-bold text-[#DC0909]">
                          <p className="text-sm font-bold">{event.name}</p>
                        </td>
                        <td className="border-b-[1px] border-gray-200 py-4 px-4 text-sm text-gray-700">
                          {new Date(event.startDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="border-b-[1px] border-gray-200 py-4 px-4 text-sm text-gray-700">
                          {new Date(event.endDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="border-b-[1px] border-gray-200 py-4 px-4">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className=" px-3 py-1 bg-[#002147] text-white text-sm font-bold rounded-lg hover:bg-[#0c1a2a] transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="ml-2 px-3 py-1 bg-[#DC0909] text-white text-sm font-bold rounded-lg hover:bg-[#b31c1c] transition"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Không có sự kiện nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal tạo sự kiện */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div
                  className="bg-white rounded-lg shadow-lg p-6 w-[40%]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-700">Thêm sự kiện mới</h3>
                  <form onSubmit={handleCreateEvent}>
                    {/* Tên sự kiện */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Tên sự kiện
                      </label>
                      <input
                        type="text"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Tên Eng */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Tên sự kiện - Eng
                      </label>
                      <input
                        type="text"
                        value={newEvent.nameEng}
                        onChange={(e) => setNewEvent({ ...newEvent, nameEng: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Số thứ tự */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Số thứ tự
                      </label>
                      <input
                        type="number"
                        value={newEvent.number}
                        onChange={(e) => setNewEvent({ ...newEvent, number: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Mô tả */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Mô tả Eng */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả - Eng
                      </label>
                      <textarea
                        value={newEvent.descriptionEng}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, descriptionEng: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Ảnh đại diện */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ảnh đại diện
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewEvent({ ...newEvent, image: e.target.files[0] })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Ngày bắt đầu */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={newEvent.endDate}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg mr-2"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal sửa sự kiện */}
            {showEditModal && selectedEvent && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-[40%]">
                  <h3 className="text-xl font-bold mb-4 text-gray-700">Chỉnh sửa sự kiện</h3>
                  <form onSubmit={handleUpdateEvent}>
                    {/* Tên sự kiện */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Tên sự kiện
                      </label>
                      <input
                        type="text"
                        value={selectedEvent.name}
                        onChange={(e) =>
                          setSelectedEvent({ ...selectedEvent, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Tên Eng */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Tên sự kiện - Eng
                      </label>
                      <input
                        type="text"
                        value={selectedEvent.nameEng}
                        onChange={(e) =>
                          setSelectedEvent({ ...selectedEvent, nameEng: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Số thứ tự */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Số thứ tự
                      </label>
                      <input
                        type="number"
                        value={selectedEvent.number}
                        onChange={(e) =>
                          setSelectedEvent({ ...selectedEvent, number: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Mô tả */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        value={selectedEvent.description}
                        onChange={(e) =>
                          setSelectedEvent({ ...selectedEvent, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Mô tả Eng */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả - Eng
                      </label>
                      <textarea
                        value={selectedEvent.descriptionEng}
                        onChange={(e) =>
                          setSelectedEvent({
                            ...selectedEvent,
                            descriptionEng: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Ảnh đại diện */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ảnh đại diện
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedEvent({ ...selectedEvent, image: e.target.files[0] })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Ngày bắt đầu */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={selectedEvent.startDate?.split("T")[0] || ""}
                        onChange={(e) =>
                          setSelectedEvent({
                            ...selectedEvent,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={selectedEvent.endDate?.split("T")[0] || ""}
                        onChange={(e) =>
                          setSelectedEvent({
                            ...selectedEvent,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg mr-2"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------- TAB PHÊ DUYỆT ẢNH -------------------------- */}
        {activeTab === "approval" && (
          <div className="lg:mx-[100px] xs:mx-auto p-4">
            <h2 className="xs:hidden lg:block text-2xl font-bold text-[#FCF5E3] mb-4">Phê duyệt ảnh</h2>
            {/* Chọn sub-tab */}
            <div className="lg:text-left xs:text-center pt-6 pb-4">
              <div className="flex xs:mx-[15px] lg:mx-0  lg:space-x-6 xs:space-x-4 lg:text-lg xs:text-sm font-medium">
                <button
                  onClick={() => setApprovalTab("pending")}
                  className={`lg:px-6 py-2 xs:px-2 rounded-full transition ${
                    approvalTab === "pending"
                      ? "bg-[#FCF5E3] text-[#B42B23] font-bold"
                      : "text-[#FCF5E3] hover:text-[#FCF5E3]/80"
                  }`}
                >
                  Chờ phê duyệt
                </button>

                <button
                  onClick={() => setApprovalTab("approved")}
                  className={`lg:px-6 py-2 xs:px-2 rounded-full transition ${
                    approvalTab === "approved"
                      ? "bg-[#FCF5E3] text-[#B42B23] font-bold"
                      : "text-[#FCF5E3] hover:text-[#FCF5E3]/80"
                  }`}
                >
                  Đã phê duyệt
                </button>

                <button
                  onClick={() => setApprovalTab("denied")}
                  className={`lg:px-6 py-2 xs:px-2 rounded-full transition ${
                    approvalTab === "denied"
                      ? "bg-[#FCF5E3] text-[#B42B23] font-bold"
                      : "text-[#FCF5E3] hover:text-[#FCF5E3]/80"
                  }`}
                >
                  Đã từ chối
                </button>
              </div>
            </div>

            {/* Nội dung sub-tab */}
            <div className="mt-4 p-4">
              {approvalTab === "pending" && (
                <PhotoList
                  photos={pendingPhotos}
                  mode="pending"
                  onApprove={handleApprovePhoto}
                  onReject={handleRejectPhoto}
                  setSelectedPhoto={setSelectedPhoto}
                />
              )}
              {approvalTab === "approved" && (
                <PhotoList
                  photos={approvedPhotos}
                  mode="approved"
                  onReject={handleRejectPhoto}
                  setSelectedPhoto={setSelectedPhoto}
                />
              )}
              {approvalTab === "denied" && (
                <PhotoList
                  photos={deniedPhotos}
                  mode="denied"
                  onApprove={handleApprovePhoto}
                  setSelectedPhoto={setSelectedPhoto}
                />
              )}
            </div>

            {/* Modal xem chi tiết photo (nếu cần) */}
            {selectedPhoto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg xs:w-[90vw] lg:w-[1400px] lg:h-[85vh] xs:h-[85vh] lg:p-6 xs:p-0 relative flex flex-col lg:flex-row">
                  {/* Nút đóng */}
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="absolute top-4 right-4 text-sm font-bold px-3 py-1 mb-2 bg-[#B42B23]  text-[#FFECD7] rounded-xl hover:text-white"
                  >
                    Đóng
                  </button>

                  {/* Nội dung ảnh */}
                  <div className="flex w-full h-full flex-col lg:flex-row">
                    {/* Cột hiển thị ảnh (Desktop) */}
                    <div
                      className="xs:hidden lg:flex w-2/3 h-full items-center justify-center rounded-2xl"
                      style={{
                        backgroundImage: `url('/tet2025/image/background-primary.png')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      <img
                        src={`${BASE_URL}${selectedPhoto.url}`}
                        alt={selectedPhoto.title}
                        className="h-full w-full object-contain border-4 border-[#FFECD7] rounded-2xl"
                      />
                    </div>

                    {/* Thông tin ảnh + hiển thị ảnh (Mobile) */}
                    <div className="xs:w-full lg:w-1/3 xs:h-full lg:h-full lg:pl-2 xs:pl-0 flex flex-col rounded-lg overflow-y-auto">
                      <div className="flex flex-col items-left lg:pl-2 lg:mt-8 xs:mt-4 lg:ml-0 xs:ml-4 lg:mr-0 xs:mr-4">
                        <span className="lg:text-2xl xs:text-lg text-[#B42B23] font-bold mb-2">
                          {selectedPhoto.title}
                        </span>
                        <div className="flex flex-row justify-between">
                          <p className="font-bold lg:text-md xs:text-sm italic mb-3 text-[#401011]">
                            {selectedPhoto.uploaderName || "Anonymous"}
                          </p>
                          {/* eventId nếu muốn hiển thị */}
                          {/* <p className="lg:text-md xs:text-sm mb-3 text-[#002147]">
                            {selectedPhoto.eventId}
                          </p> */}
                        </div>
                        <p className="text-gray-700 mb-1 overflow-hidden text-ellipsis whitespace-normal line-clamp-7 lg:text-base xs:text-sm">
                          {selectedPhoto.message}
                        </p>
                      </div>

                      {/* Ảnh (Mobile) */}
                      <div
                        className="lg:hidden xs:flex ml-4 mr-4 mb-4 items-center justify-center rounded-2xl"
                        style={{
                          backgroundImage: `url('/tet2025/image/background-primary.png')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <img
                          src={`${BASE_URL}${selectedPhoto.url}`}
                          alt={selectedPhoto.title}
                          className="h-full w-full object-contain border-4 border-[#FFECD7] rounded-2xl"
                        />
                      </div>

                      {/* Các nút hành động tùy theo trạng thái */}
                      <div className="w-full flex justify-between mt-auto gap-2 p-4 bg-[#FCF5E3] rounded-br-lg">
                        {/* Nếu ảnh đang ở pending => 2 nút
                            Nếu ảnh đang ở approved => chỉ nút từ chối
                            Nếu ảnh đang ở denied => chỉ nút phê duyệt
                            => ta có thể kiểm tra selectedPhoto.approved/denied rồi hiển thị
                            hoặc gộp chung logic => handleApprovePhoto / handleRejectPhoto
                          */}
                        {!selectedPhoto.approved && !selectedPhoto.denied && (
                          <>
                            <button
                              onClick={() => handleApprovePhoto(selectedPhoto._id)}
                              className="w-1/2 h-9 bg-[#DC582A] text-white text-sm font-bold rounded-lg hover:bg-[#C14C22] transition"
                            >
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => handleRejectPhoto(selectedPhoto._id)}
                              className="w-1/2 h-9 bg-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-400 transition"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {selectedPhoto.approved && !selectedPhoto.denied && (
                          <>
                            {/* Ảnh đã phê duyệt => Chỉ nút Từ chối */}
                            <button
                              onClick={() => handleRejectPhoto(selectedPhoto._id)}
                              className="w-full h-9 bg-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-400 transition"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {selectedPhoto.denied && (
                          <>
                            {/* Ảnh đã từ chối => Chỉ nút Phê duyệt */}
                            <button
                              onClick={() => handleApprovePhoto(selectedPhoto._id)}
                              className="w-full h-9 bg-[#DC582A] text-white text-sm font-bold rounded-lg hover:bg-[#C14C22] transition"
                            >
                              Phê duyệt
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

// -------------------------- COMPONENT PHOTO LIST --------------------------
/**
 * PhotoList sẽ hiển thị grid các ảnh + nút hành động (tùy theo mode)
 * mode = "pending" | "approved" | "denied"
 * onApprove, onReject (có thể null nếu không cần dùng)
 */
const PhotoList = ({ photos, mode, onApprove, onReject, setSelectedPhoto }) => {
  return (
    <div>
      {photos && photos.length > 0 ? (
        <div className="grid xs:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 xs:mx-auto">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="lg:w-[300px] lg:h-[360px] xs:w-full bg-white rounded-lg overflow-hidden shadow-lg flex flex-col items-center justify-between p-3 transition-transform transform hover:scale-105"
            >
              {/* Ảnh */}
              <div className="w-[286px] h-[188px] overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={`${BASE_URL}${photo.url}`}
                  alt={photo.message}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thông tin ảnh */}
              <div className="text-left mt-2 w-full">
                <h3 className="text-md font-bold text-[#E55526]">
                  {photo.title || "Không có tiêu đề"}
                </h3>
                <p className="text-sm text-gray-700">
                  {photo.uploaderName || "Ẩn danh"}
                </p>
              </div>

              {/* Nút hành động tùy theo mode */}
              <div className="flex justify-start gap-2 mt-3 w-full">
                {mode === "pending" && (
                  <>
                    <button
                      onClick={() => onApprove(photo._id)}
                      className="w-[50px] h-[50px] bg-[#DC582A] text-white rounded-full flex items-center justify-center hover:bg-[#C14C22] transition"
                    >
                      <FiCheck size="32" />
                    </button>
                    <button
                      onClick={() => onReject(photo._id)}
                      className="w-[50px] h-[50px] bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-400 transition"
                    >
                      <FiX size="32" />
                    </button>
                  </>
                )}

                {mode === "approved" && (
                  <>
                    {/* Ảnh đã phê duyệt => chỉ nút Từ chối */}
                    <button
                      onClick={() => onReject(photo._id)}
                      className="w-[50px] h-[50px] bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-400 transition"
                    >
                      <FiX size="32" />
                    </button>
                  </>
                )}

                {mode === "denied" && (
                  <>
                    {/* Ảnh đã từ chối => chỉ nút Phê duyệt */}
                    <button
                      onClick={() => onApprove(photo._id)}
                      className="w-[50px] h-[50px] bg-[#DC582A] text-white rounded-full flex items-center justify-center hover:bg-[#C14C22] transition"
                    >
                      <FiCheck size="32" />
                    </button>
                  </>
                )}
              </div>

              {/* Nút Xem nội dung */}
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="mt-3 w-full py-2 bg-gray-100 text-gray-800 rounded-lg font-bold hover:bg-gray-200 transition"
              >
                Xem nội dung
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-white ">Không có ảnh nào.</p>
      )}
    </div>
  );
};

export default EventManagement;