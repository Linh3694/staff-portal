// frontend/src/pages/NewsfeedPage.jsx
import React, { useEffect, useState } from 'react';
import PostForm from '../components/newfeed/PostForm';
import PostList from '../components/newfeed/PostList';
import axios from 'axios';
import { API_URL } from "../config"; // Tùy chỉnh cho đúng dự án


function NewsfeedPage ( currentUser ) {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      // Gọi API lấy danh sách post, có thể gửi token kèm headers
      const res = await axios.get(`${API_URL}/newsfeed`, {
        // headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleNewPost = (newPost) => {
    // Thêm post mới vào đầu danh sách
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div>
      <PostForm onPostCreated={handleNewPost} currentUser={currentUser} />
      <PostList posts={posts} />
    </div>
  );
}

export default NewsfeedPage;