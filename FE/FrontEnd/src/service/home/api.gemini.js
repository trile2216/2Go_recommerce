import api from '../../config/axios';

/**
 * Generate text from Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<{ text: string }>}
 */
export const generateContent = async (prompt) => {
    try {
        const response = await api.post('/ai/gemini/generate', { prompt });
        return response.data;
    } catch (error) {
        console.error('Error generating content from Gemini:', error);
        throw error;
    }
};

export default {
    generateContent
};
