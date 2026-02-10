import api from '../../config/axios';

/**
 * Gửi câu hỏi tới AI Chatbot
 * @param {string} question - Câu hỏi của người dùng
 * @param {string|null} context - Ngữ cảnh hội thoại trước đó
 * @returns {Promise<{ answer: string, confidence: string, source: string, matchedIntent: string|null, suggestions: Array|null }>}
 */
export const askChatbot = async (question, context = null) => {
    try {
        const response = await api.post('/chatbot/ask', { question, context });
        return response.data;
    } catch (error) {
        console.error('Error calling chatbot:', error);
        throw error;
    }
};
