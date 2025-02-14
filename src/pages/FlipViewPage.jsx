import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import MyImageFlipBook from "../components/flippage/MyImageFlipBook";
import { API_URL } from "../config";
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";


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

  const [bookmarks, setBookmarks] = useState([]);
  const [inputPage, setInputPage] = useState(1);
  const flipBookRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);


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


useEffect(() => {
  fetch(`${API_URL}/flippage/get-bookmarks/${customName}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.bookmarks) setBookmarks(data.bookmarks);
    })
    .catch((err) => console.error("❌ Lỗi khi lấy bookmarks:", err));
}, [customName]);

useEffect(() => {
  if (flipBookRef.current) {
    setTimeout(() => {
      const pageCount = flipBookRef.current.pageFlip()?.getPageCount() || 1;
      setTotalPages(pageCount);  // 📌 Gửi totalPages về FlipViewPage
    }, 500);
  }
}, [flipBookRef, doublePage]);

const goToPrevPage = () => {
  if (flipBookRef.current && flipBookRef.current.pageFlip()) {
    if (currentPage > 1) {
      flipBookRef.current.pageFlip().flipPrev();
      setCurrentPage((prev) => prev - 1); // Cập nhật state
    }
  }
};

const goToNextPage = () => {
  if (flipBookRef.current && flipBookRef.current.pageFlip()) {
    if (currentPage < totalPages) {
      flipBookRef.current.pageFlip().flipNext();
      setCurrentPage((prev) => prev + 1); // Cập nhật state
    }
  }
};

const goToPage = (e) => {
  e.preventDefault();
  if (!flipBookRef.current || !flipBookRef.current.pageFlip()) return;

  const pageNumber = parseInt(inputPage, 10);
  if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
    alert(`Số trang không hợp lệ! (1 - ${totalPages})`);
    return;
  }
  // Lật đến trang (pageNumber - 1) do flipbook tính từ 0
  flipBookRef.current.pageFlip().flip(pageNumber - 1);

  // Không cần setCurrentPage() ở đây nếu onFlip đã cập nhật. 
  // Hoặc nếu muốn phản hồi ngay lập tức, ta có thể setCurrentPage(pageNumber) ở đây,
  // rồi onFlip cũng sẽ chạy lại (nhưng không sao, giá trị vẫn như nhau).
};

const goToFirstPage = () => {
  if (flipBookRef.current && flipBookRef.current.pageFlip()) {
    flipBookRef.current.pageFlip().flip(0);
    // Không cần setTimeout, handleFlip sẽ cập nhật currentPage khi flip xong
  }
};

const goToLastPage = () => {
  if (flipBookRef.current && flipBookRef.current.pageFlip()) {
    const lastPageIndex = flipBookRef.current.pageFlip()?.getPageCount() - 1;
    flipBookRef.current.pageFlip().flip(lastPageIndex);
    // Không cần setTimeout, handleFlip sẽ cập nhật currentPage khi flip xong
  }
};

const toggleFullScreen = () => {
  const container = document.getElementById("flipview-container");
  if (!container) return;
  if (!document.fullscreenElement) {
    container.requestFullscreen()
      .then(() => {
        setIsFullscreen(true);
      })
      .catch((err) => {
        alert(`Lỗi bật toàn màn hình: ${err.message}`);
      });
  } else {
    document.exitFullscreen()
      .then(() => {
        setIsFullscreen(false);
      })
      .catch((err) => {
        alert(`Lỗi tắt toàn màn hình: ${err.message}`);
      });
  }
};

useEffect(() => {
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  };
}, []);


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
      id="flipview-container"
      className="fixed top-0 left-0 w-screen h-screen overflow-hidden"
      style={{
        backgroundImage: isFullscreen
          ? "url(/pdf/fullscreen-back.png)" // background khi fullscreen
          : "url(/pdf/back.png)"            // background mặc định
      }}
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
      
      {/* Render FlipBook */}
      {images.length > 0 ? ( 
        <>
        <div className="flex min-h-screen min-w-screen items-center justify-center">
        <MyImageFlipBook
          imageUrls={images}
          doublePage={doublePage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          flipBookRef={flipBookRef}
          setTotalPages={setTotalPages}
          inputPage={inputPage}
          setInputPage={setInputPage}
          totalPages={totalPages}  // 📌 Nhận totalPages từ FlipBookViewer
        />
         </div>
        {/* Thanh điều khiển */}
        <div className="fixed bottom-0 left-0 w-full bg-gray-500 bg-opacity-50 py-2 flex justify-center items-center gap-10">
            {/* Icon danh sách trang */}
            <button className="text-white hover:text-gray-300">
              <i className="fas fa-list-ul"></i>
            </button>

            {/* Icon đánh dấu trang */}
            <button
              onClick={() => setShowBookmarkPanel(!showBookmarkPanel)}
              className="text-white hover:text-gray-300"
            >
              <i className="far fa-bookmark"></i>
            </button>

            {/* Nút bật/tắt chế độ trang đôi */}
            <button 
              onClick={() => {
                setDoublePage(!doublePage);
                setCurrentPage(1);
              }}
              className="text-white hover:text-gray-300"
            >
              <i className="fas fa-book-open"></i>
            </button>

            {/* Nút về trang đầu */}
              <button onClick={goToFirstPage} className="text-white hover:text-gray-300">
                <i className="fas fa-angle-double-left"></i>
              </button>

              {/* Nút trang trước */}
              <button onClick={goToPrevPage} className="text-white hover:text-gray-300">
                <i className="fas fa-angle-left"></i>
              </button>

              {/* Ô nhập số trang */}
              <form onSubmit={goToPage} className="flex items-center bg-white px-2 rounded-md shadow-md">
              <input
                  type="number"
                  className="w-8 h-8 text-left text-sm font-semibold bg-transparent border-none outline-none no-spinner"
                  value={inputPage}
                  min="1"
                  max={totalPages}
                  onChange={(e) => setInputPage(Number(e.target.value))}
                />
                <span className="text-gray-700 text-sm font-semibold">/ {totalPages}</span>
              </form>

              {/* Nút trang sau */}
              <button onClick={goToNextPage} className="text-white hover:text-gray-300">
                <i className="fas fa-angle-right"></i>
              </button>

              {/* Icon trang cuối */}
              <button onClick={goToLastPage} className="text-white hover:text-gray-300">
                <i className="fas fa-angle-double-right"></i>
              </button>

            {/* Chế độ fullscreen */}
            <button onClick={toggleFullScreen} className="text-white hover:text-gray-300">
              <i className="fas fa-expand"></i>
            </button>

            {/* Tìm kiếm trang */}
            <button className="text-white hover:text-gray-300">
              <i className="fas fa-search"></i>
            </button>
          </div>

          {showBookmarkPanel && bookmarks.length > 0 && (
          <aside className="fixed top-0 left-0 h-full w-64 bg-white p-4 shadow-md overflow-auto z-50">
            <h3 className="text-lg font-bold mb-4">Bookmarks</h3>
            {bookmarks.map((bm, index) => (
              <button
                key={index}
                onClick={() => {
                  // Lật đến trang tương ứng (chú ý flip nhận chỉ số 0-based)
                  if (flipBookRef.current && flipBookRef.current.pageFlip()) {
                    flipBookRef.current.pageFlip().flip(bm.page - 1);
                  }
                  // Ẩn panel sau khi chọn
                  setShowBookmarkPanel(false);
                }}
                className="block w-full text-left py-2 px-3 text-blue-600 hover:bg-gray-100 rounded"
              >
                {bm.title}
              </button>
            ))}
          </aside>
        )}
        </>
      ) : (
        <p className="text-gray-600 text-2xl">Tài liệu đã bị khoá. Vui lòng liên hệ admin để biết thêm chi tiết.</p>
      )}
    </div>
  );
}

export default FlipViewPage;