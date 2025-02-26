import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShinyText from "../components/function/ShinyText";
import { useNavigate } from "react-router-dom";
import AnimatedContent from "../components/function/AnimatedContent";
import { BiChevronsDown } from "react-icons/bi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const principals = [
  {
    name: "TS. Nguyễn Vĩnh Sơn",
    title: "Tổng Hiệu trưởng Wellspring Hanoi",
    message:
      "Wellspring Hanoi không chỉ cung cấp kiến thức, kỹ năng và những trải nghiệm học tập đa dạng mà còn là một cộng đồng giáo dục hạnh phúc, nơi mỗi học sinh được khuyến khích phát triển toàn diện về tri thức-trí tuệ, năng lượng-cảm xúc và nhân cách-tâm hồn.",
    image: "/halloffame/nguyenvinhson.png",
  },
  {
    name: "Cô Lê Thuý Ngà",
    title: "Hiệu trưởng khối Tiểu Học",
    message:
      "Chúng tôi cam kết xây dựng môi trường giáo dục tràn đầy năng lượng, yêu thương và sáng tạo, giúp học sinh phát huy hết tiềm năng.",
    image: "/halloffame/nguyenthuha.png",
  },
  {
    name: "Cô Hoàng Thị Minh",
    title: "Hiệu trưởng khối Trung Học",
    message:
      "Ở Wellspring, mỗi học sinh được trân trọng và phát triển một cách toàn diện, sẵn sàng hội nhập và đóng góp vào tương lai.",
    image: "/halloffame/hoangthiminh.jpg",
  },
];

const extendedPrincipals = [
  principals[principals.length - 1],
  ...principals,
  principals[0],
];

gsap.registerPlugin(ScrollTrigger);

const HallofFame = () => {
  const videoRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

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

  useEffect(() => {
    // Parallax cho Section 1 (video background)
    gsap.to(section1Ref.current, {
      y: -100,
      ease: "none",
      scrollTrigger: {
        trigger: section1Ref.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Parallax cho Section 2 (có thể áp dụng cho toàn section hoặc các thành phần riêng bên trong)
    gsap.to(section2Ref.current, {
      y: -50,
      ease: "none",
      scrollTrigger: {
        trigger: section2Ref.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // Parallax cho các phần tử cụ thể bên trong Section 2 (ví dụ: hình ảnh trong carousel)
    gsap.utils.toArray(".parallax-item").forEach((item) => {
      gsap.to(item, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: item,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }, []);

  return (
    <>
      {/* First Section (Video Background) */}
      {/* Section 1: Video Background */}
      <section
        ref={section1Ref}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src="/halloffame/homepage.mp4"
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          disablePictureInPicture
          className="absolute top-0 left-0 w-full h-full object-cover"
        ></video>
        <div className="absolute left-1/2 md:bottom-20 bottom-32 transform -translate-x-1/2 z-10">
          <AnimatedContent
            distance={50}
            direction="vertical"
            reverse={false}
            config={{ tension: 30, friction: 50 }}
            initialOpacity={0}
            animateOpacity
            scale={0.9}
            threshold={0.2}
          >
            <button
              className="w-[300px] parallax-item animate-bounce border bg-[#002147] font-semibold text-xl px-7 py-2 rounded-full"
              onClick={() => navigate("/hall-of-honor/detail")}
            >
              <div className="flex items-center justify-center">
                <BiChevronsDown size={28} className="text-[#ffffffa4] mr-2" />
                <ShinyText
                  text="Cuộn để khám phá"
                  disabled={false}
                  speed={2}
                  className="custom-class"
                />
              </div>
            </button>
          </AnimatedContent>
        </div>
      </section>

      {/* Section 2: Carousel */}
      <section
        ref={section2Ref}
        className="relative w-full bg-white flex flex-col items-center justify-center overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        <div className="w-full text-center mt-20 mb-10">
          <h2 className="text-[32px] font-bold text-[#002147] uppercase tracking-wide">
            Thông điệp của Hiệu trưởng
          </h2>
        </div>
        <div
          className="relative w-full mx-auto overflow-hidden"
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
            {extendedPrincipals.map((principal, index) => (
              <div
                key={index}
                // Sử dụng inline style để gán kích thước slide responsive
                style={{ width: itemWidth, height: itemHeight }}
                className={`flex-shrink-0 bg-[#F8F8F8] rounded-[20px] md:p-10 p-3 mx-[10px] transition-opacity duration-500 ease-in-out 
                  ${
                    index === currentIndex
                      ? "opacity-100 scale-100"
                      : "opacity-20 scale-70"
                  }`}
              >
                <div className="flex h-full items-center">
                  <div className="md:w-1/2 w-2/3 md:mr-0 mr-2 flex flex-col">
                    <p className="md:text-[16px] text-[10px] uppercase tracking-wide text-[#002147]">
                      Hall Of Honor
                    </p>
                    <div className="md:mb-20 mb-10 md:mt-10 mt-5">
                      <p
                        className="italic font-medium text-[#002147] leading-relaxed mb-4
                      md:text-[24px]
                      text-[10px]"
                      >
                        "{principal.message}"
                      </p>
                      <div>
                        <p className="text-[#002147] font-bold md:text-[24px] text-[10px]">
                          {principal.name}
                        </p>
                        <p className="text-[#757575] md:text-[24px] text-[10px]">
                          {principal.title}
                        </p>
                        <div className="absolute md:bottom-12 bottom-4">
                          {index === currentIndex && (
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
                  <div className="w-1/2 flex justify-center">
                    <img
                      src={principal.image}
                      alt={principal.name}
                      className="parallax-item rounded-2xl object-cover"
                      style={{
                        width: itemWidth * 0.4,
                        height: itemHeight * 0.85,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HallofFame;
