import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

function PostForm({ onPostCreated, currentUser }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);

  // Gửi dữ liệu form lên server
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('content', content);
      // Nếu bạn muốn set type, visibility... tuỳ ý
      formData.append('type', 'Chia sẻ');
      formData.append('visibility', 'public');
      
      // Upload nhiều file
      if (images.length > 0) {
        images.forEach((img) => {
          formData.append('images', img);
        });
      }

      // headers phải có Content-Type = multipart/form-data
      const res = await axios.post(`${API_URL}/newsfeed`, formData, {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        //   'Content-Type': 'multipart/form-data'
        // }
      });

      if (res.data && res.data.post) {
        // Gọi callback, thêm post mới vào danh sách
        onPostCreated(res.data.post);
        // Reset form
        setContent('');
        setImages([]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  // Bắt sự kiện chọn ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  return (
    <div className="post-form-container">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Chia sẻ gì đó..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>
        <button type="submit">Đăng</button>
      </form>
    </div>
  );
}

export default PostForm;