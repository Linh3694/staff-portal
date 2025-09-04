import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MyImageFlipBook from "./MyImageFlipBook";
import { API_URL } from "../../core/config";

function FlipViewPage() {
  const { customName } = useParams();
  const navigate = useNavigate(); // 🔥 Dùng để chuyển hướng nếu không mở được trang

  const [images, setImages] = useState([]);
  const [doublePage, setDoublePage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActive, setIsActive] = useState(true); // 🔥 Trạng thái của tài liệu
  const [loading, setLoading] = useState(true); // 🔥 Thêm trạng thái loading
  const [showPageList, setShowPageList] = useState(false);
  const [programmaticFlip, setProgrammaticFlip] = useState(false);
  const [targetPage, setTargetPage] = useState(null);

  const [bookmarks, setBookmarks] = useState([]);
  const [inputPage, setInputPage] = useState(1);
  const flipBookRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);

  const [ratio, setRatio] = useState(1);

  // Mặc định chiều rộng/cao
  const [pageWidth, setPageWidth] = useState(550);
  const [pageHeight, setPageHeight] = useState(650);

  const oldDimensionsRef = useRef({ width: 550, height: 650 });

  useEffect(() => {
    if (!customName) {
      console.error("❌ Lỗi: Không tìm thấy customName trong URL");
      navigate("/login");
      return;
    }

    // Kiểm tra customName có tồn tại trong hệ thống không
    fetch(
      `${API_URL}/flippage/check-custom-name/${encodeURIComponent(customName)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi kiểm tra customName: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.exists) {
          console.warn("⚠️ customName không tồn tại trong hệ thống.");
          navigate("/login"); // Chuyển về trang login nếu không tồn tại
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi khi kiểm tra customName:", err);
        navigate("/login"); // Chuyển về login nếu có lỗi
      });
  }, [customName, navigate]);

  // 1) Lấy danh sách ảnh từ API
  useEffect(() => {
    if (!customName) {
      console.error("❌ Lỗi: Không tìm thấy customName trong URL");
      navigate("/login");
      return;
    }

    fetch(
      `${API_URL}/flippage/get-pdf-status/${encodeURIComponent(customName)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok)
          throw new Error(`Lỗi kiểm tra trạng thái PDF: ${res.status}`);
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
        const computedRatio = img.naturalWidth / img.naturalHeight;
        setRatio(computedRatio);
        // Cập nhật kích thước mặc định dựa trên giá trị maxHeight
        const maxHeight = 700;
        setPageHeight(maxHeight);
        setPageWidth(Math.round(computedRatio * maxHeight));
      };
    }
  }, [images]);

  useEffect(() => {
    fetch(`${API_URL}/flippage/get-bookmarks/${customName}`, {
      method: "GET",
      headers: {
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
        setTotalPages(pageCount); // 📌 Gửi totalPages về FlipViewPage
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
    // Dùng luôn hàm helper với số trang từ input (đã 1-indexed)
    handleGoToPage(inputPage);
  };

  const handleGoToPage = (pageNumber) => {
    if (!flipBookRef.current) return;

    if (pageNumber < 1 || pageNumber > totalPages) {
      alert(`Số trang không hợp lệ! (1 - ${totalPages})`);
      return;
    }

    setTargetPage(pageNumber);

    // Đổi từ flip(...) sang turnToPage(...)
    flipBookRef.current.pageFlip().turnToPage(pageNumber - 1);
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
      // Lưu kích thước cũ (nếu thật sự cần)
      oldDimensionsRef.current = { width: pageWidth, height: pageHeight };

      // Bật fullscreen
      container.requestFullscreen().catch((err) => alert(err.message));
    } else {
      // Thoát fullscreen
      document.exitFullscreen().catch((err) => alert(err.message));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Đã thoát fullscreen
        setIsFullscreen(false);
        // Khôi phục lại kích thước cũ
        setPageWidth(oldDimensionsRef.current.width);
        setPageHeight(oldDimensionsRef.current.height);
      } else {
        // Vừa vào fullscreen
        setIsFullscreen(true);
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
        <h2 className="text-2xl font-bold text-gray-500">
          ⏳ Đang kiểm tra trạng thái tài liệu...
        </h2>
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
      className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
      style={{
        backgroundImage: isFullscreen
          ? "url(/pdf/fullscreen-back.png)"
          : "url(/pdf/back.png)",
        backgroundSize: "cover",
      }}
    >
      <div>
        <img
          src="/wellspring-logo.png"
          alt="Wellspring Logo"
          className="absolute top-4 left-2 w-48 sm:w-32 md:w-[240px]"
        />
        <img
          src="/pdf/happyjourney.png"
          alt="WSHN Logo"
          className="absolute top-2 right-2 w-40 sm:w-28 md:w-[200px]"
        />
      </div>
      <div className="relative w-full h-full flex justify-center items-center">
        {/* Logo góc trên */}

        {images.length > 0 ? (
          <>
            <div className="h-full flex-grow flex items-center justify-center p-4">
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
                totalPages={totalPages}
                programmaticFlip={programmaticFlip}
                setProgrammaticFlip={setProgrammaticFlip}
                targetPage={targetPage}
                setTargetPage={setTargetPage}
              />
            </div>

            {/* Thanh điều khiển */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-500 bg-opacity-70 py-2 flex flex-wrap justify-center items-center gap-4 sm:gap-10 px-2 z-50">
              <button
                onClick={() => setShowPageList(!showPageList)}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-list-ul"></i>
              </button>

              <button
                onClick={() => setShowBookmarkPanel(!showBookmarkPanel)}
                className="text-white hover:text-gray-300"
              >
                <i className="far fa-bookmark"></i>
              </button>

              <button
                onClick={() => {
                  setDoublePage(!doublePage);
                  setCurrentPage(1);
                }}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-book-open"></i>
              </button>

              <button
                onClick={goToFirstPage}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-angle-double-left"></i>
              </button>

              <button
                onClick={goToPrevPage}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-angle-left"></i>
              </button>

              <form
                onSubmit={goToPage}
                className="flex items-center bg-white px-2 rounded-md shadow-md"
              >
                <input
                  type="number"
                  className="w-10 h-8 text-left text-sm font-semibold bg-transparent border-none outline-none no-spinner"
                  value={inputPage}
                  min="1"
                  max={totalPages}
                  onChange={(e) => setInputPage(Number(e.target.value))}
                />
                <span className="text-gray-700 text-sm font-semibold">
                  / {totalPages}
                </span>
              </form>

              <button
                onClick={goToNextPage}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-angle-right"></i>
              </button>

              <button
                onClick={goToLastPage}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-angle-double-right"></i>
              </button>

              <button
                onClick={toggleFullScreen}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-expand"></i>
              </button>
            </div>

            {/* Panel Bookmark */}
            {bookmarks.length > 0 && (
              <aside
                className={`fixed top-0 left-0 h-full w-64 sm:w-80 bg-gray-500 p-4 shadow-md overflow-auto z-50 transform transition-transform duration-500 ${
                  showBookmarkPanel ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <h3 className="text-lg text-center text-white font-bold mb-4 mt-2">
                  Bookmarks
                </h3>
                {bookmarks.map((bm, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleGoToPage(bm.page);
                      setShowBookmarkPanel(false);
                    }}
                    className="block w-full text-center py-2 px-3 text-[#002147] bg-gray-100 rounded-full mb-3"
                  >
                    {bm.title}
                  </button>
                ))}
              </aside>
            )}

            {/* Panel Danh sách trang - đặt ở bên phải để tránh chồng lấn */}
            {images.length > 0 && (
              <aside
                className={`fixed top-0 right-0 h-full w-64 sm:w-80 bg-gray-500 p-4 shadow-md overflow-auto z-50 transform transition-transform duration-500 ${
                  showPageList ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <h3 className="text-lg text-center text-white font-bold mb-4 mt-2">
                  Danh sách trang
                </h3>
                {images.map((img, idx) => {
                  const pageNumber = idx + 1;
                  return (
                    <div key={idx} className="mb-2">
                      <button
                        onClick={() => handleGoToPage(pageNumber)}
                        className="block w-full text-center py-2 px-3 text-white hover:bg-gray-100 rounded"
                      >
                        <img
                          src={img}
                          alt={`page-${pageNumber}`}
                          className="w-full h-[80px] sm:h-[100px] border object-cover rounded"
                        />
                        {pageNumber}
                      </button>
                    </div>
                  );
                })}
              </aside>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-gray-600 text-xl sm:text-2xl text-center">
              Tài liệu này đang bị khóa. Vui lòng liên hệ Admin để biết thêm chi
              tiết.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlipViewPage;
