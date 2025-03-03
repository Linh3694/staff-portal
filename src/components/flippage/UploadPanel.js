import React, { useState } from "react";
import { API_URL } from "../../config"; // import từ file config

function UploadPanel({ onUploadedImages }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);

    try {
      // Chỗ này bạn phải đảm bảo cổng server trùng với cổng đang chạy (5010)
      const response = await fetch(`${API_URL}/flippage/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload thất bại");
      }
      const data = await response.json();
      onUploadedImages && onUploadedImages(data.images);
    } catch (err) {
      console.error(err);
      alert("Lỗi upload hoặc convert PDF!");
    }
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload PDF</button>
    </div>
  );
}

export default UploadPanel;