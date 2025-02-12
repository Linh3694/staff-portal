import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config"; // import từ file config
import { FaUpload, FaXmark } from "react-icons/fa6";

function FlippageAdmin() {
  console.log("AdminPage Loaded");
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef(null); // Ref cho input file

  // Gọi API lấy danh sách tất cả file PDF từ MongoDB
  useEffect(() => {
    fetch(`${API_URL}/flippage/get-all-pdfs`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFileList(data);
        }
      })
      .catch((err) => console.error("❌ Lỗi khi tải danh sách file:", err));
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset giá trị input file
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn file PDF!");
      return;
    }

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("customName", customName);

    try {
      const res = await fetch(`${API_URL}/flippage/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload thất bại");
      }

      const data = await res.json();
      console.log("✅ Upload thành công:", data);

      if (!data.folderName) {
        throw new Error("Lỗi: Không nhận được folderName từ server.");
      }

      // Cập nhật danh sách file ngay trên frontend
      setFileList((prev) => [
        ...prev,
        {
          fileName: selectedFile.name,
          customName: data.customName,
          uploadDate: new Date().toLocaleString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi upload PDF");
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Form Upload PDF */}
      <div className="bg-white p-6 rounded-xl shadow-md border mb-6">
        <h2 className="text-xl font-bold text-[#002147] mb-4">Tải lên tài liệu PDF</h2>
        <div className="flex flex-row items-center justify-start gap-10">
          {/* Đường dẫn */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Bước 1: Nhập đường dẫn</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="duong-dan-file"
              className="w-full px-4 py-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002147] focus:outline-none"
            />
            {/* Kết quả giả định */}
            <p className="mt-2 text-sm font-semibold text-gray-600">
              Preview: {" "}
              <span className="text-[#002147] font-bold">
                https://360wiser.wellspring.edu.vn/{customName || "duong-dan-file"}
              </span>
            </p>
          </div>
          {/* Chọn file */}
          <div className="flex flex-col">
            <label className="block text-gray-700 font-medium mb-2">Bước 2: Chọn file</label>
            <input
              type="file"
              id="fileUpload"
              accept="application/pdf"
              ref={fileInputRef} // Gán ref vào input file
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-200 transition-all"
            >
              <FaUpload size={16} />
              Chọn tệp
            </label>
          {/* Hiển thị tên file đã chọn */}
            {selectedFile && (
              <div className="flex items-center justify-between mt-2 p-2 bg-gray-50 rounded-lg border border-gray-300">
                <span className="text-gray-600 text-sm truncate">{selectedFile.name}</span>
                <button className="ml-2 text-red-500 hover:text-red-700" onClick={handleRemoveFile}>
                  <FaXmark />
                </button>
              </div>
            )}
          </div>
          {/* Nút tải lên */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Bước 3: Xác nhận</label>
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-2 bg-[#FF5733] text-white font-bold rounded-lg shadow-md hover:bg-[#ff6b4a] transition-all"
            >
              Tải lên
            </button>
          </div>
        </div>
      </div>
      <div className="w-full h-full p-6 bg-white rounded-xl shadow-md border">
        <h2 className="font-bold text-lg mb-4">Danh sách PDF đã upload</h2>
        {fileList.length > 0 ? (
          <table className="w-full">
            <thead>
            <tr className="!border-px !border-gray-400" >
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">STT
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">Tên File
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">URL
                    </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                    <p className="text-sm font-bold text-gray-500">Ngày tạo
                    </p>
                </th>
              </tr>
            </thead>
            <tbody>
              {fileList.map((file, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="text-[#002147] border-white/0 py-3 pr-4 ">
                    <p className="text-sm font-bold text-navy-700">{index + 1}</p>
                  </td>
                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{file.fileName}</p>
                  </td>
                  <td className="border-white/0 py-3 pr-4">
                    <a href={`/${file.customName}`} target="_blank" rel="noopener noreferrer">
                      <p className="text-sm font-bold text-navy-700">{file.customName}</p>
                    </a>
                  </td>
                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">{file.uploadDate}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có file nào được upload.</p>
        )}
        </div>
    </div>
  );
}

export default FlippageAdmin;