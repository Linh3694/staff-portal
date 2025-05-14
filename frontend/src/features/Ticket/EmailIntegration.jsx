import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../core/config";
import { toast } from "react-toastify";

const EmailIntegration = () => {
  const [loading, setLoading] = useState(false);

  const handleFetchEmails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/email/fetch-emails`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error("Không thể fetch emails: " + (res.data.message || ""));
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi fetch emails.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <button
        disabled={loading}
        onClick={handleFetchEmails}
        className="px-4 py-2 bg-[#002855] text-white rounded font-bold"
      >
        {loading ? "Đang tải..." : "Lấy Email & Tạo Ticket"}
      </button>
    </div>
  );
};

export default EmailIntegration;
