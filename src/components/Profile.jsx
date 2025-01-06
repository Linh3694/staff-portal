import React, { useEffect, useState } from "react";


const Profile = ({
  currentUser = {
    avatar: "",
    fullname: "",
    role: "",
    email: "",
    phone: "",
  },
  ticketHistory = [],
  assignedDevices = [],
  darkMode,
  setCurrentUser,
}) => {
  const colors = {
    background: darkMode ? "#1E293B" : "#FFFFFF",
    text: darkMode ? "#F1F5F9" : "#1E293B",
    cardBackground: darkMode ? "#334155" : "#FFFFFF",
    buttonBackground: darkMode ? "#475569" : "#002147",
    buttonHover: darkMode ? "#64748B" : "#CBD5E1",
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`/api/users/${currentUser.id}/avatar`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (data.avatar) {
        setCurrentUser((prev) => ({ ...prev, avatar: data.avatar }));
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Block */}
      <div
        className="col-span-1 rounded-lg shadow-lg p-6"
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.text,
        }}
      >
        <div className="text-center">
          <img
            src={currentUser.avatar || "https://via.placeholder.com/150"}
            alt="User Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold">{currentUser.fullname || "Unknown User"}</h2>
          <p className="text-sm">{currentUser.role || "No Title"}</p>
        </div>
        <div className="mt-6">
          <p>
            <strong>Email:</strong> {currentUser.email || "Not Available"}
          </p>
          <p>
            <strong>Phone:</strong> {currentUser.phone || "Not Available"}
          </p>
          <button
            className="mt-4 w-full py-2 rounded-lg"
            style={{
              backgroundColor: colors.buttonBackground,
              color: "#FFF",
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Right Block */}
      <div className="col-span-1 md:col-span-2 grid gap-6">
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            backgroundColor: colors.cardBackground,
            color: colors.text,
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Ticket History</h3>
          <ul className="space-y-3">
            {ticketHistory.map((ticket, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{ticket.title}</span>
                <span className={`text-sm ${ticket.statusClass}`}>{ticket.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            backgroundColor: colors.cardBackground,
            color: colors.text,
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Assigned Devices</h3>
          <ul className="space-y-3">
            {assignedDevices.map((device, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{device.name}</span>
                <span className="text-sm">{device.serial}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;