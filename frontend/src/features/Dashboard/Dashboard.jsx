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
    <div className="min-h-screen">
    
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white">
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
