import React, { useState, useEffect } from "react";
import { API_URL, BASE_URL } from "../../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";

// ------------------- CÁC SUB-COMPONENT ------------------- //

// 1) DocumentType - Phân loại tài liệu
function DocumentType() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/libraries/document-types`)
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error fetching document types:", error);
      });
  };

  useEffect(fetchData, []);

  const handleCreate = () => {
    if (!name || !code) return;
    fetch(`${API_URL}/libraries/document-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          // Nếu có lỗi, trả về lỗi JSON từ backend
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi tạo document type");
        }
        return res.json();
      })
      .then(() => {
        setName("");
        setCode("");
        fetchData();
      })
      .catch((error) => {
        console.error("Error creating document type:", error);
        alert(error.message);
      });
  };

  const handleDelete = (item) => {
    fetch(`${API_URL}/libraries/document-types/${item._id}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi khi xóa document type");
        }
        return res.json();
      })
      .then(fetchData)
      .catch((error) => {
        console.error("Error deleting document type:", error);
        alert(error.message);
      });
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">Phân loại tài liệu</h2>
        <div className="flex gap-2 items-center justify-center text-sm">
          <label className="text-sm">Tên:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên đầu mục..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />

          <label className="text-sm">Mã:</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã đầu mục..."
            className="border border-gray-200 px-2 py-1 rounded-2xl text-sm"
          />
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-[#002147] text-sm font-bold text-white rounded-lg hover:bg-[#001635]"
          >
            Thêm mới
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">STT</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">TÊN ĐẦU MỤC</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
              <p className="text-sm font-bold text-gray-600">MÃ</p>
            </th>
            <th className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-end">
              <p className="text-sm font-bold text-gray-600">HÀNH ĐỘNG</p>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item._id}>
              <td className="max-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-semibold text-navy-700">{idx + 1}</p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-semibold text-navy-700">
                  {item.name}
                </p>
              </td>
              <td className="min-w-[150px] border-white/0 py-3 pr-4">
                <p className="text-sm font-semibold text-navy-700">
                  {item.code}
                </p>
              </td>

              <td className="max-w-[150px] border-white/0 py-3 pr-4 justify-end">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg transform transition-transform duration-300 hover:scale-105"
                  >
                    <FiEdit size={14} />
                  </button>
                  <button
                    className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg  transform transition-transform duration-300 hover:scale-105"
                    onClick={() => handleDelete(item)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 2) SeriesName - Tùng thư
function SeriesName() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/libraries")
      .then((res) => res.json())
      .then((libraries) => {
        const seriesList = [];
        libraries.forEach((lib) => {
          lib.books.forEach((book) => {
            if (book.seriesName) {
              seriesList.push(book.seriesName);
            }
          });
        });
        const uniqueSeries = [...new Set(seriesList)];

        const formatted = uniqueSeries.map((sn, index) => ({
          name: sn,
          code: 200 + index, // ví dụ code tạm
        }));

        setData(formatted);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleEdit = (item) => {
    alert(`Sửa Tùng thư: ${item.name}`);
    // Logic PUT/POST...
  };

  const handleDelete = (item) => {
    alert(`Xóa Tùng thư: ${item.name}`);
    // Logic DELETE...
  };

  return (
    <div>
      <h2>Tùng thư</h2>
      <button>Thêm mới</button>
      <table
        border="1"
        cellPadding="8"
        style={{ marginTop: "10px", width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên đầu mục</th>
            <th>Mã</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.code}>
              <td>{idx + 1}</td>
              <td>{item.name}</td>
              <td>{item.code}</td>
              <td>
                <button onClick={() => handleEdit(item)}>Sửa</button>
                <button onClick={() => handleDelete(item)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 3) SpecialCode - Đăng kí cá biệt (hiện chưa kết nối DB)
function SpecialCode() {
  const [data, setData] = useState([]);
  const [newCode, setNewCode] = useState("");

  const handleAdd = () => {
    if (!newCode.trim()) return;
    const newItem = {
      id: data.length + 1,
      code: newCode.trim(),
    };
    setData((prev) => [...prev, newItem]);
    setNewCode("");
  };

  const handleDelete = (id) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <h2>Đăng kí cá biệt</h2>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Nhập mã đặc biệt"
        />
        <button onClick={handleAdd}>Thêm mới</button>
      </div>
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>{item.code}</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 4) BookInformation - Đầu sách (Library Schema)
function BookInformation() {
  const [libraries, setLibraries] = useState([]);
  // Tạm lấy library[0]
  const [authors, setAuthors] = useState([]);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/libraries")
      .then((res) => res.json())
      .then((data) => {
        setLibraries(data);
        if (data.length > 0) {
          // Dùng bản ghi đầu tiên để demo
          const lib = data[0];
          setAuthors(lib.authors || []);
          setTitle(lib.title || "");
          setCoverImage(lib.coverImage || "");
          setCategory(lib.category || "");
          setLanguage(lib.language || "");
          setDescription(lib.description || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = () => {
    // Nếu đã có library thì PUT, nếu chưa thì POST
    if (libraries.length > 0) {
      const libraryId = libraries[0]._id;
      fetch(`/api/libraries/${libraryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authors,
          title,
          coverImage,
          category,
          language,
          description,
        }),
      })
        .then((res) => res.json())
        .then((updated) => {
          alert("Cập nhật thành công!");
          console.log(updated);
        })
        .catch((err) => console.error(err));
    } else {
      // Tạo mới library
      fetch("/api/libraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authors,
          title,
          coverImage,
          category,
          language,
          description,
        }),
      })
        .then((res) => res.json())
        .then((created) => {
          alert("Tạo mới thành công!");
          setLibraries([created]);
        })
        .catch((err) => console.error(err));
    }
  };

  return (
    <div>
      <h2>Đầu sách (Library Information)</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>Tác giả: </label>
        <input
          type="text"
          value={authors.join(", ")}
          onChange={(e) => setAuthors(e.target.value.split(","))}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Tên sách: </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Ảnh bìa: </label>
        <input
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Thể loại: </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Ngôn ngữ: </label>
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Mô tả: </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ width: "100%" }}
        />
      </div>
      <button onClick={handleSave}>Lưu</button>
    </div>
  );
}

// 5) BookDetail - Sách (danh sách `books` trong Library)
function BookDetail() {
  const [library, setLibrary] = useState(null);
  const [books, setBooks] = useState([]);

  // State cho form "Thêm sách mới"
  const [isbn, setIsbn] = useState("");
  const [documentIdentifier, setDocumentIdentifier] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [classificationSign, setClassificationSign] = useState("");
  const [publisherPlaceName, setPublisherPlaceName] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [publishYear, setPublishYear] = useState("");
  const [pages, setPages] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [documentType, setDocumentType] = useState("");
  const [coverPrice, setCoverPrice] = useState("");
  const [lang, setLang] = useState("");
  const [catalogingAgency, setCatalogingAgency] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [seriesName, setSeriesName] = useState("");

  useEffect(() => {
    // Lấy library đầu tiên trong DB
    fetch("/api/libraries")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          const firstLibrary = data[0];
          setLibrary(firstLibrary);
          setBooks(firstLibrary.books || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAddBook = () => {
    const newBook = {
      isbn,
      documentIdentifier,
      bookTitle,
      classificationSign,
      publisherPlaceName,
      publisherName,
      publishYear: publishYear ? Number(publishYear) : null,
      pages: pages ? Number(pages) : null,
      attachments,
      documentType,
      coverPrice: coverPrice ? Number(coverPrice) : null,
      language: lang,
      catalogingAgency,
      storageLocation,
      seriesName,
    };
    setBooks((prev) => [...prev, newBook]);

    // Reset form
    setIsbn("");
    setDocumentIdentifier("");
    setBookTitle("");
    setClassificationSign("");
    setPublisherPlaceName("");
    setPublisherName("");
    setPublishYear("");
    setPages("");
    setAttachments([]);
    setDocumentType("");
    setCoverPrice("");
    setLang("");
    setCatalogingAgency("");
    setStorageLocation("");
    setSeriesName("");
  };

  const handleDeleteBook = (index) => {
    setBooks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    if (!library) return;
    // Gọi API cập nhật lại library.books
    fetch(`/api/libraries/${library._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...library,
        books, // mảng mới
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        alert("Cập nhật danh sách Sách thành công!");
        setLibrary(updated);
        setBooks(updated.books);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h2>Sách (Book Detail)</h2>
      {/* Form thêm sách */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <h3>Thêm sách mới</h3>
        <div>
          <label>ISBN: </label>
          <input
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
        </div>
        <div>
          <label>Định danh tài liệu: </label>
          <input
            type="text"
            value={documentIdentifier}
            onChange={(e) => setDocumentIdentifier(e.target.value)}
          />
        </div>
        <div>
          <label>Tên Sách: </label>
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
          />
        </div>
        <div>
          <label>Ký hiệu phân loại tài liệu: </label>
          <input
            type="text"
            value={classificationSign}
            onChange={(e) => setClassificationSign(e.target.value)}
          />
        </div>
        <div>
          <label>Tên nơi xuất bản: </label>
          <input
            type="text"
            value={publisherPlaceName}
            onChange={(e) => setPublisherPlaceName(e.target.value)}
          />
        </div>
        <div>
          <label>Tên nhà xuất bản: </label>
          <input
            type="text"
            value={publisherName}
            onChange={(e) => setPublisherName(e.target.value)}
          />
        </div>
        <div>
          <label>Năm xuất bản: </label>
          <input
            type="number"
            value={publishYear}
            onChange={(e) => setPublishYear(e.target.value)}
          />
        </div>
        <div>
          <label>Số trang: </label>
          <input
            type="number"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
          />
        </div>
        <div>
          <label>Attachments (cách nhau bởi dấu phẩy): </label>
          <input
            type="text"
            value={attachments.join(", ")}
            onChange={(e) =>
              setAttachments(e.target.value.split(",").map((x) => x.trim()))
            }
          />
        </div>
        <div>
          <label>Loại tài liệu (documentType): </label>
          <input
            type="text"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          />
        </div>
        <div>
          <label>Giá bìa: </label>
          <input
            type="number"
            value={coverPrice}
            onChange={(e) => setCoverPrice(e.target.value)}
          />
        </div>
        <div>
          <label>Ngôn ngữ: </label>
          <input
            type="text"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          />
        </div>
        <div>
          <label>Cơ quan biên mục: </label>
          <input
            type="text"
            value={catalogingAgency}
            onChange={(e) => setCatalogingAgency(e.target.value)}
          />
        </div>
        <div>
          <label>Kho lưu giữ tài liệu: </label>
          <input
            type="text"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
          />
        </div>
        <div>
          <label>Tên Tùng thư: </label>
          <input
            type="text"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
          />
        </div>
        <button style={{ marginTop: "10px" }} onClick={handleAddBook}>
          Thêm sách
        </button>
      </div>

      {/* Danh sách books */}
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ISBN</th>
            <th>Định danh</th>
            <th>Tên sách</th>
            <th>Ký hiệu</th>
            <th>Nhà XB</th>
            <th>Năm XB</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b, index) => (
            <tr key={index}>
              <td>{b.isbn}</td>
              <td>{b.documentIdentifier}</td>
              <td>{b.bookTitle}</td>
              <td>{b.classificationSign}</td>
              <td>{b.publisherName}</td>
              <td>{b.publishYear}</td>
              <td>
                <button onClick={() => handleDeleteBook(index)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button style={{ marginTop: "10px" }} onClick={handleSaveAll}>
        Lưu toàn bộ Sách
      </button>
    </div>
  );
}

// ------------------- COMPONENT CHÍNH ------------------- //

function LibraryData() {
  // State xác định đang xem tab nào
  const [activeTab, setActiveTab] = useState("");

  return (
    <div className="flex">
      {/* Sidebar bên trái */}
      <aside className="w-[15%] h-[20%] bg-white rounded-2xl p-6 font-bold mr-4">
        <ul>
          <li className="mt-2">
            <button onClick={() => setActiveTab("documentType")}>
              Phân loại tài liệu
            </button>
          </li>
          <li className="mt-6">
            <button onClick={() => setActiveTab("seriesName")}>Tùng thư</button>
          </li>
          <li className="mt-6">
            <button onClick={() => setActiveTab("specialCode")}>
              Đăng kí cá biệt
            </button>
          </li>
          <li className="mt-6">Dữ liệu sách</li>
          <ul>
            <li className="mt-6 ml-5">
              <button onClick={() => setActiveTab("bookInformation")}>
                Đầu sách
              </button>
            </li>
            <li className="mt-6 ml-5">
              <button onClick={() => setActiveTab("bookDetail")}>Sách</button>
            </li>
          </ul>
        </ul>
      </aside>

      {/* Khu vực hiển thị nội dung tương ứng tab */}
      <main className="h-screen flex-1 bg-white rounded-2xl p-6">
        {activeTab === "documentType" && <DocumentType />}
        {activeTab === "seriesName" && <SeriesName />}
        {activeTab === "specialCode" && <SpecialCode />}
        {activeTab === "bookInformation" && <BookInformation />}
        {activeTab === "bookDetail" && <BookDetail />}
      </main>
    </div>
  );
}

export default LibraryData;
