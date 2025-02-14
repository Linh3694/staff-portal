import React from "react";
import FlipBookViewer from "./FlipBookViewer";

function MyImageFlipBook({ 
  imageUrls,
  flipBookRef,
  setTotalPages,
  doublePage = false,
  pageWidth,
  pageHeight,
  setCurrentPage,
  inputPage,
  setInputPage,
  totalPages, 
  programmaticFlip,
  setProgrammaticFlip,
  targetPage,
  setTargetPage
}) {
  if (!imageUrls || imageUrls.length === 0) return null;

  // Mỗi URL -> 1 trang
  const pages = imageUrls.map((url, idx) => {
    // idx=0 => trang bìa (cover), idx=1 => trang tiếp theo,...
    const isLeftPage = idx % 2 === 1;  // Tuỳ theo logic, vì cover = index 0
    return (
      <div key={idx} style={{ width: "100%", height: "100%", position: "relative" }}>
        <img
          src={url}
          alt={`page-${idx + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        {/* Nếu bạn chỉ muốn gáy xuất hiện ở trang bên trong (không phải cover),
            thì kiểm tra idx > 0 */}
      {doublePage && idx > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40px", // Độ rộng gáy
              pointerEvents: "none",
              ...(isLeftPage
                ? { right: 0, background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)" }
                : { left: 0, background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)" }
              ),
            }}
          />
        )}
      </div>
    );
  });

  return (
    <FlipBookViewer
    doublePage={doublePage}
    pageWidth={pageWidth}
    pageHeight={pageHeight}
    flipBookRef={flipBookRef} 
    setTotalPages={setTotalPages}
    setCurrentPage={setCurrentPage}
    setInputPage={setInputPage}
    >
      {pages}
    </FlipBookViewer>
  );
}

export default MyImageFlipBook;