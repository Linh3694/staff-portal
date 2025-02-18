import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config'; // đường dẫn API backend
import PostForm from '../components/newfeed/PostForm';
import PostList from '../components/newfeed/PostList';
import SidebarEvents from '../components/newfeed/SidebarEvents';
import SidebarPinned from '../components/newfeed/SidebarPinned';
import WisersDaily from '../components/newfeed/WisersDaily';

function NewsfeedPage({ currentUser }) {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      // Gửi request GET /newsfeed
      const res = await axios.get(`${API_URL}/newsfeed`, {
        // headers: { Authorization: `Bearer ${token}` }, // nếu cần xác thực
      });
      // API trả về { posts: [...] }
      if (res.data && res.data.posts) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  // Lần đầu load trang -> gọi API lấy danh sách post
  useEffect(() => {
    fetchPosts();
  }, []);

  // Hàm callback để thêm post mới lên đầu
  const handleNewPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="newsfeed-container">
      {/* Cột bên trái: sự kiện */}
      <div className="newsfeed-left">
        <SidebarEvents />
      </div>

      {/* Cột giữa: Daily, Form post, list post */}
      <div className="newsfeed-center">
        <WisersDaily />
        
        <PostForm onPostCreated={handleNewPost} currentUser={currentUser} />
        
        <PostList posts={posts} />
      </div>

      {/* Cột bên phải: pinned post */}
      <div className="newsfeed-right">
        <SidebarPinned />
      </div>
    </div>
  );
}

export default NewsfeedPage;