// src/components/newsfeed/PostForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../config";
import { FaImages } from "react-icons/fa";


function PostForm() {
  // 1) STATE QUẢN LÝ THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
  const [currentUser, setCurrentUser] = useState(null);

  // 2) STATE CHO DANH SÁCH NGƯỜI DÙNG (phục vụ chức năng Ghi nhận)
  const [allUsers, setAllUsers] = useState([]);

  // 3) STATE CHO MODAL & CÁC TRƯỜNG CẦN THIẾT
  const [isModalOpen, setIsModalOpen] = useState(false);
  // modalType: 'text' | 'image' | 'recognition'
  const [modalType, setModalType] = useState("text");

  // Các trường của bài đăng
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // vẫn lưu file để gửi, không preview
  const [checkinLocation, setCheckinLocation] = useState("");
  const [recognizedUser, setRecognizedUser] = useState("");

  // ----------------------------------------------------------------
  // A. FETCH CURRENT USER & DANH SÁCH USERS
  // ----------------------------------------------------------------
  useEffect(() => {
    fetchCurrentUser();
    fetchAllUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data; // { id, fullname, avatarUrl, ... } tuỳ backend
      // Nếu backend trả về _id, bạn gán:
      setCurrentUser({
        id: data._id, // hoặc data.id nếu backend đã map sẵn
        fullname: data.fullname || "",
        avatarUrl: data.avatarUrl
          ? `${BASE_URL}${data.avatarUrl}`
          : "http://via.placeholder.com/150",
        // ...bổ sung các trường cần
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchAllUsers = async () => {
    // Lấy danh sách user để hiển thị ở phần "Ghi nhận"
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Giả sử res.data là mảng user
      setAllUsers(res.data);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  // ----------------------------------------------------------------
  // B. SỰ KIỆN MỞ/TẮT MODAL
  // ----------------------------------------------------------------
  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType("text");
    // Reset các trường
    setContent("");
    setImages([]);
    setCheckinLocation("");
    setRecognizedUser("");
  };

  // ----------------------------------------------------------------
  // C. UPLOAD ẢNH (KHÔNG HIỂN THỊ PREVIEW)
  // ----------------------------------------------------------------
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    // Ở đây ta chỉ cần giữ file hoặc URL, tuỳ backend
    const fileURLs = files.map((file) => URL.createObjectURL(file));
    // Chỗ này có thể upload ngay hoặc để batch upload, tuỳ ý
    setImages([...images, ...fileURLs]);
    // Có thể chuyển sang chế độ 'image' (hoặc vẫn giữ 'text' cũng được)
    setModalType("image");
    setIsModalOpen(true);
  };

  // ----------------------------------------------------------------
  // D. SUBMIT BÀI ĐĂNG
  // ----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // payload tuỳ ý, backend handle
    const payload = {
      content,
      images,
      type: modalType, // "text", "image", "checkin", "recognition"
      author: currentUser?.id, // backend nên check token
    };

    // Nếu recognition
    if (modalType === "recognition" && recognizedUser) {
      payload.recognizedUserId = recognizedUser;
    }

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(`${API_URL}/newsfeed`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Created post:", res.data);

      // Sau khi đăng thành công => đóng modal
      closeModal();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // ----------------------------------------------------------------
  // E. GIAO DIỆN CHÍNH
  // ----------------------------------------------------------------
  if (!currentUser) {
    // Bạn có thể thay bằng loading spinner tuỳ ý
    return <p>Loading user...</p>;
  }

  return (
    <div 
    className="bg-white shadow rounded-lg p-7 mb-4 w-full max-w-2xl mx-auto">
      {/* Vùng click mở modal "Tạo bài viết" */}
      <div
        className="flex items-center cursor-pointer mb-6"
        onClick={() => openModal("text")}
      >
        <img
          src={currentUser.avatarUrl}
          alt="Avatar"
          className="w-14 h-12 rounded-full object-cover mr-3"
        />
        <div className="w-full rounded-full  bg-gray-100 p-3">
        <span className="text-gray-600">Bạn muốn chia sẻ điều gì?</span>
        </div>
      </div>

      {/* Nút chọn ảnh (nếu cần) */}
      <div className="mt-2 flex space-x-4">
        <label
          htmlFor="fileInput"
          className="cursor-pointer px-3 py-2 bg-blue-50 text-blue-600 rounded"
        >
         <FaImages size={24} /> Ảnh/Video
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => openModal("checkin")}
          className="px-3 py-2 bg-green-50 text-green-600 rounded"
        >
          Check in
        </button>

        <button
          onClick={() => openModal("recognition")}
          className="px-3 py-2 bg-yellow-50 text-yellow-600 rounded"
        >
          Ghi nhận
        </button>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-md mx-2 p-4 relative">
            {/* Nút đóng modal */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 text-xl"
            >
              &times;
            </button>

            {/* Tiêu đề */}
            <h2 className="text-lg font-bold mb-3">
              {modalType === "text" && "Tạo bài viết"}
              {modalType === "image" && "Tạo bài viết với ảnh/video"}
              {modalType === "checkin" && "Check in"}
              {modalType === "recognition" && "Ghi nhận"}
            </h2>

            {/* Nội dung text */}
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none"
              rows={4}
              placeholder="Bạn muốn chia sẻ điều gì?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Check in */}
            {modalType === "checkin" && (
              <div className="my-2 text-sm text-blue-600">
                <label className="block mb-1">Địa điểm check-in:</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-1"
                  placeholder="Ví dụ: Văn phòng ABC..."
                  value={checkinLocation}
                  onChange={(e) => setCheckinLocation(e.target.value)}
                />
              </div>
            )}

            {/* Ghi nhận */}
            {modalType === "recognition" && (
              <div className="my-2 text-sm text-yellow-600">
                <label className="block mb-1">Chọn người được ghi nhận:</label>
                <select
                  className="w-full border border-gray-300 rounded p-1"
                  value={recognizedUser}
                  onChange={(e) => setRecognizedUser(e.target.value)}
                >
                  <option value="">--Chọn--</option>
                  {allUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.fullname} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nút Đăng */}
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white w-full py-2 mt-3 rounded font-medium text-sm hover:bg-blue-600 transition"
            >
              Đăng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostForm;