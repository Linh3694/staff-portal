import React from 'react';

function PostItem({ post }) {
  const {
    _id,
    author,
    content,
    images,
    reactions,
    comments,
    createdAt,
    isPinned,
  } = post;

  // Tính tổng reaction, comment
  const totalReactions = reactions ? reactions.length : 0;
  const totalComments = comments ? comments.length : 0;

  return (
    <div className="post-item">
      {isPinned && <div className="post-pinned-label">Pinned</div>}

      <div className="post-author">
        <strong>{author?.name || 'Người dùng ẩn danh'}</strong>
        <span className="post-date">
          {new Date(createdAt).toLocaleString('vi-VN')}
        </span>
      </div>

      <div className="post-content">
        <p>{content}</p>
      </div>

      {images && images.length > 0 && (
        <div className="post-images">
          {images.map((imgSrc, idx) => (
            <img key={idx} src={`/${imgSrc}`} alt="post-img" />
          ))}
        </div>
      )}

      {/* Thống kê reactions & comments */}
      <div className="post-actions">
        <span>{totalReactions} lượt react</span>
        <span>{totalComments} bình luận</span>
        {/* Có thể thêm nút Like, Comment */}
      </div>

      {/* Nếu hiển thị comment chi tiết, map ra */}
      {comments && comments.length > 0 && (
        <div className="post-comments">
          {comments.map((cmt, idx) => (
            <div key={idx} className="post-comment-item">
              <strong>{cmt.user?.name || 'User'}</strong>: {cmt.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostItem;