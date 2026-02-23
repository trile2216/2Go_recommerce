import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getComments, createComment, updateComment, deleteComment, getCommentReplies } from '../service/home/api.comment';
import { formatTimeAgo } from '../utils/utils';
import ConfirmationModal from './Admin/ConfirmationModal';

function CommentItem({ comment, listingId, currentUserId, onReplySubmit, onUpdate, onDelete, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isOwner = currentUserId && currentUserId === comment.userId;

  const handleLoadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setLoadingReplies(true);
    try {
      const data = await getCommentReplies(listingId, comment.commentId, 0, 100);
      setReplies(data.items || []);
      setShowReplies(true);
    } catch {
      // silent
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const newReply = await onReplySubmit(replyContent, comment.commentId);
      if (newReply) {
        setReplies(prev => [...prev, newReply]);
        setShowReplies(true);
      }
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      await onUpdate(comment.commentId, editContent);
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    await onDelete(comment.commentId);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const avatarLetter = comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`comment-item ${depth > 0 ? 'comment-reply-item' : ''}`}>
      <div className="comment-row">
        <div className="comment-avatar-wrapper">
          {comment.userAvatarUrl ? (
            <img src={comment.userAvatarUrl} alt="" className="comment-avatar-img" />
          ) : (
            <div className="comment-avatar-letter">{avatarLetter}</div>
          )}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{comment.userName || 'Người dùng'}</span>
            <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          {isEditing ? (
            <div className="comment-edit-form">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="review-input comment-edit-input"
                rows="2"
              />
              <div className="comment-edit-actions">
                <button className="btn-comment-save" onClick={handleEdit} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button className="btn-comment-cancel" onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <p className="comment-content">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="comment-actions">
              {currentUserId && depth === 0 && (
                <button className="btn-comment-action" onClick={() => setShowReplyForm(!showReplyForm)}>
                  💬 Trả lời
                </button>
              )}
              {isOwner && (
                <>
                  <button className="btn-comment-action" onClick={() => setIsEditing(true)}>✏️ Sửa</button>
                  <button className="btn-comment-action btn-comment-delete" onClick={handleDeleteClick}>🗑️ Xoá</button>
                </>
              )}
              {comment.replyCount > 0 && depth === 0 && (
                <button className="btn-comment-action btn-show-replies" onClick={handleLoadReplies} disabled={loadingReplies}>
                  {loadingReplies ? 'Đang tải...' : showReplies ? `Ẩn ${comment.replyCount} trả lời` : `Xem ${comment.replyCount} trả lời`}
                </button>
              )}
            </div>
          )}

          {showReplyForm && (
            <div className="comment-reply-form">
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Viết trả lời..."
                className="review-input comment-reply-input"
                rows="2"
              />
              <div className="comment-edit-actions">
                <button className="btn-comment-save" onClick={handleReply} disabled={submitting || !replyContent.trim()}>
                  {submitting ? 'Đang gửi...' : 'Gửi'}
                </button>
                <button className="btn-comment-cancel" onClick={() => { setShowReplyForm(false); setReplyContent(''); }}>
                  Huỷ
                </button>
              </div>
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="comment-replies">
              {replies.map(reply => (
                <CommentItem
                  key={reply.commentId}
                  comment={reply}
                  listingId={listingId}
                  currentUserId={currentUserId}
                  onReplySubmit={onReplySubmit}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Xác nhận xoá bình luận"
        message="Bạn có chắc chắn muốn xoá bình luận này không?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Xoá"
        cancelText="Huỷ"
        type="danger"
      />
    </div>
  );
}

export default function ProductDescription({ description, specifications, listingId }) {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [skip, setSkip] = useState(0);
  const TAKE = 10;

  const user = useSelector(state => state.user);
  const currentUserId = user?.user?.userId || null;
  const isLoggedIn = !!user?.token;

  const loadComments = useCallback(async (reset = false) => {
    if (!listingId) return;
    setLoading(true);
    try {
      const nextSkip = reset ? 0 : skip;
      const data = await getComments(listingId, nextSkip, TAKE);
      // Chỉ hiển thị comment gốc (parentId == null)
      const rootComments = (data.items || []).filter(c => !c.parentId);
      if (reset) {
        setComments(rootComments);
        setSkip(TAKE);
      } else {
        setComments(prev => [...prev, ...rootComments]);
        setSkip(prev => prev + TAKE);
      }
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [listingId, skip]);

  useEffect(() => {
    loadComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const created = await createComment(listingId, newComment);
      setComments(prev => [created, ...prev]);
      setTotal(prev => prev + 1);
      setNewComment('');
    } catch {
      alert('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (content, parentId) => {
    try {
      const reply = await createComment(listingId, content, parentId);
      // Cập nhật replyCount cho comment cha
      setComments(prev =>
        prev.map(c =>
          c.commentId === parentId ? { ...c, replyCount: c.replyCount + 1 } : c
        )
      );
      return reply;
    } catch {
      alert('Không thể gửi trả lời. Vui lòng thử lại.');
      return null;
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    try {
      const updated = await updateComment(listingId, commentId, content);
      setComments(prev =>
        prev.map(c => (c.commentId === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c))
      );
    } catch {
      alert('Không thể cập nhật bình luận.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(listingId, commentId);
      setComments(prev => prev.filter(c => c.commentId !== commentId));
      setTotal(prev => prev - 1);
    } catch {
      alert('Không thể xoá bình luận.');
    }
  };

  const hasMore = comments.length < total;

  return (
    <div className="product-description-section">
      <div className="description-container">
        <div className="description-column">
          <h3 className="section-title">Mô tả chi tiết</h3>
          <div className="description-text">
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h4 className="subsection-title">Thông tin chi tiết:</h4>
          <ul className="feature-list">
            {specifications.highlights.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

        </div>

        <div className="reviews-column">
          <h3 className="section-title">Bình luận ({total})</h3>

          {/* Comment Form */}
          <div className="reviews-placeholder">
            {isLoggedIn ? (
              <div className="review-form">
                <textarea
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  className="review-input"
                  rows="3"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button
                  className="btn-submit-review"
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            ) : (
              <div className="no-reviews">
                <p>Vui lòng <a href="/auth/login" className="comment-login-link">đăng nhập</a> để bình luận</p>
              </div>
            )}

            {/* Comment List */}
            <div className="comment-list">
              {comments.length === 0 && !loading && (
                <div className="no-reviews">
                  <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                </div>
              )}

              {comments.map(comment => (
                <CommentItem
                  key={comment.commentId}
                  comment={comment}
                  listingId={listingId}
                  currentUserId={currentUserId}
                  onReplySubmit={handleReplySubmit}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              ))}

              {loading && (
                <div className="comment-loading">Đang tải bình luận...</div>
              )}

              {hasMore && !loading && (
                <button className="btn-load-more-comments" onClick={() => loadComments(false)}>
                  Xem thêm bình luận
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
