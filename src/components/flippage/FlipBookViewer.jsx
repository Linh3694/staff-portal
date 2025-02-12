import React, { useRef, useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";

function FlipBookViewer({ 
  children, 
  doublePage = false, 
  pageWidth = 500,
  pageHeight = 650, 
}) {
  const flipBookRef = useRef(null);
  const bookContainerRef = useRef(null);

  // Dùng để force re-render FlipBook khi đổi chế độ trang đôi
  const [key, setKey] = useState(0);
  // Thu phóng
  const [zoom, setZoom] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState("center center");
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  // Xử lý flip => cập nhật currentPage
  const handleFlip = (e) => {
    setCurrentPage(e.data + 1);
    setInputPage(e.data + 1);
  };

  const goToPrevPage = () => {
    if (flipBookRef.current?.pageFlip() && currentPage > 1) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const goToNextPage = () => {
    if (flipBookRef.current?.pageFlip() && currentPage < totalPages) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const goToPage = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(inputPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      flipBookRef.current?.pageFlip()?.flip(pageNumber - 1);
      setCurrentPage(pageNumber);
    } else {
      alert(`Số trang không hợp lệ! Vui lòng nhập từ 1 đến ${totalPages}`);
    }
  };

  // Tính chiều rộng container: nếu doublePage=true -> gấp đôi
  const containerWidth = doublePage
    ? pageWidth * 2
    : pageWidth;

  return (
    <div 
      style={{
        width: "100%",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        perspective: "1500px",
      }}
    >
      <div 
        ref={bookContainerRef}
        className="book-spine-container"
        style={{
          position: "relative",
          width: containerWidth,
          height: pageHeight,
          margin: "40px auto",
          transform: `scale(${zoom})`,
          transformOrigin,
          transition: "transform 0.5s ease-out",
          border: "2px solid #ccc",
          borderRadius: "8px",
          boxShadow: "5px 5px 15px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
        onWheel={handleWheelZoom}
      >
        {/* Gáy sách (chỉ khi trang đôi và không phải bìa) */}
        {doublePage && currentPage > 1 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              width: "2px",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              boxShadow: "1px 0px 5px rgba(0, 0, 0, 0.1)",
              zIndex: 5,
            }}
          />
        )}

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

      {/* Thanh điều khiển */}
      <div className="flex flex-row gap-16">
        <button onClick={goToPrevPage}>
          <FaRegArrowAltCircleLeft size={32} />
        </button>

        {/* Ô nhập số trang */}
        <form onSubmit={goToPage} className="flex items-center gap-2">
          <input
            type="number"
            className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#002147] focus:outline-none"
            value={inputPage}
            min="1"
            max={totalPages}
            onChange={(e) => setInputPage(e.target.value)}
          />
          <span>/ {totalPages}</span>
          <button
            type="submit"
            className="px-3 py-1 bg-[#002147] text-white font-bold rounded-lg hover:bg-[#001635] transition"
          >
            Đi
          </button>
        </form>

        <button onClick={goToNextPage}>
          <FaRegArrowAltCircleRight size={32} />
        </button>
      </div>
    </div>
  );
}

export default FlipBookViewer;