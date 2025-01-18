import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../../config";
import { FiSend } from "react-icons/fi";
import { toast } from "react-toastify";
import { FiHeart, FiMessageSquare  } from "react-icons/fi";



const PhotoReview = ({ photoId, isOpen, onClose, user }) => {
  console.log("User data in PhotoReview:", user);
  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false); // 👈 Thêm state quản lý hiển thị toàn bộ văn bản


  useEffect(() => {
    if (isOpen && photoId && user?.userId) {  // ✅ Đúng với object user trong storage
      const fetchPhotoDetails = async () => {
        try {
          const response = await axios.get(`${API_URL}/photos/${photoId}`, {
            params: { userId: user?.userId }, // ✅ Gửi đúng userId cho API
          });
  
          const data = response.data;
          setPhoto(data);
          setLikes(data.votes);
          setComments(data.comments || []);
        } catch (error) {
          console.error("❌ Lỗi khi tải ảnh:", error);
          toast.error("Không thể tải chi tiết ảnh.");
        }
      };
  
      fetchPhotoDetails();
    }
  }, [isOpen, photoId, user]);

  const handleVote = async () => {
    console.log("User object:", user);
  
    if (!user?.userId) {
      toast.error("Lỗi: Không tìm thấy thông tin người dùng!");
      console.error("Không có userId, dữ liệu user:", user);
      return;
    }
  
    console.log("🟡 Gửi yêu cầu vote với dữ liệu:", {
      userId: user.userId,
      photoId,
    });
  
    try {
      const response = await axios.post(`${API_URL}/photos/${photoId}/vote`, {
        userId: user.userId,
      });
  
      console.log("✅ Phản hồi từ server:", response.data);
  
      if (response.status === 200) {
        const { isVoted, votes } = response.data;
  
        if (isVoted) {
          toast.success("Đã thả tim!");
        } else {
          toast.info("Bạn đã bỏ vote!");
        }
  
        // ⚠️ Cập nhật `photo` ngay lập tức thay vì chỉ cập nhật `likes`
        setPhoto((prev) => ({
          ...prev,
          isVoted,
          votes, // Cập nhật số votes ngay
        }));
  
        // ⚠️ Nếu chỉ setLikes mà không setPhoto, UI có thể không render lại đúng
        setLikes(votes);
      } else {
        toast.error("Không thể thực hiện hành động này!");
      }
    } catch (error) {
      console.error("❌ Lỗi khi thả/bỏ vote:", error.response?.data || error.message);
      toast.error("Lỗi khi thả tim hoặc bỏ vote!");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText) return;
    try {
      const res = await axios.post(`${API_URL}/photos/${photoId}/comment`, {
        text: commentText,
        user: user.fullName,
      });
      setComments(res.data);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-[90vw] lg:w-[1400px] h-[85vh] p-6 relative flex flex-col lg:flex-row">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>

        {!photo ? (
          <div className="w-full flex items-center justify-center">Loading...</div>
        ) : (
          <div className="flex w-full h-full flex-col lg:flex-row">
            {/* Ảnh hiển thị */}
            <div className="xs:hidden lg:flex
            w-2/3 h-full items-center justify-center rounded-2xl"
            style={{
              backgroundImage: `url('/tet2025/image/background-primary.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              maxWidth: "1920px", // ✅ Giới hạn ngang
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
              <img
                src={`${BASE_URL}${photo.url}`}
                alt={photo.title}
                className="h-full w-full object-contain border-4 border-[#FFECD7] rounded-2xl"
              />
            </div>

            {/* Phần thông tin và bình luận */}
            <div className="w-full lg:w-1/3 h-1/2 lg:h-full pl-4 flex flex-col">
              <div className="flex flex-col items-left mt-6">
                <span className="text-2xl text-[#B42B23] font-bold mb-2">{photo.title}</span>
                <p className="font-bold text-lg italic mb-6">{photo.uploaderName || "Anonymous"}</p>
                <p className="text-gray-700 mb-1 overflow-hidden text-ellipsis whitespace-normal line-clamp-7">{photo.message}</p>
              </div>
              <div className="lg:hidden xs:flex
                w-full h-full flex items-center justify-center rounded-2xl"
                style={{
                  backgroundImage: `url('/tet2025/image/background-primary.png')`, // Không cần process.env.PUBLIC_URL
                  backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                  backgroundPosition: "center", // ✅ Căn giữa
                  backgroundRepeat: "no-repeat",
                  width: "100%", // ✅ Giữ full width
                  maxWidth: "1920px", // ✅ Giới hạn ngang
                  margin: "0 auto", // ✅ Căn giữa khi có max-width
                }}>
              <img
                src={`${BASE_URL}${photo.url}`}
                alt={photo.title}
                className="h-full w-full object-contain border-4 rounded-2xl border-[#FFECD7]"
              />
            </div>
              {/* Nút vote và hiển thị số lượng */}
              <div className="flex items-center justify-between mb-4">
                <div>
                <button
                  onClick={handleVote}
                  className={`px-4 py-2 rounded ${
                    photo?.isVoted
                      ? "hover:border-[#B42B23] text-[#B42B23]"
                      : "hover:border-[#B42B23] text-[#B42B23]"
                  }`}
                >
                  {photo?.isVoted 
                  ? "❤️"
                  : <FiHeart></FiHeart>}
                </button>
                <span className="text-sm font-semibold text-gray-500">
                  {photo?.isVoted 
                    ? `Bạn${likes > 1 ? ` và ${likes - 1} người` : ""} đã thích`
                    : `${likes} người thích`}
                </span>
                </div>
                <span className="ml-4 text-sm font-semibold text-gray-500">
                  {comments.length} Comments
                </span>
              </div>

              {/* Danh sách bình luận */}
              <div className="mt-4 flex-1 overflow-auto">
                {comments.map((comment, index) => (
                  <div key={index} className="mb-2 border-b pb-2">
                    <p className="font-bold text-sm">{comment.user}</p>
                    <p className="text-gray-600 text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Form nhập bình luận */}
              <form onSubmit={handleAddComment} className="mt-4 flex items-center">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="border p-3 w-full h-9 rounded-lg"
                />
                <button
                  type="submit"
                  className="bg-[#002147] ml-2 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  aria-label="Send comment"
                >
                  <FiSend size={20} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
</div>
  );
};

export default PhotoReview;