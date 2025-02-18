import React from 'react';

function SidebarEvents() {
  // Ở đây ta mô phỏng 1 list event cứng. Tuỳ ý fetch real API.
  const events = [
    { id: 1, date: '2025-02-18', title: 'Year End Party' },
    { id: 2, date: '2025-03-01', title: 'Team Building' },
    // ...
  ];

  return (
    <div className="sidebar-events">
      <h3>Upcoming Events</h3>
      <ul>
        {events.map((ev) => (
          <li key={ev.id}>
            <span>{ev.date}</span> - {ev.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SidebarEvents;