import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import MyImageFlipBook from "../components/flippage/MyImageFlipBook";
import { API_URL } from "../config";

function FlipViewPage() {
  const [searchParams] = useSearchParams();
  const { customName } = useParams(); 
  const navigate = useNavigate(); // 🔥 Dùng để chuyển hướng nếu không mở được trang

  const title = searchParams.get("title") || "";

  const [images, setImages] = useState([]);
  const [doublePage, setDoublePage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActive, setIsActive] = useState(true); // 🔥 Trạng thái của tài liệu
  const [loading, setLoading] = useState(true); // 🔥 Thêm trạng thái loading



  // Mặc định chiều rộng/cao
  const [pageWidth, setPageWidth] = useState(350);
  const [pageHeight, setPageHeight] = useState(500);

  // 1) Lấy danh sách ảnh từ API
  useEffect(() => {
    if (!customName) {
      console.error("❌ Lỗi: Không tìm thấy customName trong URL");
      return;
    }
  
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ Lỗi: Không có token, vui lòng đăng nhập!");
      return;
    }
  
    fetch(`${API_URL}/flippage/get-pdf-status/${encodeURIComponent(customName)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi kiểm tra trạng thái PDF: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.active) {
          console.warn("⚠️ Tài liệu này đã bị vô hiệu hóa.");
          setIsActive(false);
        } else {
          setIsActive(true);
        }
        setLoading(false); // 🔥 Đánh dấu đã tải xong
      })
      .catch((err) => {
        console.error("❌ Lỗi khi kiểm tra trạng thái PDF:", err);
        setLoading(false); // 🔥 Dừng loading ngay cả khi lỗi
      });
  }, [customName]);

  // 2️⃣ Nếu tài liệu bị vô hiệu hóa, không tải ảnh
  useEffect(() => {
    if (!isActive) return; // 🔥 Nếu active = false, không gọi API tải ảnh

    fetch(`${API_URL}/flippage/get-images/${encodeURIComponent(customName)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi tải ảnh: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
          setCurrentPage(1);
        } else {
          console.error("❌ Không tìm thấy images:", data.error);
        }
      })
      .catch((err) => console.error("❌ Lỗi khi tải ảnh:", err));
  }, [customName, isActive]);


  // 2) Dựa vào ảnh đầu tiên -> tính ratio -> set pageWidth/pageHeight
  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.src = images[0];
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const maxHeight = 500;
        setPageHeight(maxHeight);
        setPageWidth(Math.round(ratio * maxHeight));
      };
    }
  }, [images]);

  // 3️⃣ Nếu tài liệu bị vô hiệu hóa, hiển thị thông báo
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-gray-500">⏳ Đang kiểm tra trạng thái tài liệu...</h2>
      </div>
    );
  }
  
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600">
          🚫 Tài liệu này đã bị vô hiệu hóa.
        </h2>
        <button
          className="mt-4 px-6 py-2 bg-[#002147] text-white font-bold rounded-lg hover:bg-[#001b33] transition-all"
          onClick={() => navigate("/dashboard")} // 🔥 Chuyển hướng về dashboard thay vì login
        >
          Quay lại trang chính
        </button>
      </div>
    );
  }


  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(/pdf/back.png)`}} // 🔥 Chèn ảnh nền
    >
      <div>
        {/* Icon góc trên bên trái */}
        <img
          src="/pdf/wellsping-logo.png"
          alt="Wellspring Logo"
          className="absolute top-5 left-5 w-[240px]" // 🔥 Cố định ở góc trên trái
        />

        {/* Icon góc trên bên phải */}
        <img
          src="/pdf/happyjourney.png"
          alt="WSHN Logo"
          className="absolute top-2 right-5 w-[200px]" // 🔥 Cố định ở góc trên phải
        />
      </div>

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