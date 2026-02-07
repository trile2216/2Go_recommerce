import api from '../../config/axios.js';

/**
 * Upload ảnh lên Cloudinary thông qua backend
 * @param {File} file - File ảnh cần upload
 * @returns {Promise} - Response từ backend chứa URL ảnh
 */
export const uploadImage = async (file) => {
    try {
        if (!file) {
            throw new Error('File is required');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/uploads/image', formData);

        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload nhiều ảnh cùng lúc
 * @param {FileList|File[]} files - Danh sách file ảnh cần upload
 * @returns {Promise} - Promise mảng các response
 */
export const uploadMultipleImages = async (files) => {
    try {
        if (!files || files.length === 0) {
            throw new Error('Files are required');
        }

        const uploadPromises = Array.from(files).map((file) =>
            uploadImage(file)
        );

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
};

/**
 * Upload ảnh và trả về URL
 * @param {File|File[]} files - File ảnh hoặc mảng file ảnh cần upload
 * @returns {Promise<string|string[]>} - URL của ảnh đã upload (hoặc mảng URL nếu input là mảng)
 */
export const uploadImageAndGetUrl = async (files) => {
    try {
        // Nếu là mảng files
        if (Array.isArray(files)) {
            if (files.length === 0) {
                throw new Error('Files are required');
            }
            const results = await uploadMultipleImages(files);
            return results.map(response => response.url || response.imageUrl || response.data);
        } else {
            // Nếu là single file
            const response = await uploadImage(files);
            return response.url || response.imageUrl || response.data;
        }
    } catch (error) {
        console.error('Error uploading image and getting URL:', error);
        throw error;
    }
};
