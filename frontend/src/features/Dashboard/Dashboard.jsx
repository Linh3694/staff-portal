// Dashboard.jsx - Phiên bản tối giản chỉ cho Flippage
import React, { useState, useEffect } from "react";
import FlippageAdmin from "../FlipPage/flippage-admin";
import { API_URL } from "../../core/config";

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState({
    id: "",
    fullname: "",
    email: "",
  });

  // Lấy thông tin người dùng khi component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser({
            id: data._id,
            fullname: data.fullname || "User",
            email: data.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header đơn giản */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Staff Portal - Flippage Admin
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.fullname}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("role");
                  window.location.href = "/login";
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <FlippageAdmin currentUser={currentUser} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
