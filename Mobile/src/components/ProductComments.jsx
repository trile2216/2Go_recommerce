import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getComments, createComment, deleteComment } from "../service/home/api.comment";
import { useAuth } from "../context/AuthContext";

const CommentItem = ({ comment, currentUserId, onDelete }) => {
  const isOwner = currentUserId === comment.userId;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "hôm nay";
    if (diffDays === 1) return "hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const avatarLetter = comment.userName ? comment.userName.charAt(0).toUpperCase() : "U";

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {comment.userAvatarUrl ? (
          <Image source={{ uri: comment.userAvatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        )}
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.userName || "Người dùng"}</Text>
          <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        
        {isOwner && (
          <Pressable onPress={() => onDelete(comment.commentId)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const ProductComments = ({ listingId }) => {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skip, setSkip] = useState(0);
  const TAKE = 5;

  const { user, isLoggedIn } = useAuth();
  const currentUserId = user?.userId || null;

  const loadComments = useCallback(async (reset = false) => {
    if (!listingId) return;
    setLoading(true);
    try {
      const nextSkip = reset ? 0 : skip;
      const data = await getComments(listingId, nextSkip, TAKE);
      // Only root comments
      const rootComments = (data.items || []).filter(c => !c.parentId);
      
      if (reset) {
        setComments(rootComments);
        setSkip(TAKE);
      } else {
        setComments(prev => [...prev, ...rootComments]);
        setSkip(prev => prev + TAKE);
      }
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoading(false);
    }
  }, [listingId, skip]);

  useEffect(() => {
    loadComments(true);
  }, [listingId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const created = await createComment(listingId, newComment);
      if (created) {
        setComments(prev => [created, ...prev]);
        setTotal(prev => prev + 1);
        setNewComment("");
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(listingId, commentId);
            setComments(prev => prev.filter(c => c.commentId !== commentId));
            setTotal(prev => prev - 1);
          } catch (e) {
            Alert.alert("Lỗi", "Không thể xóa bình luận.");
          }
        },
      },
    ]);
  };

  const hasMore = comments.length < total;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bình luận ({total})</Text>

      {/* Input Form */}
      {isLoggedIn ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Hãy hỏi người bán chi tiết về sản phẩm..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable 
            style={[styles.submitButton, submitting || !newComment.trim() ? styles.submitDisabled : {}]} 
            disabled={submitting || !newComment.trim()}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Vui lòng đăng nhập để bình luận</Text>
        </View>
      )}

      {/* Comment List */}
      <View style={styles.listContainer}>
        {comments.length === 0 && !loading && (
          <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.commentId}
            comment={comment}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        ))}

        {loading && <ActivityIndicator style={styles.loader} size="small" color="#359EFF" />}

        {hasMore && !loading && (
          <Pressable style={styles.loadMoreButton} onPress={() => loadComments(false)}>
            <Text style={styles.loadMoreText}>Xem thêm {total - comments.length} bình luận</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 44,
    maxHeight: 120,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#359EFF",
    justifyContent: "center",
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: 16,
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  listContainer: {
    gap: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 12,
  },
  loader: {
    paddingVertical: 12,
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#359EFF",
    fontWeight: "600",
    fontSize: 14,
  },
  // Comment Item Styles
  commentItem: {
    flexDirection: "row",
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  deleteText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
});

export default ProductComments;
