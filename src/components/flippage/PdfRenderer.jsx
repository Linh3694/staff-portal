// src/PdfRenderer.js
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Chỉ rõ workerSrc (đã copy pdf.worker.min.mjs vào public/)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js`;

function PdfRenderer({ file, onLoadComplete }) {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = (pdf) => {
    setNumPages(pdf.numPages);
    onLoadComplete && onLoadComplete(pdf.numPages);
  };

  // Render toàn bộ trang PDF => Mỗi trang là 1 "div" => FlipBookViewer sẽ lật
  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      {Array.from(new Array(numPages), (el, index) => (
        <div key={index} className="pdf-page-wrapper">
          <Page
            pageNumber={index + 1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            // Ví dụ muốn chỉnh scale, có thể:
            // scale={0.9}
          />
        </div>
      ))}
    </Document>
  );
}

export default PdfRenderer;