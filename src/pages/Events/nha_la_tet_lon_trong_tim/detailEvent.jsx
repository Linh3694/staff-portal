import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API_URL, BASE_URL } from "../../../config";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import UploadModal from "./uploadModal";
import PhotoReview from "./PhotoReview";
import { FiLogOut, FiArrowLeft, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Dropdown from "../../../components/function/dropdown"; // HOẶC đường dẫn tương ứng
import PhotoApprovalModal from "./PhotoApprovalModal"
import { useSearchParams } from "react-router-dom";


const DetailEvent = () => {
  const { t, i18n } = useTranslation();
  const { state } = useLocation(); // Lấy dữ liệu từ navigate
  const { slug } = useParams(); // Lấy slug từ URL
  const [searchParams, setSearchParams] = useSearchParams();
  const photoIdFromURL = searchParams.get("photoId"); // Lấy từ query param
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
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [sortOrder, setSortOrder] = useState("votes"); // Bộ lọc: votes, latest, oldest
  const [searchQuery, setSearchQuery] = useState(""); // Thanh tìm kiếm
  const [showApprovalModal, setShowApprovalModal] = useState(false); // NEW: state bật/tắt Modal phê duyệt

  const handleLogout = () => {
    localStorage.removeItem("user"); // Hoặc removeItem("authToken"), tuỳ cách bạn lưu
    navigate("/auth");
  };

  // Mở modal phê duyệt
  const handleOpenApprove = () => {
    // Chỉ cho admin
    if (user?.role === "admin") {
      setShowApprovalModal(true);
    } else {
      toast.error("Bạn không có quyền phê duyệt ảnh!");
    }
  };

  // Đóng modal
  const handleCloseApprove = () => {
    setShowApprovalModal(false);
  };

  const getLocalizedEventName = (event) => {
    if (!event || typeof event !== "object") return t("default_event_title"); 
    return i18n.language === "vi" ? event.name || t("default_event_title") : event.nameEng || event.name || t("default_event_title");
  };
  const getLocalizedEventDescription = (event) => {
    if (!event || typeof event !== "object") return "No event description"; 
    return i18n.language === "vi" ? event.description || "No event description" : event.descriptionEng || event.description || "No event description";
  };
  const eventTitle = getLocalizedEventName(event);
  const eventDescription = getLocalizedEventDescription(event);

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);
  const paginatedPhotos = filteredPhotos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // Fetch sự kiện nếu không có dữ liệu từ state

  useEffect(() => {
    if (photos.length > 0) {
      photos.forEach((photo) => {
        const img = new Image();
        img.src = `${BASE_URL}${photo.url}`;
      });
    }
  }, [photos]);

  useEffect(() => {
    if (!event) {
      const fetchEvent = async () => {
        try {
          const res = await fetch(`${API_URL}/events?slug=${slug}`);
          if (!res.ok) throw new Error("Không thể tải thông tin sự kiện.");
          const data = await res.json();
          
          // Nếu API trả về mảng => lấy phần tử đầu
          if (Array.isArray(data) && data.length > 0) {
            setEvent(data[0]); 
          } else {
            setEvent(null); // không tìm thấy => hiển thị "Không có sự kiện"
          }
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
      if (leaderboard?.length > 0) {
        leaderboard.forEach((photo) => {
          const img = new Image();
          img.src = `${BASE_URL}${photo.url}`;
        });
      }  
      fetchLeaderboard();
    }
  }, [event] [leaderboard]);

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

  useEffect(() => {
    if (photos.length > 0) {
      let sortedPhotos = photos.filter((photo) => photo.eventId === event?._id);
  
      // Sắp xếp ảnh dựa trên lựa chọn bộ lọc
      if (sortOrder === "votes") {
        sortedPhotos.sort((a, b) => b.votes - a.votes);
      } else if (sortOrder === "latest") {
        sortedPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortOrder === "oldest") {
        sortedPhotos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
  
      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim() !== "") {
        sortedPhotos = sortedPhotos.filter(
          (photo) =>
            photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            photo.uploaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            photo._id.includes(searchQuery)
        );
      }
      if (JSON.stringify(sortedPhotos) !== JSON.stringify(filteredPhotos)) {
        setFilteredPhotos(sortedPhotos);
      }
      
    }
  }, [photos, sortOrder, searchQuery, event]);

  useEffect(() => {
    if (photoIdFromURL) {
      // Tìm (hoặc fetch) photo tương ứng
      const foundPhoto = photos.find((p) => p._id === photoIdFromURL);
      if (foundPhoto) {
        setSelectedPhoto(foundPhoto);
        setPhotoReviewOpen(true);
      } else {
        // Trường hợp photo chưa sẵn trong state => fetch 1 ảnh
        fetch(`${API_URL}/photos/${photoIdFromURL}`)
          .then((res) => res.json())
          .then((photo) => {
            setSelectedPhoto(photo);
            setPhotoReviewOpen(true);
          })
          .catch((err) => {
            console.error("Không thể load ảnh:", err);
            toast.error("Không thể tải ảnh!");
          });
      }
    } else {
      // Không có photoId => đóng modal
      setSelectedPhoto(null);
      setPhotoReviewOpen(false);
    }
  }, [photoIdFromURL, photos]);


  const openPhotoReview = (photo) => {
    setSearchParams({ photoId: photo._id });

  };

  const closePhotoReview = () => {
    searchParams.delete("photoId");
    setSearchParams(searchParams);
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

          {/* Khu vực User + Switch language */}
          <div className="items-center flex gap-4">
          <span className="xs:hidden lg:flex xs:text-sm lg:text-base lg:text-left xs:text-right">{t("wellcome_header")}, <span className="xs:text-sm lg:text-base text-[#401011] font-bold">
              {user?.fullName || "Ẩn danh"}
            </span>
          </span>
          <span className="lg:hidden xs:text-sm lg:text-base lg:text-left xs:text-right">{t("wellcome_header")},<br/> <span className="xs:text-sm lg:text-base text-[#401011] font-bold">
              {user?.fullName || "Ẩn danh"}
            </span>
          </span>
            {/* --- Dropdown User --- // NEW */}
            <Dropdown
              button={
                // Bạn có thể thay icon FiUser bằng ảnh đại diện nếu muốn
                <div className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-[#E55526] text-white">
                  <FiUser size={20} />
                </div>
              }
              animation="origin-top-right md:origin-top-right transition-all duration-300 ease-in-out"
              classNames={"py-2 top-7 -left-[150px] w-max"}
              children={
                <div className="flex flex-col w-40 rounded-[10px] bg-[#f8f8f8] shadow-xl shadow-shadow-500">
                  {/* Nếu là admin, hiển thị thêm nút "Phê duyệt" */}
                  {user?.role === "superadmin" && (
                    <>
                    <button
                      onClick={() => navigate("/event-management")} // ✅ Chuyển hướng đến trang quản lý sự kiện
                      className="text-sm font-medium text-[#002147] hover:bg-gray-100 px-3 py-2 text-left"
                    >
                      Quản lý sự kiện
                    </button>
                    <button
                      onClick={handleOpenApprove}
                      className="text-sm font-medium text-[#002147] hover:bg-gray-100 px-3 py-2 text-left"
                    >
                      Phê duyệt
                    </button>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 hover:bg-gray-100 px-3 py-2 text-left"
                  >
                    Đăng xuất
                  </button>
                </div>
              }
            />
            
            {/* Nút đổi ngôn ngữ */}
            <button
              onClick={() => {
                const newLang = language === "vi" ? "en" : "vi";
                i18n.changeLanguage(newLang);
                setLanguage(newLang);
              }}
              className="lg:w-10 xs:w-10 lg:h-10 xs:h-10 border border-white rounded-full transition-transform transform hover:scale-105"
            >
              <img
                src={`/tet2025/icons/flag-${language}.png`}
                alt={language === "vi" ? "Tiếng Việt" : "English"}
                className="w-full h-full rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>
  
      {/* Nội dung chính */}
      <div
        className="flex flex-col justify-center items-center"
        style={{
          backgroundImage: `url('/tet2025/image/detail01.png')`, // Không cần process.env.PUBLIC_URL
          backgroundSize: "cover", // ✅ Ảnh không bị zoom to
          backgroundPosition: "top center", // ✅ Căn giữa
          backgroundRepeat: "no-repeat",
          width: "100%", // ✅ Giữ full width
          maxWidth: "1920px", // ✅ Giới hạn ngang
          margin: "0 auto", // ✅ Căn giữa khi có max-width
        }}
      >
        <div className="lg:w-[1390px] xs:w-full">
          {/* Nút Quay về */}
          <div className="mt-8 mb-3 lg:ml-0 xs:ml-4 ">
            <button
              onClick={() => navigate("/event")}
              className="text-[#fcf5e3] text-lg font-semibold flex items-center gap-2 cursor-pointer hover:text-[#ffcc00] transition"
            >
              <span><FiArrowLeft /></span> <span className="lg:text-lg xs:text-sm">{t("back_to_menu")}</span>
            </button>
          </div>

          <h1 className="lg:text-3xl xs:text-2xl xs:ml-4 lg:ml-0 text-[#fcf5e3] font-bold mb-8 text-left">{eventTitle}</h1>
          {/* Hình ảnh */}
          {/* Phần Hình ảnh */}
          <div className ="text-lg font-bold mb-4">
          </div>
          {/* Hiển thị top 4 ảnh dự thi */}
            <div className="xs:hidden lg:flex mb-8 flex justify-between items-center gap-[10px]">
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
                      className={`relative flex border-2 border-[#fcf5e3] overflow-hidden overflow-x-auto whitespace-nowrap rounded-2xl shadow-xl transition-all duration-300 will-change-transform ${
                        hoveredIndex === index ? "w-[340px] h-[405px]" : "w-[340px] h-[405px]"
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
                        width="550"
                        height="338"
                      />
                      <p className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg 
                        w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
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

          {/* Phiên bản Mobile (Hiển thị dạng trượt ngang) */}
          <div className="lg:hidden xs:overflow-x-scroll xs:flex xs:space-x-4 xs:w-full px-4">
            {leaderboard?.sort((a, b) => b.votes - a.votes).slice(0, 4).map((photo, index) => (
              <div
                key={photo._id}
                className="relative border-2 border-[#fcf5e3] overflow-hidden rounded-2xl shadow-xl transition-all duration-300
                xs:flex-shrink-0 xs:w-[60vw] xs:h-[200px]"
                onClick={() => openPhotoReview(photo)}
              >
                {/* Số lượng tim */}
                <div className="absolute top-2 right-2 bg-gray-100 bg-opacity-50 text-white text-sm font-bold px-2 py-1 rounded-full">
                  ❤️ {photo.votes}
                </div>
                <img
                  src={`${BASE_URL}${photo.url}`}
                  alt={photo.title || "Không tiêu đề"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg 
                          w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
                          {photo.title || "Không tiêu đề"}
                        </div>
              </div>
            ))}
          </div>
          </div>
            <div className="lg:w-[1100px] xs:w-full mx-auto lg:grid lg:grid-cols-2 lg:gap-6 xs:flex xs:flex-col lg:mt-8 mb-8">
              {/* Cột trái - Nội dung thử thách */}
              <div className="lg:w-[650px] xs:w-full p-4 ">
                <h2 className="lg:text-2xl xs:text-xl text-[#fcf5e3] font-bold mb-4">{t("today_challanges_challange")} {event.number}</h2>
                <p className="lg:text-xl xs:text-lg text-[#fcf5e3] mb-2">{eventDescription || "Không có mô tả"}</p>

                {/* Người tham gia */}
                <div className="mt-4">
                  <h3 className="text-lg text-[#fcf5e3] font-bold mb-1">{t("Participants")}</h3>
                  <p className="text-lg text-[#fcf5e3] rounded">
                    {photos.length > 0
                      ? `${photos[0]?.uploaderName || "Ẩn danh"} ${t("Participants_and")} ${
                          photos.length - 1
                        } ${t("Participants_count")}.`
                      : "Chưa có bài dự thi nào."}
                  </p>
                </div>
              </div>

              {/* Cột phải - Thông tin chính */}
              <div className="lg:w-[400px] xs:max-w-[500px] xs:w-[375px] lg:ml-28 xs:mx-auto lg:mx-0   bg-[#fcf5e3] border p-6 rounded-lg shadow-md flex flex-col justify-between">
                <h2 className="text-xl font-bold mb-4">{t("Info")}</h2>

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
                    <p className="text-lg text-[#5e191a]">{t("Info_deadline")}</p>
                    <p className="text-xl font-bold text-[#5e191a]">
                      {event?.daysRemaining ? `${t("Info_deadline_còn")} ${event.daysRemaining} ${t("Info_deadline_ngày")}` : "Không xác định"}
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
                  <p className="text-lg text-[#5e191a]">{t("Info_number_submission")}</p>
                  <p className="text-xl font-bold text-[#5e191a]">{t("Info_number_submission_unlimited")}</p>
                </div>
              </div>
                <div className="flex justify-center justify-items-center">          
                {/* Nút tham gia */}
                <button
                  className="w-full bg-[#5e191a] font-bold text-base text-[#fcf5e3] py-2 rounded-full hover:bg-red-700 transition mt-4"
                  onClick={() => setModalOpen(true)}
                >
                  {t("today_challanges_today_challanges")}
                </button>
                </div>

                <p className="text-sm  text-gray-500 mt-2 text-center">{t("Info_number_submission_term")}</p>

                {/* Modal */}
                <UploadModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} eventId={event._id} user={user} />
              </div>
            </div>
            </div>


                {/* ------------------------Bài dự thi của tôi------------------------------ */}
            <section className="w-full"
              style={{
                backgroundImage: `url('/tet2025/image/background-secondary.png')`, // Không cần process.env.PUBLIC_URL
                backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                backgroundPosition: "top center", // ✅ Căn giữa
                backgroundRepeat: "no-repeat",
                width: "100%", // ✅ Giữ full width
                maxWidth: "1920px", // ✅ Giới hạn ngang
                margin: "0 auto", // ✅ Căn giữa khi có max-width
              }}>
              <div className="lg:w-[1360px] xs:w-full mx-auto items-center justify-center p-4">
                <h2 className="text-2xl text-[#b42b23] font-bold text-center mb-6">{t("my_submission")}</h2>
                {photos.filter(photo => photo.uploaderId === user?._id).length === 0 ? (
                  // Nếu chưa có bài dự thi
                  <div className="flex justify-center items-center bg-gray-300 lg:w-[720px] lg:h-[340px] xs:w-[340px] h-[170px] mx-auto rounded-lg shadow-md">
                    <p className="text-gray-600 text-lg">{t("my_submission_empty")}</p>
                  </div>
                ) : (
                  // Nếu đã có bài dự thi (Hiển thị theo hàng, không scroll)
                  <div className="justify-center items-center mx-auto lg:grid lg:grid-cols-5 lg:gap-4 xs:flex xs:flex-wrap xs:gap-4">
                    {photos
                      .filter(photo => photo.uploaderId === user?._id)
                      .map((photo) => (
                        <div key={photo._id} className="relative bg-white rounded-lg overflow-hidden shadow-md lg:max-w-[260px] lg:w-[260px] lg:h-[340px] xs:basis-1/3 xs:max-w-[110px] xs:h-[170px] xs:mx-auto">
                          {/* Ảnh bài dự thi */}
                          <img src={`${BASE_URL}${photo.url}`} alt={photo.message} className="w-full h-full object-cover" onClick={() => openPhotoReview(photo)}/>
                          {/* Tên ảnh ở góc dưới bên trái */}
                          <div className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg 
                          w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
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
            </section> 


              {/* ------------------------Bài dự thi của sự kiện------------------------------ */}
          <section
            style={{
              backgroundImage: `url('/tet2025/image/background-primary.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              width: "100%",
              maxWidth: "1920px",
              margin: "0 auto",
            }}
          >
            <div className="w-full mx-auto items-center justify-center p-6">
              <h2 className="text-2xl text-[#fcf5e3] font-bold text-center mb-6">{t("submissions")}</h2>

              {/* Bộ lọc sắp xếp & tìm kiếm */}
              <div className="flex mx-auto items-center justify-between mb-4 lg:w-[1390px] xs:w-full">
                {/* Bộ lọc sắp xếp */}
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-white lg:ml-0 xs:ml-4">{t("submissions_filtered")}</span>
                  <select
                    className="border rounded-lg bg-white text-gray-800"
                    value={sortOrder}
                    onChange={(e) => {
                      console.log("📌 Đã chọn bộ lọc:", e.target.value);
                      setSortOrder(e.target.value);
                    }}
                  >
                    <option value="votes">{t("submissions_filtered_votes")}</option>
                    <option value="latest">{t("submissions_filtered_Newest")}</option>
                    <option value="oldest">{t("submissions_filtered_Oldest")}</option>
                  </select>
                </div>
              </div>

              {/* Lưới hiển thị ảnh */}
              <div className="lg:w-[1390px] lg:mx-auto lg:grid lg:grid-cols-5 lg:gap-5 xs:w-full xs:mx-auto xs:flex xs:flex-wrap xs:gap-2 xs:ml-2 justify-center items-center">
                {paginatedPhotos.length > 0 ? (
                  paginatedPhotos.map((photo) => (
                    <div key={photo._id} className="relative rounded-lg overflow-hidden shadow-md cursor-pointer bg-white
                      lg:max-w-[260px] lg:w-[260px] lg:h-[340px] xs:basis-1/3 xs:max-w-[110px] xs:h-[170px] xs:mx-auto"
                      onClick={() => openPhotoReview(photo)}
                    >
                      {/* Ảnh dự thi */}
                      <img
                        key={photo._id}
                        src={BASE_URL + photo.url}
                        alt={photo.title}
                        onClick={() => openPhotoReview(photo)}
                      />
                      
                      {/* Hiển thị số tim góc trên bên phải */}
                      <div className="absolute top-2 right-2 bg-gray-100 bg-opacity-50 text-white text-sm font-bold px-2 py-1 rounded-full">
                        ❤️ {photo.votes}
                      </div>

                      {/* Tên ảnh góc dưới bên trái */}
                        <div className="absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg 
                          w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
                          {photo.title || "Không tiêu đề"}
                        </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-white text-lg"></p>
                )}
              </div>

              {/* Phân trang */}
              {filteredPhotos.length > itemsPerPage && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: Math.ceil(filteredPhotos.length / itemsPerPage) }).map((_, index) => (
                    <button
                      key={index}
                      className={`px-3 py-2 rounded ${currentPage === index + 1 ? "bg-red-500 text-white" : "bg-gray-200"}`}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>       
          </section>
            {/* ------------------------Footer------------------------------ */}
            <section className="section"
            style={{
              backgroundImage: `url('/Footer.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
            <div className="mx-auto p-6 
            lg:w-[1920px] lg:h-[350px]
            xs:w-full xs:h-[240px]
            ">

            </div>       
            </section>
        
      
      {/* Modal PhotoReview */}
          {isPhotoReviewOpen && selectedPhoto && (
            <PhotoReview
              photoId={selectedPhoto._id}
              photoData={selectedPhoto}
              onClose={closePhotoReview}
              isOpen={openPhotoReview}
              user={user}
            />
          )}
                  {showApprovalModal && <PhotoApprovalModal onClose={handleCloseApprove} />}

    </div>
  );
};

export default DetailEvent;