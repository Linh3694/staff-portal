import React from "react";
import FlipBookViewer from "./FlipBookViewer";

function MyImageFlipBook({ imageUrls, doublePage = false, zoom = 1, pageWidth, pageHeight }) {
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
    >
      {pages}
    </FlipBookViewer>
  );
}

export default MyImageFlipBook;