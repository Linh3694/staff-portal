import React from 'react';

function WisersDaily() {
  // Thay đổi data tuỳ nhu cầu
  const dailyItems = [
    { id: 1, user: 'Alice', highlight: 'Chia sẻ khoảnh khắc' },
    { id: 2, user: 'Bob', highlight: 'Ảnh du lịch' },
    // ...
  ];

  return (
    <div className="wisers-daily-container">
      <h2>WISers’ Daily</h2>
      <div className="wisers-daily-list">
        {dailyItems.map((item) => (
          <div key={item.id} className="wisers-daily-item">
            <div className="wisers-daily-user">{item.user}</div>
            <div className="wisers-daily-content">{item.highlight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WisersDaily;