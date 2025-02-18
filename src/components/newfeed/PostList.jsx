import React from 'react';
import PostItem from './PostItem';

function PostList({ posts }) {
  if (!posts || posts.length === 0) {
    return <p>Không có bài viết nào</p>;
  }

  return (
    <div className="post-list-container">
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
    </div>
  );
}

export default PostList;