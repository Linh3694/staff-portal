import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { API_URL, BASE_URL } from "../../config";
import Switch from "react-switch";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import modules from './quill-toolbar';
import { toast } from "react-toastify";
import { FaDownload, FaEye } from "react-icons/fa6";


function JobDetailModal({ isOpen, onClose, jobId }) {
  const [job, setJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isOpen || !jobId) return;
    // Fetch job info
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể tải thông tin công việc");
        const data = await res.json();
        setJob(data.job || data);
        setEditJob(data.job || data);
      } catch (err) {
        setJob(null);
        setEditJob(null);
      }
    };
    // Fetch CV list
    const fetchCVs = async () => {
      try {
        const res = await fetch(`${API_URL}/applications/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể tải danh sách CV");
        const data = await res.json();
        setCvList(data.applications || []);
      } catch (err) {
        setCvList([]);
      }
    };
    fetchJob();
    fetchCVs();
  }, [isOpen, jobId]);

  if (!isOpen) return null;
  if (!editJob) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <p>Đang tải thông tin công việc...</p>
      </div>
    </div>
  );

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditJob(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Xử lý thay đổi mô tả/yêu cầu (dùng editor hoặc textarea)
  const handleQuillChange = (name, value) => {
    setEditJob(prev => ({ ...prev, [name]: value }));
  };

  // Lưu cập nhật
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(editJob),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      const data = await res.json();
      setJob(data.job);
      setEditJob(data.job);
      toast.success("Cập nhật thành công!");
      onClose();
    } catch (err) {
      toast.error("Có lỗi khi cập nhật công việc!");
    } finally {
      setIsSaving(false);
    }
  };

  // Huỷ chỉnh sửa
  const handleCancel = () => {
    setEditJob(job);
    onClose();
  };

  // Lọc CV theo tên
  const filteredCVs = cvList.filter(cv =>
    cv.fullname?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePreview = (url) => {
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-[90vw] h-[95vh] px-10 py-5">
        <div className="flex justify-between items-center pb-3 mb-4">
          <h2 className="text-xl font-bold text-[#002147]">{job.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
              disabled={isSaving}
            >Huỷ bỏ</button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#FF5733] text-white font-bold rounded-lg hover:bg-[#ff6b4a] transition"
              disabled={isSaving}
            >Lưu</button>
          
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bên trái: Thông tin job dạng chỉnh sửa */}
          <div className="border-r border-gray-200 pr-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Vị trí tuyển dụng */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Vị trí tuyển dụng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={editJob.title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F8F8] border-none text-sm text-[#222] rounded-full" />
              </div>
              {/* Hạn cuối */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Hạn cuối <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="deadline"
                  value={editJob.deadline ? new Date(editJob.deadline).toISOString().slice(0, 10) : ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F8F8] border-none text-sm text-[#222] rounded-full" />
              </div>
              {/* Loại hình công việc */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Loại hình công việc <span className="text-red-500">*</span></label>
                <select name="jobType" value={editJob.jobType || ''} onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F8F8] border-none text-sm text-[#222] rounded-full">
                  <option value="">Chọn loại hình công việc</option>
                  <option value="fulltime">Toàn thời gian</option>
                  <option value="parttime">Bán thời gian</option>
                  <option value="intern">Thực tập</option>
                </select>
              </div>
              {/* Tuyển gấp */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Tuyển gấp <span className="text-red-500">*</span></label>
                <div className="flex items-center h-full">
                  <Switch
                    onChange={checked => setEditJob(prev => ({ ...prev, urgent: checked }))}
                    checked={!!editJob.urgent}
                    onColor="#FF5733"
                    offColor="#ccc"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    height={24}
                    width={48}
                  />
                </div>
              </div>
            </div>
            {/* Mô tả */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-sm font-semibold text-gray-700">Mô tả công việc <span className="text-red-500">*</span></label>
              <ReactQuill
                value={editJob.description || ''}
                onChange={value => handleQuillChange('description', value)}
                className="bg-[#F8F8F8] rounded-2xl max-h-[220px] text-sm"
                modules={modules}
                placeholder="Nhập nội dung"
              />
            </div>
            {/* Yêu cầu */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-sm font-semibold text-gray-700">Yêu cầu công việc <span className="text-red-500">*</span></label>
              <ReactQuill
                value={editJob.requirements || ''}
                onChange={value => handleQuillChange('requirements', value)}
                className="bg-[#F8F8F8] rounded-2xl max-h-[220px] text-sm"
                modules={modules}
                placeholder="Nhập nội dung"
              />
            </div>
          </div>
          {/* Bên phải: Danh sách CV đã apply */}
          <div>
            <div className="font-bold text-lg mb-2">Hồ sơ</div>
            <div className="font-semibold flex items-start justify-start mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm tên ứng viên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8F8] border-none rounded-full text-sm"
              />
            </div>
            <table className="w-full text-left border-gray-200">
              <thead>
                <tr className="border-b border-gray-200 text-sm">
                  <th className="py-2 px-2">STT</th>
                  <th className="py-2 px-2">Tên ứng viên</th>
                  <th className="py-2 px-2">SDT</th>
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2">Ngày gửi</th>
                  <th className="py-2 px-2 text-center">CV</th>
                </tr>
              </thead>
              <tbody>
                {filteredCVs.length > 0 ? filteredCVs.map((cv, idx) => (
                  <tr key={cv._id || idx} className="border-b border-gray-100 text-sm">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{cv.fullname}</td>
                    <td className="py-2 px-2">{cv.phone || '-'}</td>
                    <td className="py-2 px-2">{cv.email}</td>
                    <td className="py-2 px-2">{cv.createdAt ? new Date(cv.createdAt).toLocaleString("vi-VN") : '-'}</td>
                    <td className="py-2 px-2">
                      {cv.cvFile ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={cv.cvFile?.startsWith('http') ? cv.cvFile : `${BASE_URL}${cv.cvFile}`}
                            download
                            className="flex items-center gap-1 px-2 py-1"
                            title="Tải về"
                          >
                            <FaDownload />
                          </a>
                          <a
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              handlePreview(cv.cvFile?.startsWith('http') ? cv.cvFile : `${BASE_URL}${cv.cvFile}`);
                            }}
                            className="flex items-center gap-1"
                            title="Xem trực tiếp"
                          >
                            <FaEye />
                          </a>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-400">Chưa có hồ sơ nào</td></tr>
                )}
              </tbody>
            </table>
            {/* Phân trang (hiển thị label) */}
          </div>
        </div>
      </div>
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={handleClosePreview}
            >
              <FaTimes size={22} />
            </button>
            {previewUrl && previewUrl.match(/\\.pdf$/i) ? (
              <iframe
                src={previewUrl}
                title="CV Preview"
                className="w-full h-[70vh] rounded"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-lg font-semibold mb-2">Không thể xem trước file này.</p>
                <p className="text-gray-500 mb-4">Chỉ hỗ trợ xem trước file PDF. Vui lòng tải về để xem file Word/Excel.</p>
                <a
                  href={previewUrl}
                  download
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tải về
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetailModal; 