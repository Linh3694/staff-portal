import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import MyImageFlipBook from "../components/flippage/MyImageFlipBook";
import { API_URL } from "../config";

function FlipViewPage() {
  const [searchParams] = useSearchParams();
  const { customName } = useParams(); 
  const title = searchParams.get("title") || "";

  const [images, setImages] = useState([]);
  const [doublePage, setDoublePage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mặc định chiều rộng/cao
  const [pageWidth, setPageWidth] = useState(500);
  const [pageHeight, setPageHeight] = useState(650);

  // 1) Lấy danh sách ảnh từ API
  useEffect(() => {
    if (!customName) {
      console.error("❌ Lỗi: Không tìm thấy customName trong URL");
      return;
    }
    fetch(`${API_URL}/flippage/get-images/${encodeURIComponent(customName)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi tải ảnh: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
          setCurrentPage(1); // Reset về trang 1
        } else {
          console.error("❌ Không tìm thấy images:", data.error);
        }
      })
      .catch((err) => console.error("❌ Lỗi khi tải ảnh:", err));
  }, [customName]);

  // 2) Dựa vào ảnh đầu tiên -> tính ratio -> set pageWidth/pageHeight
  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.src = images[0];
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const maxHeight = 650;
        setPageHeight(maxHeight);
        setPageWidth(Math.round(ratio * maxHeight));
      };
    }
  }, [images]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">
        📖 FlipBook {title && `- ${title}`}
      </h2>

      {/* Bật tắt chế độ trang đôi */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={doublePage}
          onChange={() => {
            setDoublePage(!doublePage);
            setCurrentPage(1);
         }}
        />
        {" Xem trang đôi"}
      </label>

      {/* Render FlipBook */}
      {images.length > 0 ? (
        <MyImageFlipBook
          imageUrls={images}
          doublePage={doublePage}
          currentPage={currentPage}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
      ) : (
        <p className="text-gray-600 mt-4">Đang tải hoặc chưa có dữ liệu...</p>
      )}
    </div>
  );
}

export default FlipViewPage;