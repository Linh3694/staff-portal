import React from "react";
import { FaTimes } from "react-icons/fa";
import { API_URL } from "../../config";

function JobDetailModal({ isOpen, onClose, job, cvList }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-[#002147]">
            Chi tiết công việc
          </h2>
          <button onClick={onClose} className="text-red-500 hover:text-red-700">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          {/* Cột bên trái - Chi tiết công việc */}
          <div className="border-r pr-4">
            <h3 className="text-xl font-semibold">{job.title}</h3>
            <p className="text-gray-600 mt-2">
              <strong>Địa điểm:</strong> {job.location}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Mức lương:</strong> {job.salaryRange}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Trạng thái:</strong>{" "}
              {job.active ? "Đang tuyển" : "Đã đóng"}
            </p>
            <h3 className="text-lg font-semibold mt-4">Mô tả công việc</h3>
            <p className="text-gray-700">{job.description}</p>
            <h3 className="text-lg font-semibold mt-4">Yêu cầu công việc</h3>
            <p className="text-gray-700">{job.requirements}</p>
          </div>

          {/* Cột bên phải - Danh sách CV */}
          <div className="pl-4">
            <h3 className="text-lg font-semibold">Danh sách CV ứng tuyển</h3>
            {cvList.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {cvList.map((cv, index) => (
                  <li
                    key={index}
                    className="border p-2 rounded-lg flex justify-between items-center"
                  >
                    <p className="text-gray-700">
                      {cv.fullname} - {cv.email}
                    </p>
                    <a
                      href={`${API_URL}/uploads/cv/${cv.cvFile}`}
                      className="text-blue-500 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem CV
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">
                Chưa có ứng viên nào ứng tuyển.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailModal;
