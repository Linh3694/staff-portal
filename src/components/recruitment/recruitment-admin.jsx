import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Switch from "react-switch";
import CreateJobModal from "./CreateJobModal"
import JobDetailModal from "./JobDetailModal"


function RecruitmentAdmin({ currentUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef(null); // Ref cho input file
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [jobList, setJobList] = useState();
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvList, setCvList] = useState([]); // Lưu danh sách CV của job được chọn

  const fetchFileList = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
    fetch(`${API_URL}/jobs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFileList(data);
        }
        console.log(data)
      })
      .catch((err) => {
        toast.error("Có lỗi khi tải danh sách CV!");
      });
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/applications/job/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!res.ok) throw new Error("Không thể tải danh sách CV");
  
      const data = await res.json();
      setCvList(data.applications); // Cập nhật danh sách CV của job này
    } catch (err) {
      toast.error("Có lỗi khi tải danh sách CV!");
    }
  };
  
  const handleOpenJobDetail = (job) => {
    setSelectedJob(job);
    setShowJobDetailModal(true);
    fetchJobDetails(job._id); // Gọi API lấy danh sách CV của job này
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  const handleJobChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRemoveJob = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset giá trị input file
    }
  };

  
  const toggleActiveStatus = async (id, currentStatus) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
  
    try {
      const res = await fetch(`${API_URL}/jobs/toggle-active/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Cập nhật trạng thái thất bại");
      }
  
      const data = await res.json();
      toast.success("Trạng thái đã được cập nhật!");
  
      // Cập nhật danh sách công việc với trạng thái mới từ API
      setFileList((prev) =>
        prev.map((job) =>
          job._id === id ? { ...job, active: data.job.active } : job
        )
      );
  
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      toast.error(err.message || "Có lỗi khi cập nhật trạng thái!");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full h-full p-6 bg-white rounded-xl shadow-md border">
        <div className="flex flex-row justify-between items-center">
          <h2 className="font-bold text-lg mb-4">Danh sách CV đã upload</h2>
          <button
            onClick={() => setIsCreateJobModalOpen(true)}
            className="px-4 py-2 bg-[#002147] text-white font-bold rounded-lg shadow-md hover:bg-[#001b33] transition-all"
          >
            Tạo mới
          </button>
          <CreateJobModal 
            isOpen={isCreateJobModalOpen} 
            onClose={() => setIsCreateJobModalOpen(false)} 
            onJobCreated={(newJob) => setJobList([...jobList, newJob])} 
          />
        </div>
        {fileList.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">STT</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Tên công việc</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Ngày tạo</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">CV Applied</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Active</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Hành Động</p>
                </th>
              </tr>
            </thead>
            <tbody>
            {fileList.map((job, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="text-[#002147] border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">{index + 1}</p>
                </td>

                {/* Click vào tên job để mở modal */}
                <td className="max-w-[400px] border-white/0 py-3 pr-4 cursor-pointer text-[#002147] font-bold hover:underline"
                    onClick={() => handleOpenJobDetail(job)}>
                  {job.title}
                </td>

                {/* Ngày tạo theo format dd/mm/yyyy */}
                <td className="border-white/0 py-3 pr-4">
                  <p className="text-sm font-bold text-navy-700">
                    {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </td>

                {/* Hiển thị số lượng CV ứng tuyển */}
                <td className="border-white/0 py-3 pr-4 text-left">
                  <p className="text-sm font-bold text-navy-700">{job.cvCount || 0}</p>
                </td>

                {/* Cột trạng thái */}
                <td className="border-white/0 py-3 pr-4">
                  <Switch
                    onChange={() => toggleActiveStatus(job._id, !job.active)}
                    checked={job.active}
                    onColor="#4caf50"
                    offColor="#ccc"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    height={20}
                    width={40}
                  />
                </td>

                {/* Cột hành động */}
                <td className="border-white/0 py-3 pr-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleJobChange(job)}
                      className="flex items-center justify-center w-7 h-7 text-white bg-oxford-blue rounded-lg hover:scale-105 transition">
                      <FiEdit size={14} />
                    </button>
                    <button onClick={() => handleRemoveJob(job)}
                    className="flex items-center justify-center w-7 h-7 text-white bg-orange-red rounded-lg hover:scale-105 transition">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
          
        ) : (
          <p>Chưa có file nào được upload.</p>
        )}
        <JobDetailModal 
          isOpen={showJobDetailModal} 
          onClose={() => setShowJobDetailModal(false)} 
          job={selectedJob} 
          cvList={cvList} 
        />
      </div>
    </div>
  );
}

export default RecruitmentAdmin;