import api from '../../config/axios';

/**
 * Lấy danh sách bình luận theo listing
 */
export const getComments = async (listingId, skip = 0, take = 20) => {
    try {
        const response = await api.get(
            `/listings/${listingId}/comments?skip=${skip}&take=${take}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
};

/**
 * Tạo bình luận mới (hoặc reply nếu có parentId)
 */
export const createComment = async (listingId, content, parentId = null) => {
    try {
        const body = { listingId, content };
        if (parentId) body.parentId = parentId;
        const response = await api.post(
            `/listings/${listingId}/comments`,
            body
        );
        return response.data;
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
};

/**
 * Cập nhật bình luận
 */
export const updateComment = async (listingId, commentId, content) => {
    try {
        const response = await api.patch(
            `/listings/${listingId}/comments/${commentId}`,
            { content }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

/**
 * Xoá bình luận
 */
export const deleteComment = async (listingId, commentId) => {
    try {
        await api.delete(`/listings/${listingId}/comments/${commentId}`);
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

/**
 * Lấy danh sách trả lời của một bình luận
 */
export const getCommentReplies = async (listingId, commentId, skip = 0, take = 20) => {
    try {
        const response = await api.get(
            `/listings/${listingId}/comments/${commentId}/replies?skip=${skip}&take=${take}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching comment replies:', error);
        throw error;
    }
};
