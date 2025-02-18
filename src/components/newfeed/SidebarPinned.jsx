import React from 'react';

function SidebarPinned() {
  // Ví dụ list pinned cứng
  const pinnedPosts = [
    {
      id: 1,
      title: 'Chào mừng năm mới',
      author: 'Admin',
    },
    {
      id: 2,
      title: 'Nội quy công ty',
      author: 'HR Dept',
    },
  ];

  return (
    <div className="sidebar-pinned">
      <h3>Pinned Posts</h3>
      <ul>
        {pinnedPosts.map((p) => (
          <li key={p.id}>
            <strong>{p.title}</strong> - {p.author}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SidebarPinned;