import React, { useState, useEffect } from "react";
import { ChartBarIcon, RefreshIcon, PlusIcon } from "@heroicons/react/outline";
import { API_URL } from "../../core/config";
import { toast } from "react-toastify";

const AdmissionHomepage = () => {
  const [admissionStats, setAdmissionStats] = useState({
    newStudents: 0,
    returningStudents: 0,
    totalStudents: 0,
    schoolYear: "2025-2026",
  });

  const [loading, setLoading] = useState(true);
  const [newStudentsInput, setNewStudentsInput] = useState("");
  const [returningStudentsInput, setReturningStudentsInput] = useState("");

  // Fetch thống kê tuyển sinh
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admission/stats`);

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu thống kê tuyển sinh");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          newStudents: data.data.newStudents,
          returningStudents: data.data.returningStudents,
          totalStudents: data.data.totalStudents,
          schoolYear: data.data.schoolYear || "2025-2026",
        });
        setNewStudentsInput(data.data.newStudents);
        setReturningStudentsInput(data.data.returningStudents);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu thống kê tuyển sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Thiết lập auto-refresh mỗi 30 giây
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cập nhật số học sinh mới
  const updateNewStudents = async (e) => {
    e.preventDefault();
    if (newStudentsInput === "" || isNaN(newStudentsInput)) {
      toast.error("Vui lòng nhập số hợp lệ");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admission/new-students`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: parseInt(newStudentsInput, 10) }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật số học sinh mới");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          ...admissionStats,
          newStudents: data.data.newStudents,
          totalStudents: data.data.totalStudents,
        });
        toast.success("Cập nhật số học sinh mới thành công");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Không thể cập nhật số học sinh mới");
    }
  };

  // Cập nhật số học sinh tái ghi danh
  const updateReturningStudents = async (e) => {
    e.preventDefault();
    if (returningStudentsInput === "" || isNaN(returningStudentsInput)) {
      toast.error("Vui lòng nhập số hợp lệ");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admission/returning-students`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: parseInt(returningStudentsInput, 10) }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật số học sinh tái ghi danh");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          ...admissionStats,
          returningStudents: data.data.returningStudents,
          totalStudents: data.data.totalStudents,
        });
        toast.success("Cập nhật số học sinh tái ghi danh thành công");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Không thể cập nhật số học sinh tái ghi danh");
    }
  };

  // Tăng nhanh số học sinh mới
  const incrementNewStudent = async () => {
    try {
      const response = await fetch(`${API_URL}/admission/increment-new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tăng số học sinh mới");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          ...admissionStats,
          newStudents: data.data.newStudents,
          totalStudents: data.data.totalStudents,
        });
        setNewStudentsInput(data.data.newStudents);
        toast.success("Đã tăng số học sinh mới");
      }
    } catch (error) {
      console.error("Lỗi khi tăng số học sinh mới:", error);
      toast.error("Không thể tăng số học sinh mới");
    }
  };

  // Tăng nhanh số học sinh tái ghi danh
  const incrementReturningStudent = async () => {
    try {
      const response = await fetch(`${API_URL}/admission/increment-returning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tăng số học sinh tái ghi danh");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          ...admissionStats,
          returningStudents: data.data.returningStudents,
          totalStudents: data.data.totalStudents,
        });
        setReturningStudentsInput(data.data.returningStudents);
        toast.success("Đã tăng số học sinh tái ghi danh");
      }
    } catch (error) {
      console.error("Lỗi khi tăng số học sinh tái ghi danh:", error);
      toast.error("Không thể tăng số học sinh tái ghi danh");
    }
  };

  // Reset tất cả số liệu
  const resetAllStats = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn reset tất cả số liệu?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admission/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newStudents: 0,
          returningStudents: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể reset số liệu");
      }

      const data = await response.json();

      if (data.success) {
        setAdmissionStats({
          ...admissionStats,
          newStudents: 0,
          returningStudents: 0,
          totalStudents: 0,
        });
        setNewStudentsInput(0);
        setReturningStudentsInput(0);
        toast.success("Đã reset tất cả số liệu");
      }
    } catch (error) {
      console.error("Lỗi khi reset số liệu:", error);
      toast.error("Không thể reset số liệu");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#002147]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto p-4 max-w-5xl">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-[#002147] text-white p-4">
            <h1 className="text-2xl font-bold text-center">
              Quản Lý Thống Kê Tuyển Sinh
            </h1>
            <p className="text-center">Năm học {admissionStats.schoolYear}</p>
          </div>

          <div className="p-6">
            {/* Hiển thị thống kê hiện tại */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white shadow-md p-6 rounded-lg flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Học sinh mới
                </h3>
                <p className="text-3xl font-bold text-[#002147]">
                  {admissionStats.newStudents}
                </p>
              </div>
              <div className="bg-white shadow-md p-6 rounded-lg flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Học sinh tái ghi danh
                </h3>
                <p className="text-3xl font-bold text-[#002147]">
                  {admissionStats.returningStudents}
                </p>
              </div>
              <div className="bg-white shadow-md p-6 rounded-lg flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Tổng số học sinh
                </h3>
                <p className="text-3xl font-bold text-[#002147]">
                  {admissionStats.totalStudents}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form cập nhật học sinh mới */}
              <div className="bg-white shadow p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-[#002147]">
                  Học sinh mới
                </h3>
                <form onSubmit={updateNewStudents} className="mb-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="number"
                      className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#002147] flex-1"
                      placeholder="Nhập số học sinh mới"
                      value={newStudentsInput}
                      onChange={(e) => setNewStudentsInput(e.target.value)}
                      min="0"
                    />
                    <button
                      type="submit"
                      className="bg-[#002147] text-white px-4 py-2 rounded-md hover:bg-[#001b38] transition"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
                <button
                  onClick={incrementNewStudent}
                  className="w-full bg-[#002855] text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" /> Tăng 1 học sinh mới
                </button>
              </div>

              {/* Form cập nhật học sinh tái ghi danh */}
              <div className="bg-white shadow p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-[#002147]">
                  Học sinh tái ghi danh
                </h3>
                <form onSubmit={updateReturningStudents} className="mb-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="number"
                      className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#002147] flex-1"
                      placeholder="Nhập số học sinh tái ghi danh"
                      value={returningStudentsInput}
                      onChange={(e) =>
                        setReturningStudentsInput(e.target.value)
                      }
                      min="0"
                    />
                    <button
                      type="submit"
                      className="bg-[#002147] text-white px-4 py-2 rounded-md hover:bg-[#001b38] transition"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
                <button
                  onClick={incrementReturningStudent}
                  className="w-full bg-[#009483] text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" /> Tăng 1 học sinh tái ghi danh
                </button>
              </div>
            </div>

            {/* Nút reset */}
            <div className="mt-8 text-center">
              <button
                onClick={resetAllStats}
                className="bg-orange-red text-white px-2 py-2 text-sm font-semibold rounded hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2"
              >
                <RefreshIcon className="h-5 w-5" />
                Reset tất cả số liệu
              </button>
            </div>

            {/* Thời gian cập nhật cuối */}
            <div className="mt-6 text-right text-sm text-gray-500">
              <p>Dữ liệu tự động cập nhật mỗi 30 giây</p>
              <button
                onClick={fetchStats}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Cập nhật ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionHomepage;
