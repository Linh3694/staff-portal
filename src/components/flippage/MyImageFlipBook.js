import React from "react";
import FlipBookViewer from "./FlipBookViewer";

function MyImageFlipBook({ 
  imageUrls,
  flipBookRef,
  setTotalPages,
  doublePage = false,
  pageWidth,
  pageHeight,
  currentPage,
  setCurrentPage,
  inputPage,
  setInputPage,
  totalPages, 
}) {
  if (!imageUrls || imageUrls.length === 0) return null;

  // Mỗi URL -> 1 trang
  const pages = imageUrls.map((url, idx) => (
    <div key={idx} style={{ width: "100%", height: "100%" }}>
      <img
        src={url}
        alt={`page-${idx + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  ));

  return (
    <FlipBookViewer
    doublePage={doublePage}
    pageWidth={pageWidth}
    pageHeight={pageHeight}
    flipBookRef={flipBookRef} 
    setTotalPages={setTotalPages}
    totalPages={totalPages}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
    inputPage={inputPage}
    setInputPage={setInputPage}
    >
      {pages}
    </FlipBookViewer>
  );
}

export default MyImageFlipBook;