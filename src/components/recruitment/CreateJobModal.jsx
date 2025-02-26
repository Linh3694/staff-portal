import React, { useState } from "react";
import { API_URL } from "../../config";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

function CreateJobModal({ isOpen, onClose, onJobCreated }) {
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    requirements: "",
    salaryRange: "",
    location: "",
  });

  const handleChange = (e) => {
    setJobData({ ...jobData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !jobData.title ||
      !jobData.description ||
      !jobData.requirements ||
      !jobData.location
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(jobData), // Không cần split hoặc join nữa
      });

      if (!res.ok) throw new Error("Không thể tạo công việc");

      const newJob = await res.json();
      toast.success("Công việc đã được tạo!");
      onJobCreated(newJob);
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo công việc");
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-lg">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-bold text-[#002147]">
              Tạo công việc mới
            </h2>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Tiêu đề công việc */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Tiêu đề công việc
              </label>
              <input
                type="text"
                name="title"
                value={jobData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề công việc..."
              />
            </div>

            {/* Mô tả công việc */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Mô tả công việc
              </label>
              <textarea
                name="description"
                value={jobData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Nhập mô tả công việc..."
              />
            </div>

            {/* Yêu cầu công việc */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Yêu cầu công việc
              </label>
              <textarea
                name="requirements"
                value={jobData.requirements} // ✅ Giữ nguyên chuỗi
                onChange={(e) =>
                  setJobData({ ...jobData, requirements: e.target.value })
                } // ✅ Không cần `.split()`
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Nhập yêu cầu công việc..."
              />
            </div>
            {/* Mức lương */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Mức lương
              </label>
              <input
                type="text"
                name="salaryRange"
                value={jobData.salaryRange}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mức lương (VD: 1000-2000 USD)"
              />
            </div>

            {/* Địa điểm làm việc */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Địa điểm làm việc
              </label>
              <input
                type="text"
                name="location"
                value={jobData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập địa điểm làm việc..."
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end mt-6 space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#FF5733] text-white font-bold rounded-lg hover:bg-[#ff6b4a] transition"
            >
              Tạo công việc
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default CreateJobModal;
