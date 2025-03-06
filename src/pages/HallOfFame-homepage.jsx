import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import axios from "axios";
import { UPLOAD_URL } from "../config.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

gsap.registerPlugin(ScrollTrigger);

const HallofFame = () => {
  // --- i18n, Header logic ---
  const { t } = useTranslation();
  const toggleLanguage = () => {
    const newLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLanguage);
  };

  const principals = [
    {
      name: t("principal1.name"),
      title: t("principal1.title"),
      message: t("principal1.message"),
      quote: {
        text: t("principal1.quote.text"),
        author: t("principal1.quote.author"),
      },
      image: "/halloffame/nguyenvinhson.png",
    },
    {
      name: t("principal2.name"),
      title: t("principal2.title"),
      message: t("principal2.message"),
      image: "/halloffame/hoangthiminh.png",
    },
    {
      name: t("principal3.name"),
      title: t("principal3.title"),
      message: t("principal3.message"),
      image: "/halloffame/hoangthiminh.jpg",
    },
  ];

  const extendedPrincipals = [
    principals[principals.length - 1],
    ...principals,
    principals[0],
  ];

  const navigate = useNavigate();
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const carouselContainerRef = useRef(null); // Ref cho container carousel

  // State cho carousel
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [disableTransition, setDisableTransition] = useState(false);

  // State responsive cho kích thước slide
  const [itemWidth, setItemWidth] = useState(1280);
  const [itemHeight, setItemHeight] = useState(560);
  const gap = 20; // khoảng cách giữa các slide
  const shift = currentIndex * (itemWidth + gap);

  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const starStudents = t("starStudents", { returnObjects: true });

  useEffect(() => {
    async function fetchImages() {
      try {
        // Gọi API lấy danh sách file trong /Students
        const { data } = await axios.get(`${UPLOAD_URL}/Students`);
        if (Array.isArray(data)) {
          // Lọc các file bắt đầu bằng "WS"
          const filtered = data.filter((file) => file.startsWith("WS"));
          // Trộn ngẫu nhiên
          shuffleArray(filtered);
          // Lấy 50 file đầu
          const selected = filtered.slice(0, 50);
          // Chia 2 mảng: 25 ảnh hàng trên, 25 ảnh hàng dưới
          setTopImages(selected.slice(0, 25));
          setBottomImages(selected.slice(25, 50));
        }
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    }

    fetchImages();
  }, []);

  // Hàm trộn mảng
  function shuffleArray(arr) {
    let currentIndex = arr.length;
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex],
        arr[currentIndex],
      ];
    }
  }

  // Tính toán kích thước slide dựa trên window.innerWidth
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile: 90% chiều rộng, chiều cao nhỏ hơn
        setItemWidth(width * 0.9);
        setItemHeight(300);
      } else if (width < 1024) {
        // Laptop 13" hoặc 14": 80% chiều rộng, chiều cao trung bình
        setItemWidth(width * 0.8);
        setItemHeight(400);
      } else {
        // Laptop lớn 15.6" và FullHD 24": sử dụng kích thước cố định hoặc tỷ lệ cố định
        setItemWidth(1280);
        setItemHeight(560);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > threshold) {
      goToNext();
    } else if (diff < -threshold) {
      goToPrev();
    }
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Sau khi transition kết thúc, xử lý chuyển đổi nếu đang ở slide clone
  const handleTransitionEnd = () => {
    if (currentIndex === extendedPrincipals.length - 1) {
      // Nếu đang ở clone của ảnh đầu, vô hiệu transition và cập nhật về ảnh số 1 thật sự
      setDisableTransition(true);
      setCurrentIndex(1);
    }
    if (currentIndex === 0) {
      // Nếu đang ở clone của ảnh cuối, vô hiệu transition và cập nhật về ảnh số 4 thật sự
      setDisableTransition(true);
      setCurrentIndex(extendedPrincipals.length - 2);
    }
    setIsTransitioning(false);
  };

  useEffect(() => {
    // Sau khi cập nhật index, bật lại transition ngay sau 1 frame
    if (disableTransition) {
      requestAnimationFrame(() => {
        setDisableTransition(false);
      });
    }
  }, [disableTransition]);

  // Hiệu ứng cho Section 1: mờ dần khi cuộn xuống
  useEffect(() => {
    gsap.fromTo(
      section1Ref.current,
      { opacity: 1, y: 0 },
      {
        opacity: 0,
        y: -100,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section1Ref.current,
          start: "top top",
          end: "bottom 20%",
          scrub: true,
        },
        duration: 5,
      }
    );
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".section2-content", // hoặc carouselContainerRef.current
      { opacity: 0, y: 200 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 50%", // Bắt đầu khi top của section2 = 50% viewport
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  // Hiệu ứng cho carousel container trong Section 2: fade in khi cuộn vào
  useEffect(() => {
    gsap.fromTo(
      carouselContainerRef.current,
      { opacity: 0, y: 100 },
      {
        opacity: 1,
        y: 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 80%",
          end: "top 50%",
          scrub: true,
        },
        duration: 2,
      }
    );
  }, []);

  // currentSlide: index của ảnh đang được highlight (phóng to)
  const [currentSlide, setCurrentSlide] = useState(0);
  // quoteIndex: index của ảnh đang mở quote (nếu = null thì đóng)
  const [quoteIndex, setQuoteIndex] = useState(null);

  // Dùng ref để lưu trữ interval, dễ dàng clear khi mở quote
  const autoSlideRef = useRef(null);

  // Hàm khởi tạo auto-slide (chuyển slide 3s/lần)
  const startAutoSlide = () => {
    // Đảm bảo clear trước khi setInterval mới
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % starStudents.length);
    }, 3000);
  };

  // Hàm dừng auto-slide
  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  };

  // Khởi tạo auto-slide khi mount
  useEffect(() => {
    startAutoSlide();
    return () => {
      // Clear interval khi unmount
      stopAutoSlide();
    };
  }, []);

  // Xử lý click ảnh -> toggle quote
  const handleClickStudent = (index) => {
    if (quoteIndex === index) {
      // Đang mở -> đóng
      setQuoteIndex(null);
      // Khởi động lại auto-slide
      startAutoSlide();
    } else {
      // Đóng quote khác (nếu có)
      setQuoteIndex(index);
      // Dừng auto-slide
      stopAutoSlide();
    }
  };

  // ======================
  // Section 3: Carousel cho StarStudents (vòng lặp vô hạn)
  // ======================
  // Tạo mảng mở rộng để tạo vòng lặp vô hạn: clone phần tử cuối và đầu
  const extendedStars = [
    starStudents[starStudents.length - 1],
    ...starStudents,
    starStudents[0],
  ];

  const cardWidth = 360; // kích thước 1 thẻ

  // Thẻ ở giữa (vị trí index = 2 của extendedStars) là thẻ active ban đầu
  const [starCurrentSlide, setStarCurrentSlide] = useState(2);
  // Lưu chỉ số (real index) của thẻ đang mở hộp giới thiệu; null nếu không mở
  const [starQuoteIndex, setStarQuoteIndex] = useState(null);

  const starContainerRef = useRef(null);
  const starAutoSlideRef = useRef(null);
  const starTransitionRef = useRef(null);

  // Hàm auto-run cho Section 3 (mỗi 2 giây)
  const startStarAutoSlide = () => {
    if (starAutoSlideRef.current) clearInterval(starAutoSlideRef.current);
    starAutoSlideRef.current = setInterval(() => {
      setStarCurrentSlide((prev) => prev + 1);
    }, 2000);
  };

  const stopStarAutoSlide = () => {
    if (starAutoSlideRef.current) {
      clearInterval(starAutoSlideRef.current);
      starAutoSlideRef.current = null;
    }
  };

  useEffect(() => {
    startStarAutoSlide();
    return () => {
      stopStarAutoSlide();
    };
  }, [starStudents]);

  // Xử lý khi transition kết thúc cho Section 3
  const handleStarTransitionEnd = () => {
    if (starCurrentSlide === extendedStars.length - 1) {
      starTransitionRef.current.style.transition = "none";
      setStarCurrentSlide(1);
      void starTransitionRef.current.offsetWidth;
      starTransitionRef.current.style.transition = "transform 0.5s ease-in-out";
    }
    if (starCurrentSlide === 0) {
      starTransitionRef.current.style.transition = "none";
      setStarCurrentSlide(extendedStars.length - 2);
      void starTransitionRef.current.offsetWidth;
      starTransitionRef.current.style.transition = "transform 0.5s ease-in-out";
    }
  };

  // Khi click vào thẻ của Section 3: cuộn thẻ đó vào giữa và mở hộp giới thiệu
  const handleStarCardClick = (index) => {
    setStarCurrentSlide(index);
    // Nếu thẻ đang mở thì đóng, ngược lại mở và dừng auto-run
    if (starQuoteIndex === index - 1) {
      // Lưu ý: real index của thẻ = index - 1 (vì extendedStars)
      setStarQuoteIndex(null);
      startStarAutoSlide();
    } else {
      setStarQuoteIndex(index - 1);
      stopStarAutoSlide();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-[80px] bg-[#002855] text-white flex items-center lg:shadow-none justify-between lg:px-20 px-6 shadow-md z-50">
        {/* Logo bên trái */}
        <div className="flex flex-row gap-10 items-center">
          <img
            src="/halloffame/HOH-white.png"
            className="h-12"
            alt="Wellspring Logo"
          />
          <img
            src="/halloffame/WS-white.png"
            className="h-16"
            alt="Wellspring Logo"
          />
          {/* Thêm 2 nút ở đây */}
          <button
            onClick={() => navigate("/hall-of-honor")}
            className="px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-[#002855] transition-colors"
          >
            {t("homepage")}
          </button>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-[#002855] transition-colors"
          >
            {t("hallhonor")}
          </button>
        </div>

        {/* Logo/nút khác bên phải */}
        <div className="flex flex-row gap-10 items-center">
          <img
            src="/halloffame/HJ-white.png"
            className="h-12 hidden lg:block"
            alt="Happy Journey"
          />
          <button
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full border-2 transition border-gray-300 hover:border-yellow-400 shadow-md"
          >
            <img
              src={
                i18n.language === "vi"
                  ? "/icons/flag-vi.png"
                  : "/icons/flag-en.png"
              }
              alt={t("language", "Language")}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
      </header>
      {/* Section 1: Video Background */}
      <section
        ref={section1Ref}
        className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
      >
        <img
          src="/halloffame/banner.gif"
          alt="Banner GIF"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </section>

      {/* Section 2: Carousel */}
      <section
        ref={section2Ref}
        className="relative w-full flex flex-col items-center justify-center overflow-hidden pb-20 pt-10"
      >
        {/* <div
          className="absolute top-0 left-0 w-full h-40 pointer-events-none
          bg-gradient-to-b from-[rgba(24,43,85,0.8)] to-[rgba(24,43,85,0)]"
        /> */}
        {/* Tiêu đề */}
        <div className="relative w-full text-center mb-10 z-10">
          <h2 className="text-[32px] font-semibold text-[#002147] uppercase  tracking-wide">
            {t("principalMessageHeader", "Thông điệp của Hiệu trưởng")}
          </h2>
        </div>

        {/* Vùng carousel */}
        <div
          ref={carouselContainerRef} // Áp dụng ref cho container carousel
          className="relative w-full mx-auto overflow-hidden z-10 section2-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex ${
              disableTransition
                ? ""
                : "transition-transform duration-500 ease-in-out"
            }`}
            style={{
              transform: `translateX(calc(50% - ${shift + itemWidth / 2}px))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedPrincipals.map((principal, index) => {
              // Xác định slide hiện tại hay slide chờ
              const isActive = index === currentIndex;
              return (
                <div
                  key={index}
                  style={{ width: itemWidth, height: itemHeight }}
                  className={`carousel-slide flex-shrink-0 rounded-[20px] px-10 py-12 transition-all duration-500 ease-in-out overflow-hidden ${
                    isActive
                      ? "bg-[#f8f8f8] scale-100 opacity-100"
                      : "bg-[#D9D9D9] scale-75 opacity-90"
                  }`}
                >
                  <div className="flex flex-row h-full items-start">
                    {/* Ảnh nền chìm phía sau */}
                    <img
                      src="/halloffame/vector-section2.png"
                      alt="vector-section2"
                      className="absolute -bottom-40 -right-5 w-[1000px] h-auto object-cover pointer-events-none opacity-20"
                    />
                    <img
                      src="/halloffame/ngon-duoc.png"
                      alt="ngon-duoc"
                      className="w-auto h-[900px] absolute -bottom-[400px] left-32  pointer-events-none opacity-20"
                    />
                    <img
                      src={principal.image}
                      alt={principal.name}
                      className="w-auto h-[1500px] absolute -bottom-[50px] right-10  object-contain pointer-events-none"
                      style={{
                        width: itemWidth * 0.4,
                        height: itemHeight * 0.85,
                      }}
                    />
                    {/* Cột text */}
                    <div className="w-[730px] flex flex-col items-start z-10">
                      <div>
                        <div className="mb-4">
                          <p
                            style={{ whiteSpace: "pre-line" }}
                            className="text-[#002855] text-xl text-semibold leading-[30px]"
                          >
                            {principal.message}
                          </p>
                        </div>
                        {principal.quote && (
                          <blockquote className="italic text-[#002855] text-xl text-semibold leading-[30px]">
                            “{principal.quote.text}”
                            <footer className="mt-2 text-right text-[#002855] text-lg text-semibold leading-[30px]">
                              - {principal.quote.author}
                            </footer>
                          </blockquote>
                        )}
                        <div>
                          <p className="text-[#002147] font-bold text-lg">
                            {principal.name}
                          </p>
                          <p className="text-[#757575] font-bold text-lg">
                            {principal.title}
                          </p>
                          {/* Nút chuyển slide */}
                          <div className="absolute md:bottom-12 bottom-4">
                            {isActive && (
                              <div className="mt-4 flex space-x-2">
                                <button
                                  className="bg-[#F05023] text-white rounded-full p-2"
                                  onClick={goToPrev}
                                >
                                  <FaArrowLeft />
                                </button>
                                <button
                                  className="bg-[#F05023] text-white rounded-full p-2"
                                  onClick={goToNext}
                                >
                                  <FaArrowRight />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section
        className="relative w-full h-[720px] flex flex-col items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url(/halloffame/section3.png)" }}
      >
        {/* Tiêu đề Section 3 */}
        <div className="text-center mb-12">
          <p className="text-[24px] font-medium text-[#F9D16F]">
            {t("studenthonor")}
          </p>

          {/* Gạch ngang */}
          <div className="flex justify-center my-4">
            <img
              src="/halloffame/vector.png"
              alt="Divider"
              className="w-[200px] md:w-[300px] h-auto"
            />
          </div>

          <h2 className="text-[36px] md:text-4xl font-bold text-[#F9D16F] uppercase">
            {t("student_feedback")}
          </h2>
        </div>

        {/* Vùng 4 ảnh */}
        <div className="relative flex items-center justify-center space-x-20 transition-all duration-500">
          {starStudents.map((student, index) => {
            const isActive = index === quoteIndex; // Ảnh đang mở giới thiệu

            return (
              <div
                className={`relative flex transition-all duration-500 ${
                  isActive ? "w-[720px]" : "w-[360px]"
                } h-[360px]`}
                onClick={() => handleClickStudent(index)}
                key={index}
              >
                {/* Ảnh học sinh (LUÔN cố định) */}
                <div className="relative w-[360px] h-[360px]">
                  <img
                    src={student.image} // Nếu bạn có trường image, nếu không hãy thay thế bằng ảnh mặc định
                    alt={student.name[i18n.language]}
                    className="absolute inset-0 w-full h-full object-cover rounded-xl transition-all duration-500"
                  />
                </div>

                {/* Frame Avatar - Luôn nằm trên ảnh khi chưa click */}
                {!isActive && (
                  <div className="absolute inset-0 w-[360px] h-[360px] pointer-events-none z-50">
                    <img
                      src="/halloffame/frameavatar.png"
                      alt="Avatar Frame"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Frame Quote - Hiện khi click vào ảnh, luôn full chiều cao */}
                {isActive && (
                  <div className="absolute inset-0 w-[720px] h-full pointer-events-none z-50 flex items-stretch">
                    <img
                      src="/halloffame/framequote.png"
                      alt="Quote Frame"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Overlay gradient chứa text */}
                <div
                  className="absolute bottom-0 w-[360px] px-4 py-10 bg-gradient-to-t rounded-b-lg"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10, 40, 80, 0.9) 0%, rgba(30, 60, 120, 0) 100%)",
                  }}
                >
                  <p className="absolute bottom-12 text-md font-semibold text-[#F9D16F]">
                    {student.year[i18n.language]}
                  </p>
                  <p className="absolute bottom-4 text-2xl uppercase font-bold text-[#F9D16F]">
                    {student.name[i18n.language]}
                  </p>
                </div>

                {/* Hộp giới thiệu mở bên cạnh */}
                {isActive && (
                  <div
                    className="w-[360px] bg-[#0F2B47] p-6 rounded-r-xl flex flex-col justify-center transition-all duration-500 overflow-hidden"
                    style={{
                      maxHeight: isActive ? "500px" : "0px", // Giới hạn chiều cao
                      opacity: isActive ? 1 : 0, // Làm hiệu ứng fade in
                    }}
                  >
                    <p className="text-lg font-semibold text-[#F9D16F]">
                      {student.year[i18n.language]}
                    </p>
                    <h3 className="text-2xl font-bold text-[#F9D16F]">
                      {student.name[i18n.language]}
                    </h3>
                    <p className="text-white text-[12px] mt-4 transition-all duration-500 ease-in-out">
                      {i18n.language === "vi"
                        ? student.quoteVi
                        : student.quoteEn}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* Section slider */}
      <section className="relative w-full h-[570px] overflow-hidden">
        {/* Slider 2 hàng, full width */}
        <div className="absolute top-0 left-0 w-full h-full my-20">
          {/* Hàng ảnh trên */}
          <div className="marquee-container">
            <div className="marquee-track">
              {topImages.map((img, index) => (
                <img
                  key={`top-${index}`}
                  src={`${UPLOAD_URL}/Students/${img}`}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {/* Lặp lại để cuộn liên tục */}
              {topImages.map((img, index) => (
                <img
                  key={`top2-${index}`}
                  src={`${UPLOAD_URL}/Students/${img}`}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
            </div>
          </div>

          {/* Hàng ảnh dưới - thêm offset để so le */}
          <div className="marquee-container mt-4">
            <div className="marquee-track transform translate-x-[50px]">
              {bottomImages.map((img, index) => (
                <img
                  key={`bottom-${index}`}
                  src={`${UPLOAD_URL}/Students/${img}`}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {bottomImages.map((img, index) => (
                <img
                  key={`bottom2-${index}`}
                  src={`${UPLOAD_URL}/Students/${img}`}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Overlay gradient nửa trong suốt */}
        <div
          className="absolute inset-0 pointer-events-none 
               bg-[linear-gradient(180deg,rgba(24,43,85,0.6)_0%,rgba(24,43,85,1)_95%)]
               shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        />
        {/* Nội dung đè lên slider + overlay */}
        <div className="relative z-10 w-full h-full flex flex-row items-center justify-between px-[400px] text-center text-white">
          <div className="flex flex-col text-left">
            <h3 className="shimmer-text text-[32px] font-bold mb-4">
              Khám phá
            </h3>
            <img
              src="/halloffame/HOH-gold.png"
              alt="Hall of Honor"
              className="shimmer-text w-[300px] md:w-[400px] mb-8"
            />
          </div>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="mt-2 px-16 py-2 bg-[#002147] rounded-full font-semibold transition-colors"
          >
            <h3 className="shimmer-text text-[24px] font-bold ">
              Bảng vinh danh
            </h3>
          </button>
        </div>
      </section>
      {/* Footer */}
      <div className="hidden lg:block w-full">
        <img
          src="/halloffame/Footer.png"
          alt="Footer"
          className="w-full object-cover"
        />
      </div>
      <div className="lg:hidden w-full">
        <img
          src="/halloffame/Footer_mobile.png"
          alt="Footer"
          className="w-full"
        />
      </div>
    </>
  );
};

export default HallofFame;
