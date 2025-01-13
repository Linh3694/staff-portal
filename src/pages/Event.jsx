import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "./login.css"
import i18n from "../i18n"; // Đảm bảo bạn đã cấu hình i18n như hướng dẫn trước đó.

const Event = () => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState("vi");
  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Sự kiện được chọn
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null); // Trạng thái đăng nhập
  const [showLoginModal, setShowLoginModal] = useState(false); // Modal đăng nhập
  const [previewPhoto, setPreviewPhoto] = useState(null); // Ảnh được chọn để xem chi tiết
  const [comments, setComments] = useState([]); // Danh sách bình luận cho ảnh
  const [newComment, setNewComment] = useState(""); // Nội dung bình luận mới


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const text = await response.text(); // Lấy phản hồi dưới dạng văn bản
        console.log("Response text:", text);
        const data = JSON.parse(text); // Chuyển đổi thành JSON
        console.log("Events data:", data); // Kiểm tra dữ liệu trả về
        setEvents(data);
      } catch (error) {
        console.error("Lỗi khi fetch sự kiện:", error);
      }
    };
  
    fetchEvents();
  }, []);

  const fetchPhotosByEvent = async (eventId) => {
    console.log("Selected Event:", selectedEvent); // Log này có thể gây lỗi
    try {
      const response = await fetch(`/api/photos?eventId=${eventId}`);
      if (!response.ok) throw new Error("Failed to fetch photos");
      const data = await response.json();
      console.log("Photos fetched:", data);
      const sortedPhotos = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPhotos(sortedPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };

  const handleEventClick = (event) => {
    if (!user) {
      setShowLoginModal(true); // Hiển thị modal yêu cầu đăng nhập
      return;
    }
    setSelectedEvent(event); // Mở modal tham gia sự kiện
    fetchPhotosByEvent(event._id); // Gọi API để tải ảnh của sự kiện
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi đăng nhập");
      }
  
      const { token, user } = await response.json();
  
      // Lưu thông tin đăng nhập vào localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      setUser(user); // Cập nhật trạng thái người dùng
      setShowLoginModal(false); // Đóng modal
      toast.success("Đăng nhập thành công!");
    } catch (error) {
      console.error("Login Error:", error.message);
      toast.error(error.message || "Đăng nhập thất bại!");
    }
  };

  const handleLogout = () => {
    setUser(null); // Đăng xuất
  };

  const handleUpload = async () => {
    if (!file || !message) {
      alert(t("upload_error"));
      return;
    }
  
    const formData = new FormData();
    formData.append("photo", file); // File ảnh
    formData.append("message", message); // Lời chúc hoặc mô tả
    formData.append("eventId", selectedEvent._id); // ID sự kiện
    formData.append("uploaderName", user?.fullname || "Ẩn danh"); // Tên người upload
  
    console.log("FormData gửi đi:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
  
      if (res.ok) {
        toast.success(t("upload_success"));
        setFile(null); // Reset file
        setMessage(""); // Reset message
        fetchPhotosByEvent(selectedEvent._id); // Reload danh sách ảnh
      } else {
        toast.error(t("upload_failed"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("upload_failed"));
    }
  };

  const authToken = localStorage.getItem("authToken");

const handleLike = async (photoId) => {
  console.log("Photo ID:", photoId); // Debug để kiểm tra photoId
  try {
    const response = await fetch(`/api/photos/${photoId}/vote`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      toast.success("Đã thả tim!");
      fetchPhotosByEvent(selectedEvent._id);
    } else {
      toast.error("Không thể thả tim!");
    }
  } catch (error) {
    console.error("Error liking photo:", error);
    toast.error("Lỗi khi thả tim!");
  }
};

const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const response = await fetch(`/api/photos/${previewPhoto._id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({ text: newComment, user: user?.fullname || "Ẩn danh" }),
    });

    if (response.ok) {
      const updatedComments = await response.json();

      // Thêm bình luận mới trực tiếp vào state comments
      setComments((prevComments) => [
        ...prevComments,
        { text: newComment, user: user?.fullname || "Ẩn danh", createdAt: new Date().toISOString() },
      ]);

      setNewComment(""); // Reset nội dung bình luận
      toast.success("Thêm bình luận thành công!");
    } else {
      toast.error("Không thể thêm bình luận!");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    toast.error("Lỗi khi thêm bình luận!");
  }
};

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  

  return (
    <div className=" text-white min-h-screen">
      {/* Header */}
      <header className="bg-yellow-500 text-center py-6 relative">
        <h1 className="text-4xl font-bold">{t("welcome")}</h1>
        <p className="mt-2 text-lg">{t("participate_event")}</p>

        {/* Language Switcher */}
        <div className="absolute top-4 right-6 flex space-x-4">
          {/* Login / Logout */}
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">Hi, {user.fullname}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
            >
              {t("login")}
            </button>
          )}
          <button
            onClick={() => toggleLanguage("en")}
            className={`w-8 h-8 rounded-full border-2 ${
              language === "en" ? "border-white" : "border-gray-300"
            }`}
          >
            <img
              src="/icons/flag-en.png"
              alt="English"
              className="w-full h-full rounded-full object-cover"
            />
          </button>
          <button
            onClick={() => toggleLanguage("vi")}
            className={`w-8 h-8 rounded-full border-2 ${
              language === "vi" ? "border-white" : "border-gray-300"
            }`}
          >
            <img
              src="/icons/flag-vi.png"
              alt="Tiếng Việt"
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
      </header>
      
      {/* Top 10 */}
      <section className="max-w-6xl mx-auto px-4 mt-8 bg-red-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-center">{t("top_10_photos")}</h2>
        <div className="flex overflow-x-scroll mt-6">
          {leaderboard.map((photo) => (
            <div key={photo.id} className="min-w-[150px] mr-4">
              <img
                src={`https://staff-portal.wellspring.edu.vn${photo.url}`} // Sửa lại để tạo URL đầy đủ
                alt={photo.message}
                className="w-full h-32 object-cover"
              />
              <p className="text-sm text-center mt-2">{photo.message}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sự kiện */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{t("event_name")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.length === 0 ? (
                <p className="text-center col-span-full">{t("no_events")}</p>
              ) : (
                events.slice(0, 6).map((event) => (
                  <div
                    key={event._id}
                    onClick={() => handleEventClick(event)}
                    className="bg-white text-gray-800 rounded-lg shadow-lg p-4 hover:scale-105 transform transition cursor-pointer"
                  >
                    {/* Hiển thị hình ảnh */}
                    <img
                      src={`https://staff-portal.wellspring.edu.vn${event.image}`} // Đảm bảo đường dẫn ảnh đầy đủ
                      alt={event.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    {/* Hiển thị tên sự kiện */}
                    <p className="mt-4 text-center text-lg font-semibold">{event.name}</p>
                  </div>
                ))
              )}
            </div>
        </section>

      {/* Upload ảnh với lời chúc */}
      {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-5xl p-6 flex">
              {/* Block Bên Trái */}
              <div className="w-1/2 pr-4 border-r">
                {/* Tên sự kiện */}
                <h2 className="text-2xl font-bold mb-4 text-center text-red-800">{selectedEvent.name}</h2>

                {/* Ảnh sự kiện */}
                <img
                  src={`https://staff-portal.wellspring.edu.vn${selectedEvent.image}`}
                  alt={selectedEvent.name || "No Image"}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />

                {/* Mô tả sự kiện */}
                <p className="text-sm italic text-gray-600 mb-6 text-center">
                  "{selectedEvent.description}"
                </p>

                {/* Upload ảnh và lời chúc */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t("photo_upload")}</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-sm text-red-200 bg-gray-50 rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t("message")}</label>
                  <textarea
                    placeholder={t("upload_placeholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded border p-2 text-red-200"
                  />
                </div>

                {/* Nút Hành Động */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleUpload}
                    className="bg-red-600 text-white px-4 py-2 ml-2 rounded hover:bg-red-700 transition"
                  >
                    {t("upload_button")}
                  </button>
                </div>
              </div>

              {/* Block Bên Phải */}
              <div className="w-1/2 pl-4">
                <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Danh sách ảnh dự thi</h2>
                {/* Danh sách ảnh */}
                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {photos.length > 0 ? (
                    photos.map((photo) => (
                      <div
                        key={photo._id}
                        className="relative bg-gray-100 rounded-lg shadow-md overflow-hidden cursor-pointer"
                        onClick={() => {
                          setPreviewPhoto(photo); // Mở modal preview
                          setComments(photo.comments || []); // Lấy danh sách bình luận (nếu có)
                        }}
                      >
                        <img
                          src={`https://staff-portal.wellspring.edu.vn${photo.url}`} // Sửa lại để tạo URL đầy đủ
                          alt={photo.message}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2">
                          <p className="text-sm text-gray-800 truncate">{photo.message}</p>
                          <p className="text-xs text-gray-500">{t("uploaded_by")}: {photo.uploaderName || "Ẩn danh"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Không có ảnh nào.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal Đăng Nhập */}
{showLoginModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="login-box relative">
      {/* Nút Đóng Modal */}
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        onClick={() => setShowLoginModal(false)}
      >
        ✕
      </button>

      {/* Tiêu Đề */}
      <h1 className="text-3xl font-bold text-[#002147] mb-8 text-center">Đăng Nhập</h1>

      {/* Form Đăng Nhập */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = e.target.email.value;
          const password = e.target.password.value;
          handleLogin(email, password); // Gọi hàm handleLogin với email và password
        }}
        className="space-y-6"
      >
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all duration-300"
            placeholder="example@domain.com"
          />
        </div>

        {/* Mật Khẩu */}
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-3 rounded-lg text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all duration-300"
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        {/* Nút Đăng Nhập */}
        <button
          type="submit"
          className="w-full bg-[#002147] text-white py-3 rounded-lg hover:bg-[#001a38] focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all duration-300"
        >
          Đăng Nhập
        </button>
      </form>
    </div>
  </div>
)}

{previewPhoto && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-[80%] h-[80%] flex overflow-hidden">
      {/* Phần Ảnh */}
      <div className="w-1/2 bg-gray-100 flex justify-center items-center p-6">
      <img
        src={`https://staff-portal.wellspring.edu.vn${previewPhoto.url}`} // Sửa lại để tạo URL đầy đủ
        alt={previewPhoto.message}
        className="max-w-full max-h-full rounded-lg"
      />
      </div>

      {/* Phần Thông Tin */}
      <div className="w-1/2 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4">{previewPhoto.message}</h2>
        <p className="text-gray-700 mb-2">
        {previewPhoto.uploaderName || "Ẩn danh"}
        </p>
        <p className="text-gray-700 mb-2 italic">
        "{previewPhoto.message || "Không có mô tả"}"
        </p>
        <p className="text-gray-500 text-sm mb-4">
          {new Date(previewPhoto.createdAt).toLocaleString()}
        </p>

        {/* Nút Thả Tim */}
        <button
          onClick={() => handleLike(previewPhoto._id)}
          className="mb-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          ❤️ {previewPhoto.votes} {t("like")}
        </button>

        {/* Bình Luận */}
        <h3 className="text-lg font-bold mb-2">{t("comments")}</h3>
        <div className="flex-grow overflow-y-auto mb-4 border rounded p-4">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="mb-2">
                <p className="text-sm font-semibold">{comment.user?.fullname}</p>
                <p className="text-sm text-gray-700">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">{t("no_comments")}</p>
          )}
        </div>

        {/* Thêm Bình Luận */}
        <div className="flex">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow border rounded-lg px-4 py-2"
            placeholder={t("add_comment_placeholder")}
          />
          <button
            onClick={handleAddComment}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {t("add_comment")}
          </button>
        </div>
      </div>
    </div>

    {/* Nút Đóng Modal */}
    <button
      onClick={() => setPreviewPhoto(null)}
      className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
    >
      ✕
    </button>
  </div>
)}

      

      {/* Thư viện ảnh */}
      <section className="max-w-6xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold text-center">{t("photo_gallery")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {photos.map((photo) => (
            <div key={photo.id} className="relative bg-white rounded-lg shadow-lg">
              <img
                src={photo.url}
                alt="User upload"
                className="rounded-t-lg w-full h-40 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-800">{photo.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {t("uploaded_by")}: {photo.uploaderName || "Ẩn danh"}
                </p>
                <button className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded">
                  ❤️ {photo.votes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4 bg-red-800 text-white mt-8">
        <p>&copy; 2025 Tết Yêu Thương | {t("footer_message")}</p>
      </footer>
    </div>
  );
};

export default Event;