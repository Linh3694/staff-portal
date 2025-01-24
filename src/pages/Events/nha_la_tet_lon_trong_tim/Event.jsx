import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { API_URL, BASE_URL } from "../../../config"; // import từ file config
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHeart, FiMessageSquare,  FiUser,} from "react-icons/fi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import PhotoReview from "./PhotoReview";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Dropdown from "../../../components/function/dropdown"; // HOẶC đường dẫn tương ứng
import PhotoApprovalModal from "./PhotoApprovalModal"

gsap.registerPlugin(ScrollTrigger);



const Event = ({ isEventAuthenticated }) => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("i18n.language");
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Trạng thái đăng nhập
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState("all"); // Mặc định chọn tất cả
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [sortOrder, setSortOrder] = useState("latest"); // Bộ lọc: latest, oldest, myPhotos
  const [searchQuery, setSearchQuery] = useState(""); // Thanh tìm kiếm
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isPhotoReviewOpen, setPhotoReviewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [featuredPhotos, setFeaturedPhotos] = useState([]); // Cho section Bài thi nổi bật
  const [showApprovalModal, setShowApprovalModal] = useState(false); // NEW: state bật/tắt Modal phê duyệt
  

  const handleLogout = () => {
    localStorage.removeItem("user"); // Hoặc removeItem("authToken"), tuỳ cách bạn lưu
    navigate("/auth");
  };

  // Đóng modal
  const handleCloseApprove = () => {
    setShowApprovalModal(false);
  };
  
  // Hàm lấy tên sự kiện theo ngôn ngữ hiện tại
  const getLocalizedEventName = (event) => {
    if (!event || typeof event !== "object") return t("default_event_title"); 
    return i18n.language === "vi" ? event.name || t("default_event_title") : event.nameEng || event.name || t("default_event_title");
  };
  const eventTitle = getLocalizedEventName(currentEvent);
  const eventDescription = currentEvent ? (language === "vi" ? currentEvent.description : currentEvent.descriptionEng) : "No event description available";

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    gsap.utils.toArray(".section").forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []); // ✅ Chạy một lần khi component mount

  const hasCheckedAuth = useRef(false);

useEffect(() => {
  if (hasCheckedAuth.current) return; // ✅ Tránh kiểm tra nhiều lần
  hasCheckedAuth.current = true;

  if (!isEventAuthenticated) {
    toast.error("Bạn cần xác thực trước khi truy cập trang này!");
    navigate("/auth");
    return;
  }

  const userData = localStorage.getItem("user");
  if (userData) {
    setUser(JSON.parse(userData));
  }
}, [isEventAuthenticated]); // ✅ Chỉ chạy khi `isEventAuthenticated` thay đổi
  
const hasFetchedPhotos = useRef(false);

useEffect(() => {
  if (hasFetchedPhotos.current) return; // ✅ Ngăn fetch trùng lặp
  hasFetchedPhotos.current = true;

  const fetchAllPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/photos/leaderboard-all`);
      const data = await response.json();
      if (!data.length) {
        console.warn("⚠ Không có ảnh nào được trả về từ API.");
      }
      setFilteredPhotos(data.flatMap((event) => event.photos)); // ✅ Giữ dữ liệu tối ưu
    } catch (error) {
      console.error("❌ Lỗi khi lấy ảnh từ API:", error);
      toast.error("Không thể tải ảnh dự thi.");
    }
  };

  fetchAllPhotos();
}, []); // ✅ Chạy một lần khi component mount

  

const hasFetchedEvents = useRef(false);

useEffect(() => {
  if (hasFetchedEvents.current) return; // ✅ Ngăn fetch trùng lặp
  hasFetchedEvents.current = true;

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Lỗi khi fetch sự kiện:", error);
    }
  };

  fetchEvents();
}, []); // ✅ Chạy một lần

const currentEventData = useMemo(() => {
  const today = new Date();
  return events.find(event => 
    today >= new Date(event.startDate) && today <= new Date(event.endDate)
  );
}, [events]); // ✅ Chỉ tính toán lại khi `events` thay đổi

useEffect(() => {
  if (currentEventData) {
    setCurrentEvent(currentEventData);
  }
}, [currentEventData]); // ✅ Chỉ chạy nếu `currentEventData` thay đổi

const fetchEventsWithPhotoCounts = async () => {
  try {
    const response = await fetch(`${API_URL}/events`);
    const eventsData = await response.json();

    const eventIds = eventsData.map(event => event._id);
    const photoResponse = await fetch(`${API_URL}/photos/count?eventIds=${eventIds.join(",")}`);
    const photoCounts = await photoResponse.json();

    const eventsWithPhotoCounts = eventsData.map(event => ({
      ...event,
      submissions: photoCounts[event._id] || 0,
    }));

    setEvents(eventsWithPhotoCounts);
  } catch (error) {
    console.error("Lỗi khi fetch sự kiện:", error);
  }
};

useEffect(() => {
  fetchEventsWithPhotoCounts();
}, []);

const prevLeaderboardRef = useRef(null);

useEffect(() => {
  const fetchLeaderboard = async () => {
    try {
      let response;
      if (selectedChallenge === "all") {
        response = await fetch(`${API_URL}/photos/leaderboard-all`);
      } else {
        response = await fetch(`${API_URL}/photos/leaderboard?eventId=${selectedChallenge}`);
      }
      if (!response.ok) throw new Error("Không thể tải danh sách leaderboard.");
      
      const data = await response.json();
      if (JSON.stringify(prevLeaderboardRef.current) !== JSON.stringify(data)) {
        prevLeaderboardRef.current = data; // 🔹 Lưu trạng thái trước đó
        setFeaturedPhotos(
          (selectedChallenge === "all" ? data.flatMap((event) => event.photos) : data)
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi lấy leaderboard:", error);
    }
  };

  fetchLeaderboard();
}, [selectedChallenge]); // ✅ Chỉ chạy khi `selectedChallenge` thay đổi.

  useEffect(() => {
    setFilteredPhotos(getSortedPhotos());
  }, [sortOrder, searchQuery, selectedChallenge]);

  

  // Hàm lọc bài thi theo thử thách
  const filterPhotosByEventId = (eventId) => {
    setSelectedChallenge(eventId);
    if (eventId === "all") {
      setFeaturedPhotos([...filteredPhotos].sort((a, b) => b.votes - a.votes).slice(0, 5));
    } else {
      setFeaturedPhotos(
        filteredPhotos.filter((photo) => photo.eventId === eventId).sort((a, b) => b.votes - a.votes).slice(0, 5)
      );
    }
  };
  
  
  const getSortedPhotos = () => {
    let sortedPhotos = [...filteredPhotos];
      
    if (sortOrder === "votes") {
      sortedPhotos.sort((a, b) => b.votes - a.votes); // Lượt bình chọn nhiều nhất
    } else if (sortOrder === "latest") {
      sortedPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Mới nhất
    } else if (sortOrder === "oldest") {
      sortedPhotos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Cũ nhất
    } else if (sortOrder === "myPhotos") {
      sortedPhotos = sortedPhotos.filter((photo) => photo.uploaderName === user?.fullName); // Chỉ hiển thị ảnh của tôi
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
    return sortedPhotos;
  };

  const paginatedPhotos = getSortedPhotos().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const nextPhoto = () => {
    if (currentPhotoIndex < featuredPhotos.length - 1) {
      setCurrentPhotoIndex((prevIndex) => prevIndex + 1);
    }
  };
  
  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prevIndex) => prevIndex - 1);
    }
  };

  const openPhotoReview = (photo) => {
    setSelectedPhoto(photo);
    setPhotoReviewOpen(true);
    console.log(photo); // Xác minh `photo._id`
  };

  const closePhotoReview = () => {
    setSelectedPhoto(null);
    setPhotoReviewOpen(false);
  };

  const isEventActive = (startDate, endDate) => {
    const today = new Date();
    return today >= new Date(startDate) && today <= new Date(endDate);
  };

  const handleEventClick = (index) => {
    setCurrentEventIndex(index);
    setCurrentEvent(events[index]);
  };

  const normalizeSlug = (slug) => {
    if (!slug || typeof slug !== "string") return "default";
    return slug
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/[^a-zA-Z0-9-]/g, "-") // Chỉ giữ chữ cái, số, dấu -
      .toLowerCase();
  };
  
  const eventSlug = normalizeSlug(currentEvent?.slug || currentEvent?.name || "default");

console.log(eventSlug)

const handleJoinChallenge = () => {
  if (!currentEvent) {
    toast.error(t("error_no_event"));
    return;
  }
  const slug = normalizeSlug(eventTitle);
  navigate(`/event_tet2025/${slug}`, { state: { event: currentEvent } });
};





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
          <div className="items-center flex gap-2">
          <span className="xs:hidden lg:flex xs:text-sm lg:text-base lg:text-left xs:text-right" >{t("wellcome_header")} 
          </span><span className="xs:hidden lg:flex xs:text-sm lg:text-base text-[#401011] font-bold">
              {user?.fullName || "Ẩn danh"}
            </span>
          <span className="lg:hidden xs:text-sm lg:text-base lg:text-left xs:text-right">{t("wellcome_header")}<br/> <span className="xs:text-sm lg:text-base text-[#401011] font-bold">
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
              classNames={"py-2 top-7 lg:-left-[150px] xs:-left-[150px] w-max"}
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

        <div className="flex flex-col justify-center items-center">        
           {/* ------------------------wellcome------------------------------ */}

           {/* Desktop */}
            <section className="lg:flex xs:hidden"
            style={{
              backgroundImage: `url('/tet2025/image/welcome-blank.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
                <div className="flex flex-row mx-auto w-[1390px] h-full items-center justify-center ">
                  <div className="flex flex-col space-y-4 font-semibold text-white text-justify text-md ml-32">
                  <div className="lg:w-[476px]">
                  <p>{t("welcome_banner_01")}</p>
                  </div>
                  <div className="lg:w-[476px]">
                  <p>{t("welcome_banner_02")}</p>
                  </div>
                  <div className="lg:w-[476px]">
                  <p>{t("welcome_banner_03")}</p>
                  </div>
                  </div>
                  <div className="flex h-[400px max-h-[534px] lg:h-[534px]"
                  style={{
                  backgroundImage: `url('/tet2025/image/dragon.png')`, // Không cần process.env.PUBLIC_URL
                  backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                  backgroundPosition: "center", // ✅ Căn giữa
                  backgroundRepeat: "no-repeat",
                  width: "100%", // ✅ Giữ full width
                  margin: "0 auto", // ✅ Căn giữa khi có max-width
                  }}>
                  </div> 
                </div>  
            </section>

            {/* Mobile */}
            <section className="lg:hidden"
            style={{
              backgroundImage: `url('/tet2025/image/welcome-blank.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
            <div className="w-full h-[650px] items-center justify-center">
              <div className="absolute top-10 w-full h-[400px]"
              style={{
              backgroundImage: `url('/tet2025/image/dragon.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "contain", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
              }}>
                  
              </div>
              <div className="absolute top-2/4 w-full p-10 flex-col space-y-4 text-white font-semibold items-center justify-center">
                  <p className="text-justify text-sm">{t("welcome_banner_01")}</p>
                  <p className="text-justify text-sm">{t("welcome_banner_02")}</p>
                  <p className="text-justify text-sm">{t("welcome_banner_03")}</p>
              </div>
            </div>       
            </section>
          {/* ------------------------thử thách hôm nay------------------------------ */}      
           <section 
           style={{
            backgroundImage: `url('/tet2025/image/background-secondary.png')`, // Không cần process.env.PUBLIC_URL
            backgroundSize: "cover", // ✅ Ảnh không bị zoom to
            backgroundPosition: "center", // ✅ Căn giữa
            backgroundRepeat: "no-repeat",
            width: "100%", // ✅ Giữ full widths
            maxWidth: "1920px", // ✅ Giới hạn ngang
            margin: "0 auto", // ✅ Căn giữa khi có max-width
          }}>
              <div className="mx-auto text-[#002147] p-6">
                  {currentEvent && (
                    <section className="
                    lg:max-w-6xl lg:mx-auto lg:px-4
                    xs:full xs:mx-auto xs:px-4 ">
                      <h2 className="text-3xl font-bold mb-6">{t("today_challenges")}</h2>
                      <div className="flex gap-6
                      lg:flex-row lg:justify-center lg:items-center
                      xs:flex-col-reverse xs:items-start">
                      {/* Ảnh sự kiện */}
                          <div className="xs:hidden lg:block w-[550px] h-[405px] flex mb-4">
                              <img
                                  src={`/tet2025/image/events/${eventSlug || "default"}/1.png`} // Hiển thị event.image
                                  alt={currentEvent?.title || "No event image"}
                                  className="w-full h-full object-cover rounded-lg"
                              /> 
                          </div>
                      {/* Thông tin sự kiện */}
                          <div className="
                          lg:w-[550px] lg:h-[405px] items-center justify-center mb-4 lg:ml-4 xs:ml-0
                          xs:w-full ">
                              <div className="flex items-center space-x-4">
                                  <span className="bg-[#F0E9D8] text-md text-[#401011] font-semibold py-2 px-3 rounded">
                                    {t("today_Challenges_còn")}{" "}
                                    {Math.max( 0,
                                    Math.ceil(
                                    (new Date(currentEvent.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}{" "}
                                    {t("today_Challenges_ngày")}
                                  </span>
                                  <span className="bg-[#F0E9D8] text-md text-[#401011] font-semibold py-2 px-3 rounded">
                                    {currentEvent.submissions || 0} {t("today_Challenges_bài_dự_thi")}
                                  </span>
                                </div>
                                  <h2 className="text-2xl font-bold mt-6 italic
                                  xs:hidden
                                  lg:block">
                                    {t("today_Challenges_Challenge")} {currentEvent.number || "Không có tiêu đề"}
                                  </h2>
                                  <h3 className="  text-[#B42B23] font-bold mt-6 
                                  lg:text-3xl lg:mb-6
                                  xs:text-2xl xs:mb-2 ">
                                    {eventTitle || "No Title"}
                                  </h3>
                                    <div className="lg:hidden w-full mb-4 xs:w-full ">
                                        <div className="w-full h-[305px]">
                                            <img
                                              src={`/tet2025/image/events/${eventSlug || "default"}/1.png`} // Hiển thị event.image
                                              alt={currentEvent?.title || "No event image"}
                                              className="w-full h-[305px] object-cover rounded-lg"
                                            />
                                        </div>
                                       
                                    </div>
                                    <div className="mb-4 overflow-hidden
                                    lg:w-[500px] lg:h-[144px]
                                    xs:w-full xs:h-full xs:text-justify">
                                    <p className="text-lg font-semibold text-[#401011]">
                                        {eventDescription || "Không có mô tả"}
                                    </p>
                                  </div>
                                <div className="lg:w-[285px] xs:w-full h-[50px] mt-4">
                                  <button 
                                    className="h-full w-full bg-[#B42B23] text-white text-xl font-bold rounded-full hover:bg-[#E55526] transition"
                                    onClick={handleJoinChallenge}>
                                    {t("today_Challenges_today_Challenges")}
                                  </button>
                                </div>
                          </div>
                       </div>
                    </section>
                  )}
                    {/* Thử thách khác */}

                    <div className=" mx-auto mt-8
                    lg:w-[1100px] lg:gap-6
                    xs:w-full xs:overflow-x-auto xs:whitespace-break-spaces xs:flex xs:gap-8 xs:scrollbar-hide"> 
                    <div className="flex justify-between items-center space-x-4">
                      {events
                        .filter((_, index) => index !== currentEventIndex) // Loại bỏ thử thách hiện tại
                        .map((event) => {
                          const eventSlug = normalizeSlug(event.slug || event.name || "default");
                          return (
                            <div
                              key={event._id}
                              className={`w-[200px] h-[150px] bg-cover bg-center border border-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center p-4 relative ${
                                isEventActive(event.startDate, event.endDate) ? "cursor-pointer" : "opacity-50"
                              }`}
                              style={{
                                backgroundImage: isEventActive(event.startDate, event.endDate)
                                  ? `url(/tet2025/image/events/${eventSlug}/1.png)` // ✅ Dùng slug của từng thử thách
                                  : "none",
                              }}
                              onClick={() =>
                                isEventActive(event.startDate, event.endDate) &&
                                handleEventClick(events.indexOf(event))
                              }
                            >
                              {/* Overlay nếu sự kiện đã qua */}
                              {isEventActive(event.startDate, event.endDate) && (
                                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg"></div>
                              )}

                              {/* Nội dung */}                                        
                              {!isEventActive(event.startDate, event.endDate) ? (
                                <div className="relative text-[#002147] text-center">
                                  <h4 className="text-sm font-bold"> {t("today_Challenges_Challenge")} {event.number || "N/A"}</h4>
                                  <p className="text-gray-200 text-sm mt-2">🔒</p>
                                </div>
                              ) : (
                                <div className="relative text-white text-center">
                                  <h4 className="text-sm font-bold"> {t("today_Challenges_Challenge")} {event.number || "N/A"}</h4>
                                  <p className="text-sm text-white mt-2">{getLocalizedEventName(event) || "Không có tên"}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>   
                </div>        
           </section>
            {/* ------------------------cơ cấu giải thưởng------------------------------ */}      
            <section 
              style={{
                backgroundImage: `url('/tet2025/image/background-primary.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "100%",
                maxWidth: "1920px",
                margin: "0 auto",
                padding: "40px 0",
              }}
            >
              <div className="mx-auto text-center text-white
              lg:w-[1100px]
              xs:w-full">
                {/* Tiêu đề */}
                <h3 className="text-3xl font-bold mb-4">{t("prizes_banner")}</h3>
                <p className="lg:text-lg xs:text-md xs:ml-2 lg:ml-0 font-semibold mb-8">
                {t("prizes_des")}
                </p>

                {/* Danh sách giải thưởng */} 
                <div className="grid lg:grid-cols-3 xs:grid-cols-2 lg:gap-10 xs:gap-2 justify-center">
                  {[
                    { title: "Nhà Sạch - Xuân Xanh", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/1.png" },
                    { title: "Giao Thừa - Đoàn Viên", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/2.png" },
                    { title: "Chúc Lành - Xuân Sang", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/3.png" },
                    { title: "Hương Xuân - Vị Tết", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/4.png" },
                    { title: "Khởi bút - Đón xuân", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/5.png" },
                    { title: "Hương Tết - Dấu Xuân", prize: "01 Voucher Got it 500k", img: "/tet2025/image/prizes/6.png" },
                  ].map((award, index) => (
                    <div key={index} className="flex flex-col items-center">
                      {/* Hình ảnh giải thưởng */}
                      <div className="relative lg:w-[180px] lg:h-[180px] xs:w-[140px] xs:h-[120px] lg:mb-4 xs:mb-0">
                          {/* Vòng tròn ở phía sau */}
                          <div className="absolute left-4 lg:w-[140px] lg:h-[140px] xs:w-[100px] xs:h-[100px] inset-0 rounded-full bg-white bg-opacity-70 z-0" />
                          
                          {/* Ảnh ở phía trên (z-10) */}
                          <img
                            src={award.img}
                            alt={award.title}
                            className="relative z-10 w-full h-full object-contain"
                          />
                        </div>
                      <p className="lg:text-xl xs:text-md font-bold text-white">{award.title}</p>
                      <p className="lg:text-xl xs:text-md  text-white xs:mb-2 lg:mb-0">{award.prize}</p>
                    </div>
                  ))}
                </div>

                {/* Điều khoản giải thưởng */}
                
              </div>
            </section>    

            {/* ------------------------Bài thi nổi bật------------------------------ */}      
            <section 
              style={{
                backgroundImage: `url('/tet2025/image/background-secondary.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "100%",
                maxWidth: "1920px",
                margin: "0 auto",
              }}
            >
              <div className="lg:w-[1100px] xs:w-full mx-auto p-6 text-center">
                <h3 className="text-3xl font-bold mb-6 text-[#002147]"> {t("featured_submissions")}</h3>
                {/* Tabs chọn thử thách */}
                {/* Hiển thị button trên 2XL, LG, XL */}
                <div className="hidden lg:flex lg:justify-center space-x-2 mb-8">
                  <button
                    className={`rounded-md font-bold
                      lg:px-4 lg:py-2 lg:text-base
                      ${selectedChallenge === "all" ? "bg-[#b42b23] text-white" : " text-gray-800"}`}
                    onClick={() => filterPhotosByEventId("all")}
                  >
                    {t("featured_submissions_all")}
                  </button>

                  {events.map((event) => (
                    <button
                      key={event._id}
                      className={`rounded-md font-bold
                        lg:px-4 lg:py-2 lg:text-base
                        ${selectedChallenge === event._id ? "bg-[#b42b23] text-white" : " text-gray-800"}`}
                      onClick={() => filterPhotosByEventId(event._id)}
                    >
                      {t("featured_submissions_Challenge")} {event.number}
                    </button>
                  ))}
                </div>

                {/* Hiển thị select trên XS, SM, MD */}
                <div className="lg:hidden flex justify-center mb-6">
                  <select
                    className="border border-gray-300 rounded-md py-2 px-3 bg-white text-gray-800 w-full xs:w-3/4 sm:w-1/2"
                    value={selectedChallenge}
                    onChange={(e) => filterPhotosByEventId(e.target.value)}
                  >
                    <option value="all">{t("featured_submissions_Challenge_all")}</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {t("featured_submissions_Challenge")} {event.number}
                      </option>
                    ))}
                  </select>
                </div>

                 {/* Nội dung bài thi nổi bật */}
                 {featuredPhotos.length > 0 ? (
                    <div className="flex
                      lg:flex-row lg:justify-center lg:items-center lg:space-x-2 lg:gap-2
                      xs:flex-col xs:items-center xs:gap-4 xs:w-full xs:relative">
                      {/* Nút chuyển ảnh trái */}
                      <button 
                        onClick={prevPhoto} 
                        className={`xs:hidden lg:block p-3 rounded-full text-[#757575] ${currentPhotoIndex === 0 ? "bg-gray-300 cursor-not-allowed opacity-50" : "bg-gray-300 hover:bg-gray-400"}`}
                        disabled={currentPhotoIndex === 0}
                      >
                        <FaArrowLeft size={20} />
                      </button>

                      {/* Ảnh bài thi */}
                      <div className="xs:flex xs:items-center xs:justify-center xs:w-full xs:gap-4">
                        {/* Nút Prev */}
                        <button 
                          onClick={prevPhoto} 
                          className="lg:hidden xs:block p-3 rounded-full text-[#757575] bg-[#d2d2d2] bg-opacity-40 hover:bg-gray-400"
                        >
                          <FaArrowLeft size={20} />
                        </button>

                        {/* Ảnh */}
                        
                        <div className="relative cursor-pointer 
                          lg:w-[400px] lg:h-[540px]
                          xs:w-[220px] xs:h-[300px]"
                          onClick={() => openPhotoReview(featuredPhotos[currentPhotoIndex])}>
                          <img
                            src={`${BASE_URL}${featuredPhotos[currentPhotoIndex]?.url}`}
                            alt={featuredPhotos[currentPhotoIndex]?.title}
                            className="w-full h-full object-cover rounded-lg shadow-md"
                            onError={(e) => console.error("Lỗi load ảnh:", e.target.src)}
                          />
                          <div className="xs:block lg:hidden">
                          <span className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tr-lg">
                            <span className="font-semibold text-sm text-left">  {featuredPhotos[currentPhotoIndex]?.title}</span> <br/>
                            </span>
                          </div>
                        </div>

                        {/* Nút Next */}
                        <button 
                          onClick={nextPhoto} 
                          className="lg:hidden xs:block p-3 text-[#757575] rounded-full bg-gray-300 hover:bg-gray-400"
                        >
                          <FaArrowRight size={20} />
                        </button>
                      </div>

                      {/* Nội dung bên phải ảnh */}
                      <div className="flex flex-col w-full 
                          lg:w-[500px] lg:h-[540px] 
                          xs:w-full xs:items-center xs:text-center">
                            {/* Thông tin ảnh */}
                            <div className="lg:w-[400px] xs:w-3/4">
                            <h3 className="truncate-title xs:hidden lg:block text-[#b42b23] lg:text-3xl xs:text-2xl font-bold lg:text-left xs:text-left lg:mb-4">
                              {featuredPhotos[currentPhotoIndex]?.title}
                            </h3>
                              <p className="xs:hidden lg:block italic text-[#401011] lg:text-xl xs:text-md font-semibold mt-2 lg:text-left xs:text-left xs:mb-4 lg:mb-8">
                                {featuredPhotos[currentPhotoIndex]?.uploaderName}
                              </p>
                              <p className="lg:hidden xs:block italic text-[#401011] lg:text-xl xs:text-md font-semibold mt-2 lg:text-left xs:text-left xs:mb-4 lg:mb-8 ">
                                Tác giả: {featuredPhotos[currentPhotoIndex]?.uploaderName}
                              </p>

                              {/* Mô tả */}
                              <div className="w-full xs:font-semibold lg:text-xl bg-[#ffffff] bg-opacity-50 p-2 rounded-xl leading-relaxed text-gray-600 lg:text-justify  xs:text-justify lg:mb-8 
                                truncate-text">
                                <p>{featuredPhotos[currentPhotoIndex]?.message}</p>
                              </div>

                              {/* Votes & Comments */}
                              <div className="flex lg:flex-row xs:flex-row xs:items-center xs:gap-2 space-x-6 mt-4">
                                <span className="flex items-center space-x-2 text-[#b42b23] font-semibold">
                                  <FiHeart size={28} />
                                  <span className="text-2xl">{featuredPhotos[currentPhotoIndex]?.votes}</span>
                                </span>
                                <span className="flex items-center space-x-2 text-gray-700 font-semibold">
                                  <FiMessageSquare size={28} />
                                  <span className="text-2xl">{featuredPhotos[currentPhotoIndex]?.comments?.length || 0}</span>
                                </span>
                              </div>
                            </div>
                            </div>
                      {/* Nút chuyển ảnh phải */}
                        <button 
                          onClick={nextPhoto} 
                          className={`xs:hidden lg:block p-3 rounded-full text-[#757575] ${currentPhotoIndex === featuredPhotos.length - 1 ? "bg-gray-300 cursor-not-allowed opacity-50" : "bg-[#d2d2d2] bg-opacity-40"}`}
                          disabled={currentPhotoIndex === featuredPhotos.length - 1}
                        >
                          <FaArrowRight size={20} />
                        </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-lg mt-6">Không có bài thi nào cho thử thách này.</p>
                  )}
              </div>
            </section>

            {/* ------------------------Bài dự thi------------------------------ */}
            <section 
              style={{
                backgroundImage: `url('/tet2025/image/submission.png')`, // Không cần process.env.PUBLIC_URL
                backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                backgroundPosition: "center", // ✅ Căn giữa
                backgroundRepeat: "no-repeat",
                width: "100%", // ✅ Giữ full width
                maxWidth: "1920px", // ✅ Giới hạn ngang
                margin: "0 auto", // ✅ Căn giữa khi có max-width
              }}
            >
              <div className="mx-auto mt-6 items-center justify-center mb-6">
                <h2 className="text-3xl text-[#002855] font-bold text-center mb-6">{t("submissions")}</h2>

                {/* Bộ lọc sắp xếp & tìm kiếm */}
                <div className="flex mx-auto items-center justify-between mb-4
                lg:w-[1390px]
                xs:w-full
                ">
                  {/* Bộ lọc sắp xếp */}
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-[#002855]">{t("submissions_filtered")}:</span>
                      <select
                        className="border px-3 py-2 rounded-md bg-white text-gray-800"
                        value={sortOrder}
                        onChange={(e) => {
                          console.log("📌 Đã chọn bộ lọc:", e.target.value);
                          setSortOrder(e.target.value);
                        }}
                      >
                        <option value="votes">{t("submissions_filtered_votes")}</option>
                        <option value="latest">{t("submissions_filtered_Newest")}</option>
                        <option value="oldest">{t("submissions_filtered_Oldest")}</option>
                        <option value="myPhotos">{t("submissions_filtered_My_Submission")}</option>
                      </select>
                    </div>
                </div>

                {/* Lưới hiển thị ảnh */}
                  <div className="
                  lg:w-[1390px] lg:mx-auto lg:grid lg:grid-cols-5 lg:gap-5
                  xs:w-full xs:mx-auto xs:flex xs:flex-wrap xs:gap-2">
                    {paginatedPhotos.map((photo) => (
                      <div key={photo._id} className="relative rounded-lg overflow-hidden shadow-md cursor-pointer bg-white
                      lg:basis-0 lg:max-w-[270px] lg:h-[338px] lg:mx-0
                      xs:basis-1/3 xs:max-w-[110px] xs:h-[120px] xs:mx-auto
                      ">
                        
                        {/* Ảnh dự thi */}
                        <img 
                          src={`${BASE_URL}${photo.url}`} 
                          alt={photo.title || "Không tiêu đề"} 
                          className="w-full h-full object-cover"
                          onClick={() => openPhotoReview(photo)}
                        />
                        
                        {/* Hiển thị số tim góc trên bên phải */}
                        <div className="absolute flex-row top-2 right-2 bg-white bg-opacity-60 text-[#B42B23] text-md font-semibold px-3 py-1 rounded-full">
                          <div className="flex flex-row gap-1 items-center justify-center font-bold"><FiHeart size={20} /> <span>{photo.votes}</span></div>
                        </div>

                        {/* Tên ảnh góc dưới bên trái */}
                        <div className="xs:hidden lg:absolute bottom-2 left-2 text-white text-base px-2 py-1 rounded-tr-lg">
                          {photo.title || "Không tiêu đề"}
                        </div>

                      </div>
                    ))}
                  </div>

                {/* Phân trang */}
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: Math.ceil(filteredPhotos.length / itemsPerPage) }).map((_, index) => (
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
            {/* ------------------------Lời kết------------------------------ */}      
            {/* Mobile */}
              <div 
                className="xs:block lg:hidden"
                style={{
                  backgroundImage: `url('/tet2025/image/end-mobile.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "100%",
                  maxWidth: "1920px",
                  margin: "0 auto",
                }}
              >
                <div className="flex items-center justify-center h-[400px] w-[305px] mx-auto px-10 text-center font-semibold text-xs text-[#401011]">
                  {t("ending")}
                </div>
              </div>

              {/* Desktop */}
              <div 
                className="lg:flex xs:hidden"
                style={{
                  backgroundImage: `url('/tet2025/image/end-web.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "100%",
                  maxWidth: "1920px",
                  margin: "0 auto",
                }}
              >
                <div className="flex flex-col items-center justify-center h-[546px] w-[913px] mx-auto px-6 text-center font-bold text-2xl text-[#401011]">
                  {t("ending")}
                </div>
              </div>



            {/* ------------------------Footer------------------------------ */}
            <div 
            className="lg:flex xs:hidden"
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
            xs:w-full xs:h-[130px]
            ">

            </div>       
            </div>
            {/* Mobile */}
            <div 
            className="xs:block lg:hidden"
            style={{
              backgroundImage: `url('/Footer_mobile.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
            <div className="w-full h-[270px]">

            </div>       
            </div>
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
        {showApprovalModal && <PhotoApprovalModal onClose={handleCloseApprove} />}
    </div>
    
  );
};

export default Event;