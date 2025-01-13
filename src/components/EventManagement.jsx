import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const EventManagement = () => {
  const [events, setEvents] = useState([]); // Danh sách sự kiện
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false); // Hiển thị modal tạo sự kiện\
  const [newEvent,setNewEvent]=useState("");
  const [selectedEvent, setSelectedEvent] = useState(null); // Sự kiện được chọn
  const [photos, setPhotos] = useState([]); // Ảnh của sự kiện
  const [isPhotoLoading, setIsPhotoLoading] = useState(false); // Trạng thái tải ảnh
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Quản lý ảnh được chọn

  // Fetch danh sách sự kiện từ API
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/events");
      setEvents(response.data); // Cập nhật danh sách sự kiện
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Không thể tải danh sách sự kiện!");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhotosByEvent = async (eventId) => {
    try {
      setIsPhotoLoading(true);
      const response = await axios.get(`/api/photos?eventId=${eventId}`);
      setPhotos(response.data);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Không thể tải ảnh của sự kiện!");
    } finally {
      setIsPhotoLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Xử lý khi nhấn nút xóa sự kiện
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sự kiện này?")) return;

    try {
      await axios.delete(`/api/events/${eventId}`);
      toast.success("Xóa sự kiện thành công!");
      fetchEvents(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Không thể xóa sự kiện!");
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    fetchPhotosByEvent(event._id);
  };

  return (
    <div className="w-full h-full px-6 pb-6 sm:overflow-x-auto bg-white rounded-2xl shadow-xl border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-700">Quản lý sự kiện</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
        >
          Thêm sự kiện mới
        </button>
      </div>

      {/* Table */}
      <div className="mt-1 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b-[1px] border-gray-200 py-4 px-4 text-sm font-bold text-gray-600">
                TÊN SỰ KIỆN
              </th>
              <th className="border-b-[1px] border-gray-200 py-4 px-4 text-sm font-bold text-gray-600">
                MÔ TẢ
              </th>
              <th className="border-b-[1px] border-gray-200 py-4 px-4 text-sm font-bold text-gray-600">
                NGÀY BẮT ĐẦU
              </th>
              <th className="border-b-[1px] border-gray-200 py-4 px-4 text-sm font-bold text-gray-600">
                NGÀY KẾT THÚC
              </th>
              <th className="border-b-[1px] border-gray-200 py-4 px-4 text-sm font-bold text-gray-600">
                HÀNH ĐỘNG
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : events.length > 0 ? (
              events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-100 transition">
                  <td
                    className="border-b-[1px] border-gray-200 py-4 px-4 cursor-pointer hover:underline text-blue-500"
                    onClick={() => handleEventClick(event)}
                    >
                    <p className="text-sm font-bold">{event.name}</p>
                    </td>
                  <td className="border-b-[1px] border-gray-200 py-4 px-4">
                    <p className="text-sm text-gray-700 truncate">{event.description}</p>
                  </td>
                  <td className="border-b-[1px] border-gray-200 py-4 px-4">
                    <p className="text-sm text-gray-700">
                      {new Date(event.startDate).toLocaleDateString("vi-VN")}
                    </p>
                  </td>
                  <td className="border-b-[1px] border-gray-200 py-4 px-4">
                    <p className="text-sm text-gray-700">
                      {new Date(event.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </td>
                  <td className="border-b-[1px] border-gray-200 py-4 px-4">
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Không có sự kiện nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-[80%] h-[80%] flex overflow-hidden">
                    {/* Thông tin sự kiện */}
                    <div className="w-1/2 p-6 overflow-y-auto border-r">
                        <h3 className="text-2xl font-bold mb-4">{selectedEvent.name}</h3>
                        <img
                          src={selectedEvent.image ? `https://42.96.42.197:5001${selectedEvent.image}` : "/default-image.jpg"}
                          alt={selectedEvent.name || "Event Image"}
                          className="w-1/2 h-40 object-cover rounded-lg"
                        />
                        <p className="text-gray-600 mb-6 italic">Mô tả: "{selectedEvent.description}"</p>
                        <p className="text-gray-700 mb-2">
                        <strong>Ngày bắt đầu:</strong>{" "}
                        {new Date(selectedEvent.startDate).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-gray-700 mb-6">
                        <strong>Ngày kết thúc:</strong>{" "}
                        {new Date(selectedEvent.endDate).toLocaleDateString("vi-VN")}
                        </p>
                    </div>

                    {/* Danh sách ảnh */}
                    <div className="w-1/2 p-6 overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Ảnh dự thi</h3>
                    {isPhotoLoading ? (
                        <p className="text-gray-600">Đang tải ảnh...</p>
                    ) : photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                        {photos.map((photo) => (
                            <div
                            key={photo._id}
                            className="rounded-lg overflow-hidden shadow cursor-pointer hover:scale-105 transition"
                            onClick={() => setSelectedPhoto(photo)} // Xử lý khi click vào ảnh
                            >
                            <img
                                  src={`https://42.96.42.197:5001${photo.url}`} // Sửa lại để tạo URL đầy đủ
                                  alt={photo.message}
                                  className="w-full h-32 object-cover"
                                />
                            <p className="text-sm text-gray-700 p-2">{photo.message}</p>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">Không có ảnh nào.</p>
                    )}
                    </div>
                    </div>

                    {/* Nút đóng modal */}
                    <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                    ✕
                    </button>
                </div>
                )}
      </div>

      {/* Modal thêm sự kiện */}
      {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div
                className="bg-white rounded-lg shadow-lg p-6 w-[40%]"
                onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng modal khi nhấp bên trong
                >
                <h3 className="text-xl font-bold mb-4 text-gray-700">Thêm sự kiện mới</h3>
                <form
                    onSubmit={async (e) => {
                    e.preventDefault();

                    try {
                        console.log("Dữ liệu newEvent:", newEvent);
                        const formData = new FormData();
                        formData.append("name", newEvent.name);
                        formData.append("description", newEvent.description);
                        formData.append("image", newEvent.image);
                        formData.append("startDate", newEvent.startDate);
                        formData.append("endDate", newEvent.endDate);
                        console.log("FormData kiểm tra:");
                        for (let pair of formData.entries()) {
                          console.log(`${pair[0]}: ${pair[1]}`);
                        }
                        const response = await axios.post("/api/events", formData, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        });

                        if (response.status === 201) {
                        toast.success("Tạo sự kiện thành công!");
                        setShowCreateModal(false);
                        fetchEvents(); // Tải lại danh sách sự kiện
                        setNewEvent({ name: "", description: "", image: "", startDate: "", endDate: "" });
                        }
                    } catch (error) {
                        console.error("Error creating event:", error);
                        toast.error("Không thể tạo sự kiện!");
                    }
                    }}
                >
                    {/* Tên sự kiện */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Tên sự kiện</label>
                    <input
                        type="text"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    </div>

                    {/* Mô tả sự kiện */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                    <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    </div>

                    {/* Ảnh đại diện */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
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
                    <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                    <input
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                    <input
                        type="date"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
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
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                        Lưu
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}
            {/* Modal Preview Ảnh */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-[40%] max-w-[500px] p-6">
                    <img
                        src={`https://42.96.42.197:5001${selectedPhoto.url}`}
                        alt={selectedPhoto.message}
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-bold mb-2">Lời chúc:</h3>
                    <p className="text-gray-700 mb-4">{selectedPhoto.message}</p>
                    <h3 className="text-lg font-bold mb-2">Người gửi:</h3>
                    <p className="text-gray-700 mb-4">
                        {selectedPhoto.senderName || "Ẩn danh"}
                    </p>
                    <div className="flex justify-end">
                        <button
                        onClick={() => setSelectedPhoto(null)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                        Đóng
                        </button>
                    </div>
                    </div>
                </div>
                )}
    </div>
  );
};

export default EventManagement;