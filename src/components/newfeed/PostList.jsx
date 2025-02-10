// frontend/src/components/PostList.jsx
import React, { useState } from 'react';
import axios from 'axios';

function PostList({ posts }) {
  const [commentContent, setCommentContent] = useState('');

  const handleReact = async (postId, reactionType) => {
    try {
      await axios.post(`/api/newsfeed/${postId}/react`, { reactionType });
      // Sau khi reaction, có thể fetch lại posts hoặc update state cục bộ
      alert('Bạn vừa thả reaction!');
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  const handleComment = async (postId) => {
    try {
      await axios.post(`/api/newsfeed/${postId}/comment`, {
        content: commentContent,
      });
      setCommentContent('');
      alert('Đã bình luận!');
      // Fetch lại posts hoặc update state
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  return (
    <div>
      {posts.map((post) => (
        <div key={post._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: 10 }}>
          <p><strong>{post.author?.name}</strong> — <em>{post.type}</em></p>
          <p>{post.content}</p>
          {/* Hiển thị image, video nếu có */}
          <div>
            {post.images?.map((img, idx) => (
              <img key={idx} src={img} alt="post-img" style={{ maxWidth: 200 }} />
            ))}
          </div>
          <div>
            <button onClick={() => handleReact(post._id, 'like')}>👍 Like</button>
            <button onClick={() => handleReact(post._id, 'love')}>❤️ Love</button>
            <button onClick={() => handleReact(post._id, 'haha')}>😂 Haha</button>
            <button onClick={() => handleReact(post._id, 'sad')}>😢 Sad</button>
            <button onClick={() => handleReact(post._id, 'wow')}>😮 Wow</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <button onClick={() => handleComment(post._id)}>Bình luận</button>
          </div>
          <div style={{ marginTop: 10 }}>
            {post.comments?.map((cmt) => (
              <p key={cmt._id}>
                <strong>{cmt.user?.name}:</strong> {cmt.content}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostList;