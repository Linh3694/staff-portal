import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import i18n from "../../../i18n"; // Đảm bảo bạn đã cấu hình i18n như hướng dẫn trước đó.
import { API_URL, BASE_URL } from "../../../config"; // import từ file config
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHeart, FiMessageSquare  } from "react-icons/fi";
import { FaHeart, FaComment, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import PhotoReview from "./PhotoReview";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);




const Event = ({ isEventAuthenticated }) => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState("vi");
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
  }, []);

  useEffect(() => {
    if (!isEventAuthenticated) {
      toast.error("Bạn cần xác thực trước khi truy cập trang này!");
      navigate("/auth");
      return;
    }
  
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
  
      // Debug để kiểm tra dữ liệu người dùng
    }
  }, [isEventAuthenticated, navigate]);
  
  useEffect(() => {
    const fetchAllPhotos = async () => {
      try {
        const response = await fetch(`${API_URL}/photos/leaderboard-all`);
        const data = await response.json();
        console.log("📸 Dữ liệu ảnh từ tất cả thử thách:", data);
  
        if (!data.length) {
          console.warn("⚠ Không có ảnh nào được trả về từ API.");
        }
  
        // Gộp ảnh từ tất cả thử thách
        const allPhotos = data.flatMap((event) => event.photos);
        setFilteredPhotos(allPhotos);
      } catch (error) {
        console.error("❌ Lỗi khi lấy ảnh từ API:", error);
        toast.error("Không thể tải ảnh dự thi.");
      }
    };
  
    fetchAllPhotos();
  }, []);

  

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/events`);
        const text = await response.text(); // Lấy phản hồi dưới dạng văn bản
        const data = JSON.parse(text); // Chuyển đổi thành JSON
        setEvents(data);
      } catch (error) {
      }
    };
  
    fetchEvents();
  }, []);

  useEffect(() => {
    // Xác định sự kiện hiện tại dựa trên ngày
    const today = new Date();
    const currentIndex = events.findIndex(
      (event) => today >= new Date(event.startDate) && today <= new Date(event.endDate)
    );
  
    if (currentIndex !== -1) {
      setCurrentEvent(events[currentIndex]);
      setCurrentEventIndex(currentIndex);
    }
  }, [events]);

  useEffect(() => {
    const fetchEventsWithPhotoCounts = async () => {
      try {
        const response = await fetch(`${API_URL}/events`);
        const eventsData = await response.json();
  
        const eventsWithPhotoCounts = await Promise.all(
          eventsData.map(async (event) => {
            const photoResponse = await fetch(`${API_URL}/photos?eventId=${event._id}`);
            const photos = await photoResponse.json();
            console.log("Ảnh dự thi từ API:", photos); // Kiểm tra dữ liệu API
            return { ...event, submissions: photos.length }; // Thêm submissions = số ảnh
          })
        );
  
        setEvents(eventsWithPhotoCounts);
      } catch (error) {
        console.error("Lỗi khi fetch sự kiện:", error);
      }
    };
  
    fetchEventsWithPhotoCounts();
  }, []);

  useEffect(() => {
    if (selectedChallenge === "all") { 
      const fetchAllLeaderboard = async () => {
        try {
          const response = await fetch(`${API_URL}/photos/leaderboard-all`);
          if (!response.ok) throw new Error("Không thể tải danh sách leaderboard.");
          const data = await response.json();
          console.log("📊 Leaderboard tất cả thử thách ALL:", data);
  
          // Gộp tất cả ảnh từ tất cả thử thách và lấy top 5 ảnh có vote cao nhất
          const allPhotos = data.flatMap((event) => event.photos);
          setFeaturedPhotos(allPhotos.sort((a, b) => b.votes - a.votes).slice(0, 5)); 
        } catch (error) {
          console.error("❌ Lỗi khi lấy leaderboard tất cả thử thách:", error);
        }
      };
  
      fetchAllLeaderboard();
    } else {
      const fetchLeaderboard = async () => {
        try {
          const response = await fetch(`${API_URL}/photos/leaderboard?eventId=${selectedChallenge}`);
          if (!response.ok) throw new Error("Không thể tải danh sách leaderboard.");
          const data = await response.json();
          console.log("📊 Leaderboard của thử thách:", data);
  
          // Lấy top 5 ảnh có vote cao nhất của thử thách
          setFeaturedPhotos(data.slice(0, 5));
        } catch (error) {
          console.error("❌ Lỗi khi lấy leaderboard thử thách:", error);
        }
      };
  
      fetchLeaderboard();
    }
  }, [selectedChallenge]);

  useEffect(() => {
    console.log("🔄 Đang cập nhật danh sách ảnh...");
    setFilteredPhotos(getSortedPhotos());
    console.log("🔄 Đang cập nhật danh sách ảnh...",getSortedPhotos());
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
    console.log("📊 Dữ liệu sau khi sắp xếp:", sortedPhotos);
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
    if (!slug || typeof slug !== "string") {
      return "default";
    }
    
    return slug
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/[^a-zA-Z0-9-]/g, "-") // Chỉ giữ chữ cái, số, dấu -
      .toLowerCase();
  };

const eventSlug = normalizeSlug(currentEvent?.slug || currentEvent?.name);

console.log(eventSlug)

const handleJoinChallenge = () => {
    if (currentEvent) {
      const slug = currentEvent.name.toLowerCase().replace(/ /g, "-"); // Tạo slug từ tên thử thách
      navigate(`/event/${slug}`, { state: { event: currentEvent } }); // Điều hướng kèm thông tin sự kiện
    }
};

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };



  return (
    <div className="min-h-screen">
            {/* Header */}
            <header className="bg-[#fcf5e3] flex items-center justify-between w-full h-[80px] px-6">
              {/* Logo Section */}
              <div className="w-[1390px] mx-auto flex flex-row items-center justify-between">
                  <div className="flex items-center lg:space-x-2 xs:space-x-0">
                    <img
                      src="/tet2025/image/wellsping-logo.png" // Đường dẫn logo 1
                      alt="Logo 1"
                      className="lg:h-28 w-auto xs:h-12"
                    />
                    <img
                      src="/tet2025/image/happyjourney.png" // Đường dẫn logo 2
                      alt="Logo 2"
                      className="lg:h-28 w-auto xs:h-12"
                    />
                  </div>
        
                    {/* Language Switcher */}
                    <div className ="items-center">
                      <div className ="flex items-center gap-2 ">
                      <span className="xs:text-sm lg:text-base lg:text-left xs:text-right">Chào mừng Wiser <span className="font-bold lg:text-base xs:text-sm">{user?.fullName  || "Ẩn danh"}</span></span>
                      <span className="lg:w-10 xs:w-12 lg:h-10 xs:h-9 border-2 border-gray-300 bg-[#E55526] rounded-full flex items-center justify-center" 
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
                        className="lg:w-10 xs:w-12 lg:h-10 xs:h-9 rounded-full border-2 border-gray-300 transition-transform transform hover:scale-110"
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
        <div className="flex flex-col justify-center items-center">        
           {/* ------------------------wellcome------------------------------ */}
            <section className="section"
            style={{
              backgroundImage: `url('/tet2025/image/wellcome-web.png')`, // Không cần process.env.PUBLIC_URL
              backgroundSize: "cover", // ✅ Ảnh không bị zoom to
              backgroundPosition: "center", // ✅ Căn giữa
              backgroundRepeat: "no-repeat",
              width: "100%", // ✅ Giữ full width
              margin: "0 auto", // ✅ Căn giữa khi có max-width
            }}>
            <div className="w-full h-[534px]">
              <div className="absolute flex-col space-y-4 text-white font-semibold 
              lg:left-[22%] lg:top-1/4 lg:text-base
              xs:left-10 xs:top-32 xs:text-sm xs:mx-auto xs:text-justify xs:h-full">
              <div className="
              lg:w-[476px]
              xs:w-[320px]">
              <p>Không khí tết rộn ràng, ngập tràn sắc xuân đã lan tỏa khắp Wellspring Hanoi! Đây là lúc để mỗi WISer dừng lại một chút, nhìn lại chặng đường một năm đã qua, làm mới chính mình, lan tỏa yêu thương và tạo nên những kỷ niệm Tết thật ý nghĩa.</p>
              </div>
              <div className="
              lg:w-[476px]
              xs:w-[320px]">
              <p>Các WiSers đã sẵn sàng với 6 Thử thách Ngày Tết chưa? Nơi lưu giữ từng khoảnh khắc rực rỡ, đậm chất tinh thần Lễ hội Mùa Xuân 2025 - Nhà là tết lớn trong Tim!</p>
              </div>
              <div className="
              lg:w-[476px]
              xs:w-[320px]">
              <p>Hãy chuẩn bị những khung hình đẹp nhất và cùng nhau chào đón một mùa Tết thật đáng nhớ!</p>
              </div>
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
            height: "100%",
            maxWidth: "1920px", // ✅ Giới hạn ngang
            margin: "0 auto", // ✅ Căn giữa khi có max-width
          }}>
              <div className="mx-auto text-[#002147] p-6">
                  {currentEvent && (
                    <section className="
                    lg:max-w-6xl lg:mx-auto lg:px-4
                    xs:full xs:mx-auto xs:px-4 ">
                      <h2 className="text-3xl font-bold mb-6 ml-4">Thử thách hôm nay</h2>
                      <div className="flex gap-6
                      lg:flex-row lg:justify-center lg:items-center
                      xs:flex-col-reverse xs:items-start">
                      {/* Ảnh sự kiện */}
                          <div className="
                          lg:w-[550px] lg:h-[405px] lg:grid lg:grid-cols-2 lg:gap-2 mb-4
                          xs:w-full xs:grid xs:grid-cols-2 xs:gap-2">
                              <div className="w-full h-[405px]">
                                  <img
                                     src={`/tet2025/image/events/${eventSlug || "default"}/1.png`} // Hiển thị event.image
                                     alt={currentEvent?.title || "No event image"}
                                     className="w-[270px] h-[405px] object-cover rounded-lg"
                                  />
                              </div>
                              <div className="w-full h-[405px] flex flex-col  gap-2">
                                  <div>
                                    <img
                                      src={`/tet2025/image/events/${eventSlug || "default"}/2.png`} // Hiển thị event.image
                                      alt={currentEvent?.title || "No event image"}
                                      className="w-full h-[270px] object-cover rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <img
                                      src={`/tet2025/image/events/${eventSlug || "default"}/3.png`} // Hiển thị event.image
                                      alt={currentEvent?.title || "No event image"}
                                      className="w-full h-[125px] object-cover rounded-lg"
                                    />
                                  </div>
                              </div>
                          </div>
                      {/* Thông tin sự kiện */}
                          <div className="
                          lg:w-[550px] lg:h-[405px] items-center justify-center mb-4 ml-4
                          xs:w-full ">
                              <div className="flex items-center space-x-4">
                                  <span className="bg-[#F0E9D8] text-md text-[#401011] font-semibold py-2 px-3 rounded">
                                    Còn{" "}
                                    {Math.max( 0,
                                    Math.ceil(
                                    (new Date(currentEvent.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}{" "}
                                    ngày
                                  </span>
                                  <span className="bg-[#F0E9D8] text-md text-[#401011] font-semibold py-2 px-3 rounded">
                                    {currentEvent.submissions || 0} bài dự thi
                                  </span>
                                </div>
                                  <h2 className="text-2xl font-bold mt-6 italic
                                  xs:hidden
                                  lg:block">
                                    Thử thách {currentEvent.number || "Không có tiêu đề"}
                                  </h2>
                                  <h3 className="  text-[#B42B23] font-bold mt-6 
                                  lg:text-3xl lg:mb-6
                                  xs:text-2xl xs:mb-2 ">
                                    {currentEvent.name || "Không có tiêu đề"}
                                  </h3>
                                  <div className="mb-4 overflow-hidden
                                  lg:w-[500px] lg:h-[144px]
                                  xs:w-full xs:h-full xs:text-justify">
                                  <p className="text-lg font-semibold">
                                      {currentEvent.description || "Không có mô tả"}
                                  </p>
                                  </div>
                                <div className="w-[285px] h-[50px] mt-4">
                                  <button 
                                    className="h-full w-full bg-[#E55526] text-white text-xl font-bold rounded-full hover:bg-[#E55526] transition"
                                    onClick={handleJoinChallenge}>
                                    Tham gia thử thách
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
                          const eventSlug = normalizeSlug(event.slug || event.name); // ✅ Lấy slug của từng thử thách
                          return (
                            <div
                              key={event._id}
                              className={`w-[200px] h-[150px] bg-cover bg-center rounded-lg shadow-lg flex flex-col items-center justify-center p-4 relative ${
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
                                  <h4 className="text-sm font-bold"> Thử thách {event.number || "N/A"}</h4>
                                  <p className="text-gray-200 text-sm mt-2">🔒</p>
                                </div>
                              ) : (
                                <div className="relative text-white text-center">
                                  <h4 className="text-sm font-bold"> Thử thách {event.number || "N/A"}</h4>
                                  <p className="text-sm text-white mt-2">{event.name || "Không có tên"}</p>
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
            <section className="section"
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
              <div className=" mx-auto text-center text-white
              lg:w-[1100px]
              xs:w-full">
                {/* Tiêu đề */}
                <h3 className="text-3xl font-bold mb-4">Cơ cấu giải thưởng</h3>
                <p className="text-lg font-semibold mb-8">
                  4 giải dành cho HS các cấp và CBGV (Dành cho bức ảnh được thả tim nhiều nhất của từng trường)
                </p>

                {/* Danh sách giải thưởng */}
                <div className="grid grid-cols-4 gap-6 justify-center">
                  {[
                    { title: "Hương vị Tết", prize: "01 Voucher Got it 500k" },
                    { title: "Vẻ đẹp Tết Việt", prize: "01 Voucher Got it 500k" },
                    { title: "Khoảnh khắc Xuân", prize: "01 Voucher Got it 500k" },
                    { title: "Giai điệu Tết", prize: "01 Voucher Got it 500k" },
                  ].map((award, index) => (
                    <div key={index} className="flex flex-col items-center">
                      {/* Icon vòng tròn */}
                      <div className="w-[100px] h-[100px] bg-white bg-opacity-30 rounded-full flex items-center justify-center text-white text-sm mb-4">
                        icon
                      </div>
                      <h4 className="text-lg font-bold">{award.title}</h4>
                      <p className="text-sm">{award.prize}</p>
                    </div>
                  ))}
                </div>

                {/* Điều khoản giải thưởng */}
                <div className="mt-10 font-bold flex flex-col items-center space-y-2 w-full px-10">
                20 WISer may mắn tham gia hoàn thành đúng và đủ 6 thử thách sẽ nhận quà từ BTC
                </div>
              </div>
            </section>    

            {/* ------------------------Bài thi nổi bật------------------------------ */}      
            <section className="section"
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
                <h3 className="text-3xl font-bold mb-6 text-[#002147]">Bài thi nổi bật</h3>
                {/* Tabs chọn thử thách */}
                {/* Hiển thị button trên 2XL, LG, XL */}
                <div className="hidden lg:flex lg:justify-center space-x-2 mb-8">
                  <button
                    className={`rounded-md font-bold
                      lg:px-4 lg:py-2 lg:text-base
                      ${selectedChallenge === "all" ? "bg-[#b42b23] text-white" : "bg-gray-200 text-gray-800"}`}
                    onClick={() => filterPhotosByEventId("all")}
                  >
                    Tất cả
                  </button>

                  {events.map((event) => (
                    <button
                      key={event._id}
                      className={`rounded-md font-bold
                        lg:px-4 lg:py-2 lg:text-base
                        ${selectedChallenge === event._id ? "bg-[#b42b23] text-white" : "bg-gray-200 text-gray-800"}`}
                      onClick={() => filterPhotosByEventId(event._id)}
                    >
                      Thử thách {event.number}
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
                    <option value="all">Tất cả thử thách</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        Thử thách {event.number}
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
                        className={`xs:hidden lg:block p-3 rounded-full ${currentPhotoIndex === 0 ? "bg-gray-300 cursor-not-allowed opacity-50" : "bg-gray-300 hover:bg-gray-400"}`}
                        disabled={currentPhotoIndex === 0}
                      >
                        <FaArrowLeft size={20} />
                      </button>

                      {/* Ảnh bài thi */}
                      <div className="xs:flex xs:items-center xs:justify-center xs:w-full xs:gap-4">
                        {/* Nút Prev */}
                        <button 
                          onClick={prevPhoto} 
                          className="lg:hidden xs:block p-3 rounded-full bg-gray-300 hover:bg-gray-400"
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
                            className="w-full h-full object-cover rounded-lg  shadow-md"
                            onError={(e) => console.error("Lỗi load ảnh:", e.target.src)}
                          />
                          <div className="xs:block lg:hidden">
                          <span className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tr-lg">
                            <span className="font-semibold text-sm text-left">Tác phẩm: {featuredPhotos[currentPhotoIndex]?.title}</span> <br/>
                            </span>
                          </div>
                        </div>

                        {/* Nút Next */}
                        <button 
                          onClick={nextPhoto} 
                          className="lg:hidden xs:block p-3 rounded-full bg-gray-300 hover:bg-gray-400"
                        >
                          <FaArrowRight size={20} />
                        </button>
                      </div>

                      {/* Nội dung bên phải ảnh */}
                      <div className="flex flex-col w-full 
                          lg:w-[400px] lg:h-[540px] 
                          xs:w-full xs:items-center xs:text-center">
                            {/* Thông tin ảnh */}
                            <div className="lg:w-[400px] xs:w-3/4">
                              <h3 className="xs:hidden lg:block text-[#b42b23] lg:text-3xl xs:text-2xl font-bold lg:text-left xs:text-left lg:mb-4">
                                {featuredPhotos[currentPhotoIndex]?.title}
                              </h3>
                              <p className="xs:hidden lg:block italic text-[#401011] lg:text-xl xs:text-md font-semibold mt-2 lg:text-left xs:text-left xs:mb-4 lg:mb-8">
                                {featuredPhotos[currentPhotoIndex]?.uploaderName}
                              </p>
                              <p className="lg:hidden xs:block italic text-[#401011] lg:text-xl xs:text-md font-semibold mt-2 lg:text-left xs:text-left xs:mb-4 lg:mb-8">
                                Tác giả: {featuredPhotos[currentPhotoIndex]?.uploaderName}
                              </p>

                              {/* Mô tả */}
                              <div className="w-full xs:font-semibold lg:text-xl bg-[#E3E3E3] p-2 rounded-xl leading-relaxed text-gray-600 lg:text-left xs:text-left xs:text-justify lg:mb-8">
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
                          className={`xs:hidden lg:block p-3 rounded-full ${currentPhotoIndex === featuredPhotos.length - 1 ? "bg-gray-300 cursor-not-allowed opacity-50" : "bg-gray-300 hover:bg-gray-400"}`}
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
            <section className="section"
              style={{
                backgroundImage: `url('/tet2025/image/background-primary.png')`, // Không cần process.env.PUBLIC_URL
                backgroundSize: "cover", // ✅ Ảnh không bị zoom to
                backgroundPosition: "center", // ✅ Căn giữa
                backgroundRepeat: "no-repeat",
                width: "100%", // ✅ Giữ full width
                maxWidth: "1920px", // ✅ Giới hạn ngang
                margin: "0 auto", // ✅ Căn giữa khi có max-width
              }}
            >
              <div className=" mx-auto mt-6 items-center justify-center mb-6">
                <h2 className="text-3xl text-[#fcf5e3] font-bold text-center mb-6">Bài dự thi</h2>

                {/* Bộ lọc sắp xếp & tìm kiếm */}
                <div className="flex  mx-auto items-center justify-between mb-4
                lg:w-[1390px]
                xs:w-full
                ">
                  {/* Bộ lọc sắp xếp */}
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-white">Sắp xếp theo:</span>
                      <select
                        className="border px-3 py-2 rounded-md bg-white text-gray-800"
                        value={sortOrder}
                        onChange={(e) => {
                          console.log("📌 Đã chọn bộ lọc:", e.target.value);
                          setSortOrder(e.target.value);
                        }}
                      >
                        <option value="votes">Lượt bình chọn</option>
                        <option value="latest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="myPhotos">Ảnh của tôi</option>
                      </select>
                    </div>
                </div>

                {/* Lưới hiển thị ảnh */}
                  <div className="
                  lg:w-[1390px] lg:mx-auto lg:grid lg:grid-cols-5 lg:gap-5
                  xs:w-full xs:mx-auto xs:grid xs:grid-cols-3 xs:gap-2 xs:ml-2">
                    {paginatedPhotos.map((photo) => (
                      <div key={photo._id} className="relative rounded-lg overflow-hidden shadow-md cursor-pointer bg-white
                      lg:w-[270px] lg:h-[338px]
                      xs:w-[110px] xs:h-[120px]
                      ">
                        
                        {/* Ảnh dự thi */}
                        <img 
                          src={`${BASE_URL}${photo.url}`} 
                          alt={photo.title || "Không tiêu đề"} 
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
            <section className="section"
              style={{
                backgroundImage: `url('/tet2025/image/end-web.png')`,
                backgroundSize: "Cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "100%",
                maxWidth: "1920px",
                margin: "0 auto",
              }}
            >
            <div className="h-[546px] lg:font-bold flex flex-col items-center text-center justify-center lg:text-2xl space-y-2 w-full px-10">
            <div className="
            lg:w-[922px] lg:h-[200px] lg:top-1/4
            xs:w-full xs:font-semibold xs:text-base
            ">
            
            Chúng ta sẽ gặp lại nhau sau kỳ nghỉ Tết, cùng nhau tiếp tục chinh phục những thử thách mới trên con đường học vấn. Mong các em Học sinh, các Giáo viên, Nhân viên trở lại trường với tinh thần hứng khởi, sẵn sàng cho những ngày học tập và làm việc hiệu quả. Chúc các WISer một mùa Tết an lành, vui vẻ, đầy ý nghĩa bên gia đình và bạn bè!            </div>
            
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
            lg:w-[1920px] lg:h-[484px]
            xs:w-full xs:h-[120px]
            ">

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

export default Event;