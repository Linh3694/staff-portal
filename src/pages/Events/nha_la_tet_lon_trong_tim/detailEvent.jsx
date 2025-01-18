import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API_URL, BASE_URL } from "../../../config";
import { toast } from "react-toastify";
import i18n from "../../../i18n"; // Đảm bảo bạn đã cấu hình i18n như hướng dẫn trước đó.
import UploadModal from "./uploadModal";
import PhotoReview from "./PhotoReview";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";


const DetailEvent = () => {
  const { state } = useLocation(); // Lấy dữ liệu từ navigate
  const { slug } = useParams(); // Lấy slug từ URL
  const [event, setEvent] = useState(state?.event || null); // Ưu tiên lấy từ state nếu có
  const [photos, setPhotos] = useState([]); // Ảnh dự thi
  const [language, setLanguage] = useState("vi");
  const [leaderboard, setLeaderboard] = useState();
  const [isModalOpen, setModalOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isPhotoReviewOpen, setPhotoReviewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [user, setUser] = useState(null); // Dữ liệu người dùng từ localStorage
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Hiển thị 15 ảnh mỗi trang
  const navigate = useNavigate();

  const paginatedPhotos = photos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };
  // Fetch sự kiện nếu không có dữ liệu từ state

  useEffect(() => {
    if (!event) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(`${API_URL}/events?slug=${slug}`);
          if (!response.ok) throw new Error("Không thể tải thông tin sự kiện.");
          const data = await response.json();
          setEvent(data);
        } catch (error) {
          console.error(error);
          toast.error("Không thể tải thông tin thử thách.");
        }
      };

      fetchEvent();
    }
  }, [slug, event]);

  // Fetch danh sách ảnh dự thi
  useEffect(() => {
    if (event?._id) {
      const fetchPhotos = async () => {
        try {
          const response = await fetch(`${API_URL}/photos?eventId=${event._id}`);
          const data = await response.json();
          setPhotos(data);
        } catch (error) {
          console.error(error);
          toast.error("Không thể tải ảnh dự thi.");
        }
      };

      fetchPhotos();
    }
  }, [event]);

  useEffect(() => {
    if (event?._id) {
      const fetchLeaderboard = async () => {
        try {
          const response = await fetch(`${API_URL}/photos/leaderboard?eventId=${event._id}`);
          if (!response.ok) throw new Error("Failed to fetch leaderboard");
          const data = await response.json();
          setLeaderboard(data); // Không cần trạng thái `isVoted` ở đây
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          toast.error("Không thể tải bảng xếp hạng.");
        }
      };
  
      fetchLeaderboard();
    }
  }, [event]);

  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Lỗi khi parse dữ liệu user từ localStorage:", error);
      }
    } else {
      console.warn("⚠ Không tìm thấy thông tin người dùng trong localStorage.");
    }
  }, []);

  useEffect(() => {
    if (event?.endDate) {
      const calculateDaysRemaining = () => {
        const today = new Date();
        const endDate = new Date(event.endDate);
        const difference = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        setEvent((prev) => ({ ...prev, daysRemaining: difference }));
      };
      calculateDaysRemaining();
    }
  }, [event?.endDate]);

  const openPhotoReview = (photo) => {
    setSelectedPhoto(photo);
    setPhotoReviewOpen(true);
    console.log(photo); // Xác minh `photo._id`
  };

  const closePhotoReview = () => {
    setSelectedPhoto(null);
    setPhotoReviewOpen(false);
  };

  const handleVote = async (photoId) => {
    try {
      const response = await fetch(`${API_URL}/photos/${photoId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?._id }),
      });
  
      if (response.ok) {
        toast.success("Đã thả tim!");
        // Cập nhật danh sách ảnh
        setPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo._id === photoId
              ? { ...photo, isVoted: true, votes: photo.votes + 1 }
              : photo
          )
        );
      } else {
        toast.error("Bạn đã thả tim ảnh này trước đó!");
      }
    } catch (error) {
      console.error("Error voting photo:", error);
      toast.error("Lỗi khi thả tim!");
    }
  };

  if (!event) return <p>Đang tải thông tin sự kiện...</p>;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[#fcf5e3] flex items-center justify-between w-full h-[80px] px-6">
        {/* Logo Section */}
        <div className="w-[1390px] mx-auto flex flex-row items-center justify-between">
            <div className="flex  items-center space-x-2">
              <img
                src="/tet2025/image/wellsping-logo.png" // Đường dẫn logo 1
                alt="Logo 1"
                className="h-28 w-auto"
              />
              <img
                src="/tet2025/image/happyjourney.png" // Đường dẫn logo 2
                alt="Logo 2"
                className="h-28 w-auto"
              />
            </div>
  
              {/* Language Switcher */}
              <div className ="items-center">
                <div className ="flex items-center gap-2">
                <span>Chào mừng Wiser <span className="font-bold">{user?.fullName  || "Ẩn danh"}</span></span>
                <span className="w-10 h-10 border-2 border-gray-300 bg-[#E55526] rounded-full flex items-center justify-center" 
                onClick={() => {
                  localStorage.removeItem("user"); // Xóa thông tin người dùng
                  navigate("/auth"); // Điều hướng về trang đăng nhập
                }}>
                  <FiLogOut size={20} className="text-white" />
                </span>
                <button
                  onClick={() => {
                    const newLang = language === "vi" ? "en" : "vi";
                    i18n.changeLanguage(newLang);
                    setLanguage(newLang);
                  }}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 transition-transform transform hover:scale-110"
                >
                  <img
                    src={`/tet2025/icons/flag-${language}.png`} // ✅ Tự động đổi cờ dựa trên ngôn ngữ
                    alt={language === "vi" ? "Tiếng Việt" : "English"}
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
                </div>
              </div>
        </div>
      </header>
  
      {/* Nội dung chính */}
      <div
        className="flex flex-col justify-center items-center py-10"
        style={{
          backgroundImage: `url('/tet2025/image/background-primary.png')`, // Không cần process.env.PUBLIC_URL
          backgroundSize: "contain", // ✅ Ảnh không bị zoom to
          backgroundPosition: "top center", // ✅ Căn giữa
          backgroundRepeat: "no-repeat",
          width: "100%", // ✅ Giữ full width
          maxWidth: "1920px", // ✅ Giới hạn ngang
          margin: "0 auto", // ✅ Căn giữa khi có max-width
        }}
      >
        <div className="w-[1390px] ">
          <h1 className="text-3xl text-[#fcf5e3] font-bold mb-8 text-left">{event.name}</h1>
          {/* Hình ảnh */}
          {/* Phần Hình ảnh */}
          <div className ="text-lg font-bold mb-4">
          </div>
          {/* Hiển thị top 4 ảnh dự thi */}
            <div className="mb-8 flex justify-between items-center">
              {(() => {
                // Lấy danh sách ảnh từ leaderboard
                const displayedPhotos = leaderboard?.sort((a, b) => b.votes - a.votes).slice(0, 4) || [];
                
                // Nếu chưa đủ 4 ảnh, bổ sung ô "Chưa có ảnh"
                while (displayedPhotos.length < 4) {
                  displayedPhotos.push(null);
                }

                return displayedPhotos.map((photo, index) =>
                  photo ? (
                    <div
                      key={photo._id}
                      className={`relative border-2 border-[#fcf5e3] overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${
                        hoveredIndex === index ? "w-[550px] h-[405px]" : "w-[340px] h-[405px]"
                      }`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => openPhotoReview(photo)}
                    >
                      {/* Số lượng tim ở góc trên bên phải */}
                      <div className="absolute top-2 right-2 bg-gray-100 bg-opacity-50 text-white text-sm font-bold px-2 py-1 rounded-full">
                            ❤️ {photo.votes}
                      </div>
                      <img
                        src={`${BASE_URL}${photo.url}`}
                        alt={photo.title || "Không tiêu đề"}
                        className="w-full h-full object-cover"
                      />
                      <p className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded-tl-lg">
                        {photo.title || "Không tiêu đề"}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="bg-gray-200 relative overflow-hidden rounded-lg shadow-md w-[340px] h-[405px]"
                    >
                      <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500">
                        Chưa có ảnh
                      </p>
                    </div>
                  )
                );
              })()}
            </div>
          </div>
            <div className="w-[1100px] mx-auto grid grid-cols-2 gap-6 mt-8 mb-8">
              {/* Cột trái - Nội dung thử thách */}
              <div className="w-[650px] p-4">
                <h2 className="text-2xl text-[#fcf5e3] font-bold mb-4">Thử thách {event.number}</h2>
                <p className="text-xl text-[#fcf5e3] mb-2">{event.description || "Không có mô tả"}</p>

                {/* Người tham gia */}
                <div className="mt-4">
                  <h3 className="text-lg text-[#fcf5e3] font-bold mb-1">Người tham gia</h3>
                  <p className="text-lg text-[#fcf5e3] rounded">
                    {photos.length > 0
                      ? `${photos[0]?.uploaderName || "Ẩn danh"} và ${
                          photos.length - 1
                        } người khác đã tham gia thử thách.`
                      : "Chưa có bài dự thi nào."}
                  </p>
                </div>
              </div>

              {/* Cột phải - Thông tin chính */}
              <div className="w-[400px] ml-28  bg-[#fcf5e3] border p-6 rounded-lg shadow-md flex flex-col justify-between">
                <h2 className="text-xl font-bold mb-4">Thông tin chính</h2>

                {/* Hạn nộp bài */}
                <div className="flex items-center space-x-4">

                  <div className="w-16 h-16 flex flex-col items-center justify-center bg-white border border-gray-300 rounded-lg text-[#5e191a] font-bold">
                    <span className="text-xs uppercase text-[#b42b23]">
                      {event.endDate ? new Date(event.endDate).toLocaleString('en-US', { month: 'short' }).toUpperCase() : "?"}
                    </span>
                    <span className="text-3xl">
                      {event.endDate ? `${new Date(event.endDate).getDate()}` : "?"}
                    </span>
                  </div>

                  <div>
                    <p className="text-lg text-[#5e191a]">Hạn nộp bài thi</p>
                    <p className="text-xl font-bold text-[#5e191a]">
                      {event?.daysRemaining ? `Còn ${event.daysRemaining} ngày` : "Không xác định"}
                    </p>
                  </div>
                </div>

                {/* Số lượng bài dự thi */}
                <div className="mt-4 flex items-center space-x-4">
                {/* Icon vô cực */}
                <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-[#5e191a] text-3xl font-bold">
                <span className="text-5xl text-[#5e191a]">∞</span> 
                </div>
                {/* Nội dung văn bản */}
                <div>
                  <p className="text-lg text-[#5e191a]">Số lượng bài dự thi</p>
                  <p className="text-xl font-bold text-[#5e191a]">Không giới hạn</p>
                </div>
              </div>
                <div className="flex justify-center justify-items-center">          
                {/* Nút tham gia */}
                <button
                  className="w-full bg-[#5e191a] font-bold text-base text-[#fcf5e3] py-2 rounded-full hover:bg-red-700 transition mt-4"
                  onClick={() => setModalOpen(true)}
                >
                  Tham gia thử thách
                </button>
                </div>

                <p className="text-sm  text-gray-500 mt-2 text-center">Điều khoản và điều kiện</p>

                {/* Modal */}
                <UploadModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} eventId={event._id} user={user} />
              </div>
            </div>

                {/* Bài dự thi của tôi */}
              <div className="w-full"
              style={{
                backgroundImage: `url('/tet2025/image/background-secondary.png')`, // Không cần process.env.PUBLIC_URL
                backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                backgroundPosition: "top center", // ✅ Căn giữa
                backgroundRepeat: "no-repeat",
                width: "100%", // ✅ Giữ full width
                height: "100%",
                maxWidth: "1920px", // ✅ Giới hạn ngang
                margin: "0 auto", // ✅ Căn giữa khi có max-width
              }}>
              <div className="w-[1360px] mx-auto mt-6 items-center justify-center mb-6">
                <h2 className="text-2xl text-[#b42b23] font-bold text-center mb-6">Bài dự thi của tôi</h2>

                {photos.filter(photo => photo.uploaderId === user?._id).length === 0 ? (
                  // Nếu chưa có bài dự thi
                  <div className="flex justify-center items-center bg-gray-300 w-[720px] h-[340px] mx-auto rounded-lg shadow-md">
                    <p className="text-gray-600 text-lg">Bạn chưa có bài dự thi nào</p>
                  </div>
                ) : (
                  // Nếu đã có bài dự thi (Hiển thị theo hàng, không scroll)
                  <div className="grid grid-cols-5 gap-1">
                    {photos
                      .filter(photo => photo.uploaderId === user?._id)
                      .map((photo) => (
                        <div key={photo._id} className="relative bg-white rounded-lg overflow-hidden shadow-md w-[268px] h-[340px]">
                          {/* Ảnh bài dự thi */}
                          <img src={`${BASE_URL}${photo.url}`} alt={photo.message} className="w-full h-full object-cover" onClick={() => openPhotoReview(photo)}/>
                          {/* Tên ảnh ở góc dưới bên trái */}
                          <div className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg">
                            {photo.title || "Không tiêu đề"}
                          </div>
                          {/* Số lượng tim ở góc trên bên phải */}
                          <div className="absolute top-2 right-2 bg-gray-100 bg-opacity-50 text-white text-sm font-bold px-2 py-1 rounded-full">
                            ❤️ {photo.votes}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>         
            </div> 


              {/* Section: Danh sách bài dự thi */}
            <section className="w-full"
            style={{
              backgroundImage: `url('/tet2025/image/background-primary.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "top center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              maxWidth: "1920px", // ✅ Giới hạn ngang
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
              <div className="w-[1360px] mx-auto mt-8 mb-8 ">
              <h2 className="text-2xl font-bold text-center text-[#fcf5e3] mb-6">Bài dự thi</h2>

              {/* Lưới hiển thị ảnh */}
              <div className="grid grid-cols-5 gap-4">
                {paginatedPhotos.map((photo) => (
                  <div key={photo._id} className="relative w-[270px] h-[338px] rounded-lg overflow-hidden shadow-md cursor-pointer bg-white">
                    
                    {/* Ảnh dự thi */}
                    <img 
                    src={`${BASE_URL}${photo.url}`} alt={photo.title || "Không tiêu đề"} 
                    className="w-full h-full object-cover"
                    onClick={() => openPhotoReview(photo)}
                     />

                    {/* Hiển thị số tim góc trên bên phải */}
                    <div className="absolute top-2 right-2 bg-gray-100 bg-opacity-50 text-white text-sm font-bold px-2 py-1 rounded-full">
                      ❤️ {photo.votes}
                    </div>

                    {/* Tên ảnh góc dưới bên trái */}
                    <div className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg">
                    {photo.title || "Không tiêu đề"}
                    </div>

                  </div>
                ))}
              </div>

              {/* Phân trang */}
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: Math.ceil(photos.length / itemsPerPage) }).map((_, index) => (
                  <button
                    key={index}
                    className={`px-3 py-2 rounded ${
                      currentPage === index + 1 ? "bg-red-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              </div>
            </section>
        
      </div>
      {/* Modal PhotoReview */}
          {isPhotoReviewOpen && selectedPhoto && (
            <PhotoReview
              photoId={selectedPhoto._id}
              onClose={closePhotoReview}
              isOpen={openPhotoReview}
              user={user}
            />
          )}
    </div>
  );
};

export default DetailEvent;