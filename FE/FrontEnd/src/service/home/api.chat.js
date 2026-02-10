import api from '../../config/axios';

/**
 * Lấy danh sách các cuộc trò chuyện của user hiện tại
 * @returns {Promise<Array<{ chatId: number, otherUserId: number, lastMessage: string|null, lastMessageAt: string|null }>>}
 */
export const fetchMyChats = async () => {
    try {
        const response = await api.get('/chats');
        return response.data;
    } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
    }
};

/**
 * Tạo hoặc lấy cuộc trò chuyện với 1 user khác
 * @param {number} otherUserId
 * @returns {Promise<{ chatId: number, otherUserId: number, lastMessage: string|null, lastMessageAt: string|null }>}
 */
export const createOrGetChat = async (otherUserId) => {
    try {
        const response = await api.post('/chats', { otherUserId });
        return response.data;
    } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
    }
};

/**
 * Lấy tin nhắn của 1 cuộc trò chuyện
 * @param {number} chatId
 * @param {number} skip
 * @param {number} take
 * @returns {Promise<Array<{ messageId: number, chatId: number, senderId: number|null, content: string|null, imageUrl: string|null, sentAt: string|null }>>}
 */
export const fetchMessages = async (chatId, skip = 0, take = 20) => {
    try {
        const response = await api.get(`/chats/${chatId}/messages?skip=${skip}&take=${take}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

/**
 * Gửi tin nhắn
 * @param {number} chatId
 * @param {{ content?: string, imageUrl?: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendMessage = async (chatId, data) => {
    try {
        const response = await api.post(`/chats/${chatId}/messages`, data);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};
