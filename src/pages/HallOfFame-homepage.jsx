import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import axios from "axios";
import { UPLOAD_URL } from "../config.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import Splide from "@splidejs/splide";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
import "@splidejs/splide/dist/css/splide.min.css";
import "animate.css";

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
      image: "/halloffame/lethuynga.png",
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
  const [containerWidth, setContainerWidth] = useState(0);

  // State cho carousel
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [disableTransition, setDisableTransition] = useState(false);

  // State responsive cho kích thước slide
  const [itemWidth, setItemWidth] = useState(1280);
  const [itemHeight, setItemHeight] = useState(560);
  const gap = 20;
  const shift = currentIndex * (itemWidth + gap);

  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const starStudents = t("starStudents", { returnObjects: true });
  const preloadImages = (imageUrls) => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  };
  useEffect(() => {
    async function fetchImages() {
      try {
        const { data } = await axios.get(`${UPLOAD_URL}/Students`);
        if (Array.isArray(data)) {
          const filtered = data.filter((file) => file.startsWith("WS"));
          shuffleArray(filtered);
          const selected = filtered.slice(0, 20);
          setTopImages(selected.slice(0, 10));
          setBottomImages(selected.slice(10, 20));

          // Preload images ngay sau khi set state
          preloadImages([
            "/halloffame/WS-opacity-20.png",
            ...selected.map((img) => `${UPLOAD_URL}/Students/${img}`),
          ]);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    }

    fetchImages();
  }, []);

  useEffect(() => {
    if (carouselContainerRef.current) {
      // Lấy độ rộng container ngay khi render
      setContainerWidth(carouselContainerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const splide = new Splide(".splide", {
      type: "loop",
      drag: "free",
      focus: "center",
      autoWidth: true,
      autoScroll: {
        speed: 0.5,
      },
      gap: "40px", // Hoặc 20, 30px, v.v.

      breakpoints: {
        1024: {
          autoWidth: false,
          perPage: 2,
        },
        640: {
          autoWidth: false,
          perPage: 1,
        },
      },
    });

    splide.mount({ AutoScroll });

    return () => splide.destroy();
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
        setItemWidth(width * 1);
        setItemHeight(400);
      } else if (width < 1024) {
        // Laptop 13" hoặc 14": 80% chiều rộng, chiều cao trung bình
        setItemWidth(width * 0.7);
        setItemHeight(400);
      } else if (width < 1600) {
        // Màn hình dưới 1600px: 85% chiều rộng, chiều cao lớn hơn
        setItemWidth(width * 0.65);
        setItemHeight(500);
      } else {
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
      setDisableTransition(true);
      setCurrentIndex(1);
    }
    if (currentIndex === 0) {
      setDisableTransition(true);
      setCurrentIndex(extendedPrincipals.length - 2);
    }
    setIsTransitioning(false);
  };

  useEffect(() => {
    if (disableTransition) {
      requestAnimationFrame(() => {
        setDisableTransition(false);
      });
    }
  }, [disableTransition]);

  useEffect(() => {
    gsap.fromTo(
      ".section2-title",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".section2-slide",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 60%",
          toggleActions: "play none none none",
        },
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
        className="fixed-section relative w-full min-h-screen overflow-hidden flex items-center justify-center rounded-t-3xl"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full md:object-cover object-contain"
        >
          <source src="/halloffame/banner.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      {/* Section 2: Carousel */}
      <section
        ref={section2Ref}
        className="bg-white relative w-full flex flex-col items-center justify-center overflow-hidden h-screen mt-[100vh]"
      >
        {/* Tiêu đề */}
        <div className="relative w-full text-center mb-10 z-10">
          <h2 className="section2-title xl:text-[32px] text-[30px] text-xl font-semibold text-[#002147] uppercase tracking-wide">
            {t("principalMessageHeader", "Thông điệp của Hiệu trưởng")}
          </h2>
        </div>

        {/* Vùng carousel */}
        <div
          ref={carouselContainerRef} // Áp dụng ref cho container carousel
          className="section2-slide relative w-full mx-auto overflow-hidden z-10 section2-content"
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
              transform: `translateX(calc(50% - ${
                shift + itemWidth / 2.15
              }px))`,
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
                  className={`carousel-slide flex-shrink-0 rounded-[20px] lg:px-10 lg:py-12  px-7 py-8 transition-all duration-500 ease-in-out overflow-hidden ${
                    isActive
                      ? "bg-[#f8f8f8] backdrop-blur-none scale-100 opacity-100"
                      : "bg-[#000000] backdrop-blur-3xl scale-75 opacity-10"
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
                      className="w-auto xll:max-h-[100%] md:max-h-[90%] max-h-[80%]  absolute -bottom-[50px] xl:right-5 xll:right-20 right-3 object-contain pointer-events-none"
                    />
                    {/* Cột text */}
                    <div className="w-[50%] md:w-[65%] xl:w-[70%] max-w-[730px] flex flex-col items-start z-10">
                      <div>
                        <div className="lg:my-3">
                          <p
                            style={{ whiteSpace: "pre-line" }}
                            className="text-[#002855] xl:text-lg lg:text-md md:text-sm sm:text-[12px] text-[10px] text-semibold leading-relaxed"
                          >
                            {principal.message}
                          </p>
                        </div>
                        {principal.quote && (
                          <blockquote className="italic text-[#002855] xl:text-lg lg:text-md md:text-sm sm:text-[12px] text-[10px] text-semibold leading-relaxed">
                            “{principal.quote.text}”
                            <footer className="mt-2 mr-[10%] xll:mr-0 text-right text-[#002855] xl:text-lg lg:text-md md:text-sm sm:text-[12px] text-semibold leading-relaxed">
                              - {principal.quote.author}
                            </footer>
                          </blockquote>
                        )}
                        <div className="mt-5">
                          <p className="text-[#002147] font-bold xl:text-lg lg:text-sm md:text-[12px] text-[10px] ">
                            {principal.name}
                          </p>
                          <p className="text-[#757575] font-bold xl:text-lg lg:text-sm md:text-[12px] text-[10px] ">
                            {principal.title}
                          </p>
                          {/* Nút chuyển slide */}
                          <div className="absolute md:bottom-8 bottom-4">
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
        className="relative w-full h-[720px] flex flex-col items-center justify-center bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url(/halloffame/section3.png)" }}
      >
        {/* Tiêu đề Section 3 */}
        <div className="text-center mb-12">
          <p className="text-[24px] font-medium text-[#F9D16F]">
            {t("studenthonor")}
          </p>
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

        {/* Slider Splide */}
        <div className="splide w-full max-w-[1900px]">
          <div className="splide__track">
            <ul className="splide__list">
              {starStudents.map((student, index) => {
                const isActive = index === quoteIndex; // Kiểm tra nếu học sinh được chọn
                return (
                  <li
                    className={`
                      splide__slide 
                      relative 
                      flex 
                      transition-all 
                      duration-500
                      overflow-hidden
                      ${isActive ? "w-[840px]" : "w-[420px]"}
                    `}
                    onClick={() => handleClickStudent(index)}
                    key={index}
                  >
                    {/* Ảnh học sinh */}
                    <div className="relative 2xl:w-[420px] w-[420px] h-[420px]">
                      <img
                        src={student.image}
                        alt={student.name[i18n.language]}
                        className="absolute inset-0 w-full h-full object-cover object-top rounded-xl transition-all duration-500"
                      />
                    </div>

                    {/* Frame Avatar */}
                    {!isActive && (
                      <div className="absolute inset-0 2xl:w-[420px] w-[420px] h-[420px] pointer-events-none z-50">
                        <img
                          src="/halloffame/frameavatar.png"
                          alt="Avatar Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Frame Quote */}
                    {isActive && (
                      <div className="absolute inset-0 2xl:w-[840px] w-[840px] h-full pointer-events-none z-50 flex items-stretch">
                        <img
                          src="/halloffame/framequote.png"
                          alt="Quote Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Overlay gradient chứa text */}
                    <div
                      className="2xl:w-[420px] w-[420px] px-4 py-28 absolute bottom-0 transition-all duration-500 rounded-b-lg"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(10, 40, 80, 1) 0%, rgba(30, 60, 120, 0) 100%)",
                      }}
                    >
                      <p className="absolute bottom-10 2xl:text-3xl text-2xl uppercase font-bold text-[#F9D16F]">
                        {student.name[i18n.language]}
                      </p>
                      <p className="absolute bottom-4 text-md font-semibold text-[#F9D16F]">
                        {student.year[i18n.language]}
                      </p>
                    </div>

                    {/* Hộp giới thiệu mở bên cạnh */}
                    {isActive && (
                      <div
                        className="p-6 rounded-xl flex flex-col justify-center transition-all duration-500 ease-in-out"
                        style={{
                          // Khi chưa active => maxWidth = 0 => ẩn. Khi active => hiển thị đầy đủ
                          maxWidth: isActive ? "420px" : "0px",
                          opacity: isActive ? 1 : 0,
                        }}
                      >
                        <p className="text-white text-[14px]">
                          "
                          {i18n.language === "vi"
                            ? student.quoteVi
                            : student.quoteEn}
                          "
                        </p>

                        <div style={{ whiteSpace: "pre-line" }}>
                          <p className="text-md font-semibold text-[#F9D16F]">
                            {student.archivement[i18n.language]}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
      {/* Section: Dấu ấn danh vọng */}
      <section className=" bg-white relative w-full flex flex-col items-center justify-center p-40 overflow-hidden">
        {/* Ảnh nền chìm */}
        <div
          className="w-[1075px] h-[1075px] absolute -right-44 -bottom-[200px] bg-no-repeat bg-contain"
          style={{ backgroundImage: "url('/halloffame/WS-opacity-20.png')" }}
        />

        {/* Tiêu đề */}
        <h2 className="text-[32px] font-bold text-[#002147] uppercase ">
          {t("hallmark_of_fame", "Dấu ấn danh vọng")}
        </h2>
        <h2 className="text-[32px] font-bold text-[#002147] uppercase mb-12">
          {t("hallmark_of_fame__02", "Tôn vinh thành tựu - Lan toả cảm xúc")}
        </h2>

        {/* Video chính */}
        <div className="relative flex flex-row w-full items-center justify-center mb-10">
          <iframe
            className="w-[1280px] h-[720px] lg:h-[560px] shadow-lg rounded-lg"
            src="https://www.youtube.com/embed/abc123"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>
      {/* Section slider */}
      <section className="bg-white relative w-full h-[570px] overflow-hidden">
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
        <div className="relative z-10 w-full h-full flex flex-row items-center justify-between 2xl:px-[200px] px-[120px] text-center text-white">
          <div className="flex flex-col text-left">
            <h3 className="shimmer-text text-[32px] font-bold mb-4">
              Khám phá
            </h3>
            <img
              src="/halloffame/HOH-gold.png"
              alt="Hall of Honor"
              className="shimmer-text 2xl:w-[612px] w-[500px] mb-8"
            />
          </div>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="w-[433px] mt-2 px-16 py-2 bg-[#F9D16F] rounded-full font-semibold transition-colors"
          >
            <h3 className="shimmer-text-2 text-[24px] font-bold">
              Xem Bảng Vinh Danh
            </h3>
          </button>
        </div>
      </section>
      {/* Footer */}
      <div className="hidden lg:block w-full">
        <img
          src="/halloffame/Footer.svg"
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
