import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL } from "../../../config";
import { FiSend } from "react-icons/fi";
import { toast } from "react-toastify";
import { FiHeart, FiMessageSquare  } from "react-icons/fi";
import { useTranslation } from "react-i18next";




const PhotoReview = ({ photoId, isOpen, onClose, user }) => {
  console.log("User data in PhotoReview:", user);
  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [commentText, setCommentText] = useState("");
  const { t, i18n } = useTranslation();

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
        <div className="bg-white rounded-lg shadow-lg xs:w-[90vw] lg:w-[1400px] lg:h-[85vh] xs:h-[85vh] lg:p-6 xs:p-0 relative flex flex-col lg:flex-row">
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
            <div className="xs:w-full lg:w-1/3 xs:h-full lg:h-full lg:pl-4 xs:pl-0 flex flex-col rounded-lg xs:overflow-y-auto">
              <div className="flex flex-col items-left lg:mt-6 xs:mt-4 lg:ml-0 xs:ml-4 lg:mr-0 xs:mr-4">
                <span className="lg:text-2xl xs:text-lg text-[#B42B23] font-bold mb-2">{photo.title}</span>
                <p className="font-bold lg:text-md xs:text-sm italic mb-3">Tác giả: {photo.uploaderName || "Anonymous"}</p>
                <p className="text-gray-700 mb-1 overflow-hidden text-ellipsis whitespace-normal line-clamp-7 lg:text-base xs:text-sm">{photo.message}</p>
              </div>
              <div className="lg:hidden xs:flex ml-4 mr-4 mb-4 flex items-center justify-center rounded-2xl"
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
                className="h-full w-full object-contain border-4 rounded-2xl  border-[#FFECD7]"
              />
            </div>
              {/* Nút vote và hiển thị số lượng */}
              <div className="flex items-center justify-start space-x-3 mb-2 lg:ml-0 xs:ml-4 lg:mr-0 xs:mr-4 lg:mt-0 xs:mt-2">
                <div>
                <button
                  onClick={handleVote}
                  className={`lg:px-2 lg:py-1 xs:px-1 xs:py-1 rounded ${
                    photo?.isVoted
                      ? "hover:border-[#B42B23] text-[#B42B23] lg:text-base xs:text-xs"
                      : "hover:border-[#B42B23] text-[#B42B23] lg:text-base xs:text-xs"
                  }`}
                >
                  {photo?.isVoted 
                  ? "❤️"
                  : <FiHeart></FiHeart>}
                </button>
                <span className="lg:text-md xs:text-sm font-semibold text-[#B42B23]">
                {likes}
                </span>
                </div>
                <span className="flex flex-row gap-1 lg:text-md xs:text-sm font-semibold text-[#401011] ">
                <FiMessageSquare className="lg:mt-0.5 xs:mt-1 lg:text-lg xs:text-md"/>{comments.length}
                </span>
              </div>

              {/* Danh sách bình luận */}
              <div className="flex-1 flex-col border-t-2 lg:overflow-y-auto xs:overflow-visible pt-4 lg:max-h-[70vh] xs:max-h-none">
                {comments.map((comment, index) => (
                  <div key={index} className="mb-3 p-2 bg-[#F6F6F6] rounded-xl lg:ml-0 xs:ml-4 lg:mr-0 xs:mr-4">
                    <div className="ml-3">
                      <p className="font-bold mb-1 text-sm text-[#401011]">{comment.user}</p>
                      <p className="text-[#401011] text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form nhập bình luận */}
              <form onSubmit={handleAddComment} 
                  className="mt-4 lg:h-12 xs:h-16 w-full flex items-center bg-[#FCF5E3] xs:rounded-b-2xl lg:rounded-b-none lg:rounded-br-2xl
                  sticky bottom-0"
                >                
                <input
                  type="text"
                  placeholder="Thêm bình luận/Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="lg:p-3 xs:p-4 w-full lg:h-7 xs:h-12 text-sm rounded-full border-0 ml-2 mr-4 xs:mt-2 xs:mb-2"
                />
                <button
                  type="submit"
                  className="bg-[#B42B23] text-white h-7 w-9 rounded-full flex items-center justify-center mr-4"
                  aria-label="Send comment"
                >
                  <FiSend size={16} />
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