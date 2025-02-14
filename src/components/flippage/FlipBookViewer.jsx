import React, { useRef, useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";

function FlipBookViewer({ 
  children,
  doublePage = false,
  pageWidth = 550,
  pageHeight = 650,
  flipBookRef,
  setTotalPages,
  totalPages,
  currentPage,
  setCurrentPage,
  inputPage,
  setInputPage,
  programmaticFlip,
  setProgrammaticFlip,
  targetPage,
  setTargetPage
}) {
  const bookContainerRef = useRef(null);

  // Dùng để force re-render FlipBook khi đổi chế độ trang đôi
  const [key, setKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  useEffect(() => {
    function handleResize() {
      // Lấy kích thước khung flipview-container
      const container = document.getElementById("flipview-container");
      if (!container) return;
      const { clientWidth, clientHeight } = container;
  
      // Tính toán tỉ lệ để flipbook vừa khung
      // Giả sử bạn có pageWidth/pageHeight chuẩn, ví dụ 700x900
      const desiredWidth = pageWidth * (doublePage ? 2 : 1); 
      const desiredHeight = pageHeight;
      
      const scaleX = clientWidth / desiredWidth;
      const scaleY = clientHeight / desiredHeight;
      const newZoom = Math.min(scaleX, scaleY, 1); // Giữ zoom <= 1 để không vượt khung
  
      setZoom(newZoom);
    }
  
    window.addEventListener("resize", handleResize);
    handleResize(); // Gọi 1 lần khi mount
  
    return () => window.removeEventListener("resize", handleResize);
  }, [pageWidth, pageHeight, doublePage]);

  // Mỗi khi bật/tắt trang đôi => tăng key => HTMLFlipBook re-mount
  useEffect(() => {
    // Mỗi khi doublePage thay đổi, lật lại về trang 1
    setCurrentPage(1);
    setInputPage(1);
    setKey((prevKey) => prevKey + 1);
  }, [doublePage, pageWidth, pageHeight]);

  // Lắng nghe sự kiện lăn chuột để zoom
  const handleWheelZoom = (event) => {
    event.preventDefault();
    if (!bookContainerRef.current) return;

    const rect = bookContainerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const originX = (mouseX / rect.width) * 100;
    const originY = (mouseY / rect.height) * 100;
    setTransformOrigin(`${originX}% ${originY}%`);

    setZoom((prevZoom) => {
      if (event.deltaY < 0) {
        // Cuộn lên => zoom in
        return Math.min(prevZoom + 0.1, 3);
      } else {
        // Cuộn xuống => zoom out
        return Math.max(prevZoom - 0.1, 1);
      }
    });
  };

  // Khi ref tồn tại hoặc đổi chế độ trang đôi -> update totalPages
  useEffect(() => {
    if (flipBookRef.current) {
      setTimeout(() => {
        const pageCount = flipBookRef.current.pageFlip()?.getPageCount() || 1;
        setTotalPages(pageCount);
      }, 500);
    }
  }, [flipBookRef, doublePage]);

  function handleFlip(e) {
    const newPage = e.data + 1;
    // Cứ mỗi lần lật, cập nhật luôn
    setCurrentPage(newPage);
    setInputPage(newPage);
  }

  // Tính chiều rộng container: nếu doublePage=true -> gấp đôi
  const containerWidth = doublePage
    ? pageWidth * 2
    : pageWidth;

  return (
    <div 
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        perspective: "1500px",
      }}
    >
      <div 
        ref={bookContainerRef}
        style={{
          position: "relative",
          width: containerWidth,
          height: pageHeight,
          maxWidth: "100%",     // Chiếm 90% bề ngang
          maxHeight: "100%",    // Chiếm 90% bề dọc
          margin: "40px auto",
          transform: `scale(${zoom})`,
          transformOrigin,
          transition: "transform 0.s5s ease-out",
          boxShadow: "5px 5px 15px rgba(0, 0, 0, 0.3)",
        }}
        onWheel={handleWheelZoom}
      >
        

        {doublePage ? (
          <HTMLFlipBook
            key={key}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            showCover={true}
            drawShadow={true}
            flippingTime={800}
            usePortrait={false}
            onFlip={handleFlip}
            ref={flipBookRef}
            className="my-flip-book"
            startZIndex={0}
            mobileScrollSupport={false}
          >
            {children}
          </HTMLFlipBook>
        ) : (
          <HTMLFlipBook
            key={key}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            showCover={true}
            drawShadow={true}
            flippingTime={800}
            usePortrait={true}
            onFlip={handleFlip}
            ref={flipBookRef}
            className="my-flip-book"
            startZIndex={0}
            mobileScrollSupport={false}
          >
            {children}
          </HTMLFlipBook>
        )}
      </div>
    </div>
  );
}

export default FlipBookViewer;