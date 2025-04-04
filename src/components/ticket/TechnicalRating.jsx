import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { API_URL } from "../../config";

function TechnicalRating({ technicalId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get(
          `${API_URL}/tickets/technical-stats/${technicalId}`
        );
        if (res.data.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Error fetching technical stats:", error);
      }
    }
    fetchStats();
  }, [technicalId]);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const { averageRating, totalFeedbacks } = stats;

  // Hàm render sao dựa vào averageRating (tính theo 5 sao)
  const renderStars = () => {
    const stars = [];
    // Duyệt từ 1 đến 5 để tạo 5 vị trí sao
    for (let i = 1; i <= 5; i++) {
      if (averageRating >= i) {
        // Hiển thị sao đầy
        stars.push(<FaStar key={i} className="text-orange-red" />);
      } else if (averageRating >= i - 0.5) {
        // Hiển thị nửa sao
        stars.push(<FaStarHalfAlt key={i} className="text-orange-red" />);
      } else {
        // Hiển thị sao rỗng
        stars.push(<FaRegStar key={i} className="text-orange-400" />);
      }
    }
    return stars;
  };
  const renderBadges = () => {
    if (!stats.badgesCount || Object.keys(stats.badgesCount).length === 0)
      return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(stats.badgesCount).map(([badge, count]) => (
          <span
            key={badge}
            className="bg-[#002855] text-white text-xs px-2 py-1 rounded-full"
          >
            {badge} ({count})
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center font-bold text-lg">
        {averageRating.toFixed(1)}
      </span>
      <span className="flex items-center font-bold">{renderStars()}</span>
    </div>
  );
}

export default TechnicalRating;
