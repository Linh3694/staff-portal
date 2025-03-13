import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import Splide from "@splidejs/splide";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
import "@splidejs/splide/dist/css/splide.min.css";
import "animate.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

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

  const navigate = useNavigate();
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

  const swiperRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // State responsive cho kích thước slide
  const [itemWidth, setItemWidth] = useState(1280);
  const [itemHeight, setItemHeight] = useState(560);

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
    const localImages = Array.from(
      { length: 20 },
      (_, i) => `/halloffame/students/student${i + 1}.webp`
    );

    setTopImages(localImages.slice(0, 10));
    setBottomImages(localImages.slice(10, 20));
    preloadImages(localImages);
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
        setItemWidth(width * 0.85);
        setItemHeight(400);
      } else if (width < 1600) {
        // Màn hình dưới 1600px: 85% chiều rộng, chiều cao lớn hơn
        setItemWidth(width * 0.75);
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
          <button onClick={() => navigate("/hall-of-honor")}>
            <img
              src="/halloffame/HOH-white.png"
              className="h-12"
              alt="Wellspring Logo"
            />
          </button>
          <a href="https://wellspring.edu.vn">
            <img
              src="/halloffame/WS-white.png"
              className="h-16"
              alt="Wellspring Logo"
            />
          </a>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="hidden md:block px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-[#002855] transition-colors"
          >
            {t("hallhonor")}
          </button>
        </div>

        {/* Logo/nút khác bên phải */}
        <div className="flex flex-row gap-10 items-center">
          <img
            src="/halloffame/HJ-white.png"
            className="h-12 hidden md:block"
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
          className="hidden lg:flex absolute top-0 left-0 w-full h-full md:object-cover object-contain"
          src="/halloffame/banner.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <video
          className="lg:hidden absolute top-0 left-0 w-full h-full md:object-cover object-cover"
          src="/halloffame/banner_mobile.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute bottom-[15%] left-1/2 transform -translate-x-1/2 z-20 block lg:hidden">
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="w-[250px] px-10 py-2 bg-[#F9D16F] rounded-full font-semibold transition-colors"
          >
            <h3 className="shimmer-text-2 text-[20px] font-bold">
              {t("discover", "Khám phá")}
            </h3>
          </button>
        </div>
      </section>

      {/* Section 2: Carousel */}
      <section
        ref={section2Ref}
        className="hidden lg:flex bg-white relative w-full flex-col items-center justify-center overflow-hidden h-screen mt-[100vh]"
      >
        {/* Tiêu đề */}
        <div className="relative w-full text-center mb-10 z-10">
          <h2 className="section2-title xl:text-[32px] text-[30px] text-xl font-semibold text-[#002147] uppercase tracking-wide">
            {t("principalMessageHeader", "Thông điệp của Hiệu trưởng")}
          </h2>
        </div>

        {/* Vùng carousel */}
        <Swiper
          loop={true}
          speed={2000} // Hiệu ứng chuyển slide chậm hơn (1 giây)
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
          className="section2-slide relative w-full mx-auto overflow-hidden z-10 section2-content"
        >
          {principals.map((principal, index) => {
            const isActive = index === activeSlide;
            return (
              <SwiperSlide key={index} className="flex justify-center relative">
                <div
                  style={{ width: itemWidth, height: itemHeight }}
                  className={`carousel-slide flex-shrink-0 rounded-[20px] lg:px-10 lg:py-12 px-7 py-5 transition-all duration-500 ease-in-out overflow-hidden ${
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
                      className="absolute xll:-right-12 xll:w-[1000px] xll:-bottom-24 lg:w-[900px] xl:-right-28 xl:-bottom-24 lg:-right-36 lg:-bottom-20 md:w-[800px] md:-bottom-24 md:-right-32 w-[700px] -bottom-8 -right-16 h-auto object-cover pointer-events-none opacity-30"
                    />
                    <img
                      src="/halloffame/ngon-duoc.png"
                      alt="ngon-duoc"
                      className="w-auto h-[400px] absolute -bottom-[170px] left-5 md:h-[700px] md:-bottom-[400px] pointer-events-none opacity-20 xll:h-[900px] lg:h-[800px] lg:-bottom-[400px] lg:left-10 xl:left-32"
                    />
                    <img
                      src={principal.image}
                      alt={principal.name}
                      className="w-auto xll:max-h-[100%] md:max-h-[90%] max-h-[70%] absolute bottom-0 md:-bottom-[50px] xl:right-15 xll:right-20 md:right-12 right-5 object-contain pointer-events-none"
                    />
                    {/* Cột text */}
                    <div className="w-[60%] md:w-[60%] xl:w-[70%] max-w-[730px] flex flex-col items-start z-10">
                      <div>
                        <div className="lg:my-3">
                          <p
                            style={{ whiteSpace: "pre-line" }}
                            className="text-[#002855] xl:text-lg lg:text-base md:text-sm sm:text-[12px] text-[10px] text-semibold leading-relaxed"
                          >
                            {principal.message}
                          </p>
                        </div>
                        {principal.quote && (
                          <blockquote className="italic text-[#002855] xl:text-lg lg:text-base md:text-sm sm:text-[14px] text-[10px] text-semibold leading-relaxed">
                            “{principal.quote.text}”
                            <footer className="mt-2 mr-[10%] xll:mr-0 text-right text-[#002855] xl:text-lg lg:text-md md:text-sm sm:text-[12px] text-semibold leading-relaxed">
                              - {principal.quote.author}
                            </footer>
                          </blockquote>
                        )}
                        <div className="md:mt-5 mt-1">
                          <p className="text-[#002147] font-bold xl:text-lg lg:text-base md:text-sm sm:text-[12px] text-[10px]">
                            {principal.name}
                          </p>
                          <p className="text-[#757575] font-bold xl:text-lg lg:text-base md:text-sm sm:text-[12px] text-[10px]">
                            {principal.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {isActive && (
                  <>
                    {/* Nút chuyển slide bên trái - nằm ngoài card */}
                    <button
                      className="hidden md:block absolute top-1/2 md:left-[2%] lg:left-[5%] transform -translate-y-1/2 bg-[#e5e5e5] rounded-full p-2"
                      onClick={() => swiperRef.current.slidePrev()}
                    >
                      <FaChevronLeft className="xll:w-6 h-auto w-4" />{" "}
                    </button>
                    {/* Nút chuyển slide bên phải - nằm ngoài card */}
                    <button
                      className="hidden md:block absolute top-1/2  md:right-[2%] lg:right-[5%] transform -translate-y-1/2 bg-[#e5e5e5] rounded-full p-2"
                      onClick={() => swiperRef.current.slideNext()}
                    >
                      <FaChevronRight className="xll:w-6 h-auto w-4" />{" "}
                    </button>
                  </>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      <section
        className="hidden lg:flex relative w-full h-[720px] flex-col items-center justify-center bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url(/halloffame/section3.png)" }}
      >
        {/* Tiêu đề Section 3 */}
        <div className="text-center mb-12">
          <h2 className="text-[36px] md:text-4xl font-bold text-[#F9D16F] uppercase">
            {t("student_feedback")}
          </h2>
          <div className="flex justify-center my-5">
            <img
              src="/halloffame/vector.png"
              alt="Divider"
              className="w-[200px] md:w-[500px] h-auto"
            />
          </div>
        </div>

        {/* Slider Splide */}
        <div className="splide w-full ">
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
                      ${
                        isActive
                          ? "lg:w-[840px] w-[840px]"
                          : "lg:w-[420px] w-[420px]"
                      }
                    `}
                    onClick={() => handleClickStudent(index)}
                    key={index}
                  >
                    {/* Ảnh học sinh */}
                    <div className="relative lg:h-[420px] lg:w-[420px] w-[200px] h-[250px] cursor-pointer ">
                      <img
                        src={student.image}
                        alt={student.name[i18n.language]}
                        className="absolute inset-0 w-full h-full object-cover object-top rounded-xl transition-all duration-500"
                      />
                    </div>

                    {/* Frame Avatar */}
                    {!isActive && (
                      <div className="absolute inset-0 lg:w-[420px] lg:h-[420px] w-[200px] h-[250px]  pointer-events-none z-50">
                        <img
                          src="/halloffame/frameavatar.png"
                          alt="Avatar Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Frame Quote */}
                    {isActive && (
                      <div className="absolute inset-0 lg:w-[840px] w-[500px] h-full pointer-events-none z-50 flex items-stretch">
                        <img
                          src="/halloffame/framequote.png"
                          alt="Quote Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Overlay gradient chứa text */}
                    <div
                      className="lg:w-[420px] w-[200px] px-4 lg:py-28 py-20 absolute bottom-0 transition-all duration-500 rounded-b-lg cursor-pointer"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(10, 40, 80, 1) 0%, rgba(30, 60, 120, 0) 100%)",
                      }}
                    >
                      <p className="absolute bottom-10 lg:text-3xl text-base uppercase font-bold text-[#F9D16F]">
                        {student.name[i18n.language]}
                      </p>
                      <p className="absolute bottom-4 lg:text-base text-xs font-semibold text-[#F9D16F]">
                        {student.year[i18n.language]}
                      </p>
                    </div>

                    {/* Hộp giới thiệu mở bên cạnh */}
                    {isActive && (
                      <div
                        className={`${
                          isActive
                            ? "max-w-[250px] md:max-w-[420px] opacity-100"
                            : "max-w-0 opacity-0"
                        } transition-all duration-300 rounde-xl p-6`}
                      >
                        <div style={{ whiteSpace: "pre-line" }}>
                          <p className="lg:text-xl text-base uppercase font-bold text-[#F9D16F] mb-2">
                            {student.name[i18n.language]}
                          </p>
                          <p className="text-sm font-semibold text-[#F9D16F]">
                            {student.archivement[i18n.language]}
                          </p>
                        </div>
                        <div className="my-5">
                          <img src={`/halloffame/vector.png`} alt="Cover" />
                        </div>
                        <p className="text-white md:text-[14px]">
                          "
                          {i18n.language === "vi"
                            ? student.quoteVi
                            : student.quoteEn}
                          "
                        </p>
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
      <section className="hidden lg:flex bg-white relative w-full flex-col items-center justify-center p-40 overflow-hidden">
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
          {t("hallmark_of_fame_02", "Tôn vinh thành tựu - Lan toả cảm xúc")}
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

      <section className="hidden lg:flex bg-white relative w-full h-[570px] overflow-hidden">
        {/* Slider 2 hàng, full width */}
        <div className="absolute top-0 left-0 w-full h-full my-20">
          {/* Hàng ảnh trên */}
          <div className="marquee-container">
            <div className="marquee-track">
              {topImages.map((img, index) => (
                <img
                  key={`top-${index}`}
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {/* Lặp lại để cuộn liên tục */}
              {topImages.map((img, index) => (
                <img
                  key={`top2-${index}`}
                  src={img}
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
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {bottomImages.map((img, index) => (
                <img
                  key={`bottom2-${index}`}
                  src={img}
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
              className="shimmer-text 2xl:w-[550px] xl:w-[400px] w-[300px] mb-8"
            />
          </div>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="xl:w-[433px] w-[300px] mt-2 xl:px-16 px-10 py-2 bg-[#F9D16F] rounded-full font-semibold transition-colors"
          >
            <h3 className="shimmer-text-2 xl:text-[24px] text-[20px] font-bold">
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
      {/* <div className="lg:hidden w-full">
        <img
          src="/halloffame/Footer_mobile.png"
          alt="Footer"
          className="w-full"
        />
      </div> */}
    </>
  );
};

export default HallofFame;
