import React, { useEffect, useState, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import { API_URL, BASE_URL } from "../../core/config";
import { FaAngleRight } from "react-icons/fa6";

function LibraryManagement() {
  // Danh sách Library lấy từ backend
  const [libraries, setLibraries] = useState([]);
  // Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // Giỏ sách (các sách đã chọn)
  const [cart, setCart] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState({});

  // === Thêm state cho Modal Mượn Sách ===
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  // Thông tin học sinh nhập vào form
  const [studentInfo, setStudentInfo] = useState({
    studentId: "",
    name: "",
    email: "",
    className: "",
    photoUrl: "",
  });

  // ================ NEW: Autocomplete Học sinh ================
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // ===== 1) Fetch dữ liệu Libraries (full-libraries) =====
  useEffect(() => {
    fetch(`${API_URL}/libraries/full-libraries`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLibraries(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching libraries:", err);
      });
  }, []);

  // ===== 2) Tìm kiếm Library theo searchTerm =====
  const filteredLibraries = libraries.filter((lib) =>
    lib.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== 3) Toggle expand/collapse books list =====
  const toggleExpand = (libraryId) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [libraryId]: !prev[libraryId],
    }));
  };

  // ----------------------------------------------------
  //  =========== CHỨC NĂNG THÊM SÁCH VÀO GIỎ ===========
  // ----------------------------------------------------
  // (A) Thêm 1 sách vào giỏ nếu đang ở trạng thái Sẵn sàng
  //     Và kiểm tra trùng lặp (generatedCode).
  const handleSelectBook = (library, book) => {
    const alreadyInCart = cart.some(
      (item) => item.bookCode === book.generatedCode
    );
    if (alreadyInCart) {
      alert("Sách này đã có trong giỏ rồi!");
      return;
    }
    const newItem = {
      libraryId: library._id,
      libraryTitle: library.title,
      bookCode: book.generatedCode || "NoCode",
      bookStatus: book.status,
    };
    setCart([...cart, newItem]);
  };

  // Xoá 1 sách khỏi giỏ
  const handleRemoveBook = (idx) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
  };

  // Xoá tất cả trong giỏ
  const handleClearAll = () => {
    setCart([]);
  };

  // ----------------------------------------------------
  // =========== MỞ / ĐÓNG MODAL MƯỢN SÁCH ==============
  // ----------------------------------------------------
  // (B) Khi click nút 'Mượn sách' => mở modal
  const handleBorrow = () => {
    if (cart.length === 0) return;
    setShowBorrowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowBorrowModal(false);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setStudentInfo({
      studentId: "",
      name: "",
      email: "",
      className: "",
      photoUrl: "",
    });
  };

  // ----------------------------------------------------
  // =========== AUTOCOMPLETE HỌC SINH ==================
  // ----------------------------------------------------
  // 2.1) Người dùng gõ vào input => fetch gợi ý
  const handleSearchStudent = async (value) => {
    // setStudentInfo((prev) => ({ ...prev, studentId: value }));
    if (!value.trim()) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/students/search?q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      // data là mảng gợi ý: [{_id, studentId, fullName, className, email, photoUrl}, ...]
      if (Array.isArray(data)) {
        setStudentSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching student suggestions:", err);
    }
  };

  // 2.2) Chọn 1 suggestion => fill studentInfo + fetch ngay
  const handleSelectStudentSuggestion = (student) => {
    setStudentInfo({
      studentId: student._id || "",
      studentCode: student.studentId || "",
      name: student.fullName || "",
      email: student.email || "",
      className: student.className || "",
      photoUrl: student.photoUrl || "",
    });
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery(student.studentId || "");
  };

  // ----------------------------------------------------
  // =========== XÁC NHẬN MƯỢN SÁCH ===============
  // ----------------------------------------------------
  // (C) Xác nhận mượn => Gọi API /borrow-multiple
  const handleConfirmBorrow = () => {
    if (!studentInfo.studentId.trim()) {
      alert("Vui lòng chọn học sinh trước khi mượn sách!");
      return;
    }
    // Gửi cart + studentId (hoặc name, email...) lên server
    const payload = {
      studentId: studentInfo.studentId, // Hoặc tuỳ ý
      borrowedBooks: cart.map((item) => ({
        libraryId: item.libraryId,
        bookCode: item.bookCode,
      })),
    };

    fetch(`${API_URL}/libraries/borrow-multiple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(`Mượn sách thất bại: ${data.error}`);
        } else {
          alert("Mượn sách thành công!");
          // Xoá giỏ, đóng modal
          setCart([]);
          setShowBorrowModal(false);
          setStudentInfo({
            studentId: "",
            studentCode: "",
            name: "",
            email: "",
            className: "",
            photoUrl: "",
          });
          // fetch lại libraries để cập nhật trạng thái
          return fetch(`${API_URL}/libraries/full-libraries`)
            .then((r) => r.json())
            .then((updated) => setLibraries(updated))
            .catch((err) => console.error(err));
        }
      })
      .catch((err) => {
        console.error("Error borrowing multiple:", err);
      });
  };

  // ============== Render Giao Diện =================
  return (
    <div className="flex w-full h-full p-8">
      {/* Cột bên trái: Danh sách Library + sách */}
      <div className="flex-1 w-full">
        {/* Ô tìm kiếm */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl border shadow border-gray-100"
          />
        </div>

        {/* Danh sách Library */}
        {filteredLibraries.map((lib) => {
          // Đếm số sách theo trạng thái
          const readyCount = lib.books.filter(
            (b) => b.status === "Sẵn sàng"
          ).length;
          const borrowedCount = lib.books.filter(
            (b) => b.status === "Đang mượn"
          ).length;
          const reservedCount = lib.books.filter(
            (b) => b.status === "Đã đặt trước"
          ).length;
          const overdueCount = lib.books.filter(
            (b) => b.status === "Quá hạn"
          ).length;

          return (
            <div
              key={lib._id}
              className="w-full bg-white rounded-2xl shadow p-4 mb-4"
            >
              {/* Header Library */}
              <div className="flex items-stretch">
                <div className="px-7">
                  {lib.coverImage ? (
                    <img
                      src={`${BASE_URL}/${lib.coverImage}`}
                      alt={lib.title}
                      className="w-16 h-20 object-fill rounded"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center text-sm">
                      No Image
                    </div>
                  )}
                </div>

                {/* Cột thông tin */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Dòng 1: Tên sách (trái) + Chấm tròn trạng thái (phải) */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold mb-1">{lib.title}</h3>
                      <div className="flex items-center gap-2">
                        {readyCount > 0 && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: "#3E8B00" }}
                          >
                            {readyCount}
                          </div>
                        )}
                        {borrowedCount > 0 && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: "#F5AB00" }}
                          >
                            {borrowedCount}
                          </div>
                        )}
                        {reservedCount > 0 && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: "#800080" }}
                          >
                            {reservedCount}
                          </div>
                        )}
                        {overdueCount > 0 && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: "#FF0000" }}
                          >
                            {overdueCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dòng 2: Tác giả */}
                  <div>
                    <p className="text-lg text-gray-600">
                      {lib.authors?.join(", ") || "Chưa có tác giả"}
                    </p>
                  </div>

                  {/* Dòng 3: Nút Xem tất cả + Số lượt mượn */}
                  <div className="flex flex-row items-center justify-between mt-2">
                    <button
                      onClick={() => toggleExpand(lib._id)}
                      className="text-[#757575] mt-1 text-sm flex items-center"
                    >
                      Xem tất cả
                      <span
                        className={`ml-1 transition-transform duration-300 ${
                          expandedBooks[lib._id] ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        <FaAngleRight size={14} />
                      </span>
                    </button>
                    <p className="text-sm text-gray-500">
                      {lib.borrowCount || 0} lượt mượn
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded: Danh sách book */}
              {expandedBooks[lib._id] && (
                <div className="pt-2 mt-2 pl-[11%] border-t">
                  {lib.books && lib.books.length > 0 ? (
                    lib.books.map((book, idx) => {
                      let bgColor;
                      switch (book.status) {
                        case "Sẵn sàng":
                          bgColor = "#3E8B00";
                          break;
                        case "Đang mượn":
                          bgColor = "#F5AB00";
                          break;
                        case "Đã đặt trước":
                          bgColor = "#800080";
                          break;
                        case "Quá hạn":
                          bgColor = "#FF0000";
                          break;
                        default:
                          bgColor = "#777777";
                      }

                      return (
                        <div
                          key={idx}
                          className="flex flex-col text-sm mt-1 pb-2 mb-2"
                        >
                          {/* Dòng 1: Mã sách + Badge status + [Chọn sách] */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2">
                              <span className="font-semibold">
                                {book.generatedCode || "Chưa có sách"}
                              </span>
                              <span
                                className="w-24 py-1 rounded-full text-white text-xs text-center font-bold"
                                style={{ backgroundColor: bgColor }}
                              >
                                {book.status}
                              </span>
                            </div>
                            {/* Chỉ hiển thị nút 'Chọn sách' nếu Sẵn sàng */}
                            {book.status === "Sẵn sàng" && (
                              <button
                                onClick={() => handleSelectBook(lib, book)}
                                className="text-[#F05023] text-sm font-semibold pr-5"
                              >
                                Chọn sách
                              </button>
                            )}
                            {book.status !== "Sẵn sàng" && (
                              <div className="w-[40%] mt-1 pr-5">
                                {book.borrowedStudent && (
                                  <div className="flex flex-col text-[#757575] font-semibold text-sm">
                                    <span>
                                      {book.borrowedStudent.fullName ||
                                        book.borrowedStudent.name}{" "}
                                      -{" "}
                                      {book.studentEnroll?.classInfo
                                        ?.className || "N/A"}
                                    </span>
                                    <span>
                                      Ngày trả:{" "}
                                      {book.returnDate
                                        ? new Date(
                                            book.returnDate
                                          ).toLocaleDateString()
                                        : "Chưa trả"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm italic">
                      Chưa có sách con
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cột bên phải: Giỏ sách */}
      <div className="w-1/3 h-full p-4">
        <div className="bg-white shadow rounded-2xl p-4 min-h-[550px] flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Giỏ Sách</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500">Chưa có sách nào trong giỏ</p>
            ) : (
              <ul className="mb-4">
                {cart.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between mb-2 border-b pb-2"
                  >
                    <div>
                      <p className="font-semibold">{item.libraryTitle}</p>
                      <p className="text-sm text-gray-600">{item.bookCode}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveBook(idx)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Nút Mượn sách & Xoá tất cả */}
          <div className="flex gap-3">
            <button
              onClick={handleBorrow}
              disabled={cart.length === 0}
              className="flex-1 py-2 bg-orange-red text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Mượn sách
            </button>
            <button
              onClick={handleClearAll}
              disabled={cart.length === 0}
              className="flex-1 py-2 bg-gray-300 text-[#757575] font-semibold rounded-2xl hover:bg-gray-400 disabled:opacity-50 transition"
            >
              Xoá tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Modal Mượn Sách */}
      {showBorrowModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#F8F8F8] rounded-xl p-6 w-[80%] h-[51%] max-w-[1000px] flex flex-col justify-between">
            {" "}
            <h2 className="text-xl font-bold mb-3">Mượn sách</h2>
            <div className="w-full flex gap-5">
              {/* Bước 1: Chọn học sinh */}
              <div className="w-full h-full flex flex-row border-r pr-5 items-center justify-center">
                <div className="h-full w-[60%] flex flex-col justify-between items-start">
                  <h3 className="text-lg font-semibold mb-2">
                    Bước 1: Chọn học sinh
                  </h3>
                  {/* Input Tìm Kiếm học sinh */}
                  <div className="w-[90%] mb-2">
                    <label className="block text-sm font-semibold mb-1">
                      Tìm kiếm (Mã/Tên)
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchStudent(e.target.value);
                      }}
                      placeholder="Nhập mã hoặc tên học sinh..."
                      className="w-full border-none bg-white text-[#a5a5a5] px-2 py-2 rounded-2xl text-sm"
                    />
                    {/* Suggestions */}
                    {showSuggestions && studentSuggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded-xl p-1 w-[17%] mt-1 max-h-40 overflow-hidden hover:overflow-y-auto">
                        {studentSuggestions.map((stu) => (
                          <li
                            key={stu._id}
                            className="px-2 py-1 hover:bg-gray-200 cursor-pointer "
                            onClick={() => handleSelectStudentSuggestion(stu)}
                          >
                            <span className="font-semibold">
                              {stu.fullName}
                            </span>
                            <br />
                            <span className="text-sm">{stu.studentId}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Hiển thị info tóm tắt (nếu có) */}
                  <div className="w-[90%] mb-2">
                    <label className="block text-sm font-semibold mb-1">
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={studentInfo.name}
                      onChange={(e) =>
                        setStudentInfo({ ...studentInfo, name: e.target.value })
                      }
                      className="w-full border-none bg-white text-[#a5a5a5] px-2 py-2 rounded-2xl text-sm"
                    />
                  </div>
                  <div className="w-[90%] mb-2">
                    <label className="block text-sm font-semibold mb-1">
                      Lớp
                    </label>
                    <input
                      type="text"
                      name="className"
                      value={studentInfo.className}
                      onChange={(e) =>
                        setStudentInfo({
                          ...studentInfo,
                          className: e.target.value,
                        })
                      }
                      className="w-full border-none bg-white text-[#a5a5a5] px-2 py-2 rounded-2xl text-sm"
                    />
                  </div>
                  <div className="w-[90%] mb-2">
                    <label className="block text-sm font-semibold mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={studentInfo.email}
                      onChange={(e) =>
                        setStudentInfo({
                          ...studentInfo,
                          email: e.target.value,
                        })
                      }
                      className="w-full border-none bg-white text-[#a5a5a5] px-2 py-2 rounded-2xl text-sm"
                    />
                  </div>
                </div>
                <div className="w-[40%]">
                  {studentInfo.photoUrl ? (
                    <img
                      src={`${BASE_URL}/${studentInfo.photoUrl}`}
                      alt="Student"
                      className="w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <p className="text-center text-gray-400 mt-16">
                      Chưa có ảnh
                    </p>
                  )}
                </div>
              </div>

              {/* Ảnh học sinh + giỏ sách */}
              <div className="w-1/2">
                {/* Bước 2: Kiểm tra sách */}
                <h3 className="text-lg font-semibold mt-4 mb-2">
                  Bước 2: Kiểm tra sách
                </h3>
                <ul>
                  {cart.map((item, index) => (
                    <li key={index} className="flex justify-between mb-2">
                      <div>
                        <p className="font-semibold">{item.libraryTitle}</p>
                        <p>Mã: {item.bookCode}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveBook(index)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Nút Xác nhận / Hủy */}
            <div className="flex justify-center my-4 gap-4">
              <button
                onClick={handleConfirmBorrow}
                className="w-36 px-4 py-1 bg-[#F05023] text-white rounded-xl hover:bg-orange-500"
              >
                Xác nhận
              </button>
              <button
                onClick={handleCloseModal}
                className="w-36 px-4 py-1 bg-gray-300 rounded-xl"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryManagement;
