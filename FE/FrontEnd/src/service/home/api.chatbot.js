import api from '../../config/axios';
import { generateContent } from './api.gemini';

/**
 * Gửi câu hỏi tới AI Chatbot
 * @param {string} question - Câu hỏi của người dùng
 * @param {string|null} context - Ngữ cảnh hội thoại trước đó
 * @returns {Promise<{ answer: string, confidence: string, source: string, matchedIntent: string|null, suggestions: Array|null }>}
 */
export const askChatbot = async (question, context = null) => {
    try {
        const response = await api.post('/chatbot/ask', { question, context });
        const data = response.data;

        // Nếu backend trả về độ tin cậy thấp (LOW) và không có listings gợi ý
        // -> Fallback gọi trực tiếp Gemini API
        if ((data.confidence === 'LOW' || data.answer.startsWith("Mình chưa có")) &&
            (!data.suggestions || data.suggestions.length === 0)) {

            try {
                const geminiData = await generateContent(question);
                if (geminiData && geminiData.text) {
                    return {
                        answer: geminiData.text,
                        confidence: 'HIGH', // Gemini trả lời thì coi như tin cậy
                        source: 'GEMINI_DIRECT',
                        matchedIntent: null,
                        suggestions: null
                    };
                }
            } catch (geminiError) {
                console.warn('Gemini fallback failed:', geminiError);
                // Nếu Gemini lỗi, trả về response gốc của chatbot
                return data;
            }
        }

        return data;
    } catch (error) {
        console.error('Error calling chatbot:', error);
        throw error;
    }
};
