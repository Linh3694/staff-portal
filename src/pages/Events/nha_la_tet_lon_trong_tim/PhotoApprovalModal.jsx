import React from "react";
import { API_URL, BASE_URL } from "../../../config"; // import từ file config

function PhotoApprovalModal ({ onClose }) {
    const [pendingPhotos, setPendingPhotos] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
  
    // Lấy token (nếu bạn có) hoặc role, v.v
    // Hoặc nếu không bảo vệ route, ta gọi API bình thường
    React.useEffect(() => {
      fetchPendingPhotos();
    }, []);
  
    const fetchPendingPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/photos/pending`);
        if (!response.ok) throw new Error("Không thể lấy ảnh chờ duyệt");
        const data = await response.json();
        setPendingPhotos(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
  
    // Xử lý phê duyệt
    const handleApprove = async (photoId) => {
      try {
        const response = await fetch(`${API_URL}/photos/approve/${photoId}`, {
          method: "PATCH",
        });
        if (!response.ok) throw new Error("Lỗi phê duyệt!");
        
        // Sau khi phê duyệt thành công, remove ảnh vừa phê duyệt khỏi mảng
        const updatedList = [...pendingPhotos];
        updatedList.splice(currentIndex, 1);
        setPendingPhotos(updatedList);
  
        // Nếu ảnh cuối cùng, đóng modal luôn
        if (currentIndex >= updatedList.length) {
          onClose();
        } else {
          // Sang ảnh kế tiếp
          // (Không tăng currentIndex vì ta đã splice)
        }
      } catch (error) {
        console.error("Approve error:", error);
      }
    };
  
    // Xử lý không duyệt => ta xoá ảnh
    const handleReject = async (photoId) => {
      try {
        const response = await fetch(`${API_URL}/photos/${photoId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Lỗi xóa ảnh!");
        
        const updatedList = [...pendingPhotos];
        updatedList.splice(currentIndex, 1);
        setPendingPhotos(updatedList);
  
        if (currentIndex >= updatedList.length) {
          onClose();
        }
      } catch (error) {
        console.error("Reject error:", error);
      }
    };
  
    if (loading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-4 rounded-md">Đang tải ảnh chờ duyệt...</div>
        </div>
      );
    }
  
    // Không còn ảnh => đóng
    if (!loading && pendingPhotos.length === 0) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-4 rounded-md text-center">
            <p>Không còn ảnh nào cần phê duyệt.</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      );
    }
  
    const currentPhoto = pendingPhotos[currentIndex];
  
    return (
      // Overlay
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2">
        {/* Container */}
        <div className="bg-white rounded-2xl shadow-lg relative max-w-xl w-full">
          {/* Nút đóng */}
          <button
            className="absolute top-4 right-4 text-gray-600 font-bold"
            onClick={onClose}
          >
            Đóng
          </button>
  
          {currentPhoto && (
            <div className="flex flex-col space-y-4">
              {/* Ảnh */}
              <div className="sticky top-0 w-full h-[300px] overflow-hidden flex justify-center items-center p-4">
                <img
                  src={`${BASE_URL}${currentPhoto.url}`}
                  alt={currentPhoto.title}
                  className="object-cover rounded-md border"
                />
              </div>
              <div className="ml-4 mr-4 border-t ">
               {/* Thông tin */}
              <h3 className="font-bold text-lg text-left mt-2">Tác phẩm: {currentPhoto.title || "Không tiêu đề"}</h3>
              <p className="text-sm text-[#002147] mt-1 ">Tác giả: {currentPhoto.uploaderName || "N/A"}</p>
              <p className="text-sm italic text-gray-500 mt-2">Thông điệp: "{currentPhoto.message}"</p>
              </div>
              {/* 2 nút phê duyệt và không */}
              <div className="w-full flex flex-row bottom-0 justify-center">
                <button
                  onClick={() => handleReject(currentPhoto._id)}
                  className="w-full h-12 bg-[#ff6b4a] text-white font-bold hover:bg-[#f95a36] rounded-bl-2xl"
                >
                  Không
                </button>
                <button
                  onClick={() => handleApprove(currentPhoto._id)}
                  className="w-full bg-[#009483] text-white font-bold hover:bg-[#258d81] rounded-br-2xl"
                >
                  Phê duyệt
                </button>
              </div>
            </div>
            
          )}
          
        </div>
      </div>
    );
  }

  export default PhotoApprovalModal; // Thêm dòng này