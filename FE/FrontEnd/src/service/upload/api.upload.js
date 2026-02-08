import api from '../../config/axios.js';

// --- Helpers ---

const buildFormData = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
};

/**
 * Trích xuất secure URL từ CloudinaryUploadResult
 * Backend trả về: { publicId, url, secureUrl }
 */
const extractUrl = (result) => result.secureUrl || result.url;

// --- Image ---

/**
 * Upload 1 ảnh lên Cloudinary (max 10 MB)
 * @param {File} file
 * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
 */
export const uploadImage = async (file) => {
    if (!file) throw new Error('File is required');

    const { data } = await api.post('/uploads/image', buildFormData(file));
    return data;
};

/**
 * Upload nhiều ảnh cùng lúc
 * @param {FileList|File[]} files
 * @returns {Promise<Array<{publicId: string, url: string, secureUrl: string}>>}
 */
export const uploadMultipleImages = async (files) => {
    const list = Array.from(files);
    if (list.length === 0) throw new Error('Files are required');

    return Promise.all(list.map(uploadImage));
};

/**
 * Upload ảnh và chỉ trả về URL (secureUrl ưu tiên)
 * @param {File|File[]} files
 * @returns {Promise<string|string[]>}
 */
export const uploadImageAndGetUrl = async (files) => {
    if (Array.isArray(files)) {
        const results = await uploadMultipleImages(files);
        return results.map(extractUrl);
    }
    return extractUrl(await uploadImage(files));
};

// --- Video ---

/**
 * Upload 1 video lên Cloudinary (max 50 MB)
 * @param {File} file
 * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
 */
export const uploadVideo = async (file) => {
    if (!file) throw new Error('File is required');

    const { data } = await api.post('/uploads/video', buildFormData(file));
    return data;
};

/**
 * Upload nhiều video cùng lúc
 * @param {FileList|File[]} files
 * @returns {Promise<Array<{publicId: string, url: string, secureUrl: string}>>}
 */
export const uploadMultipleVideos = async (files) => {
    const list = Array.from(files);
    if (list.length === 0) throw new Error('Files are required');

    return Promise.all(list.map(uploadVideo));
};

/**
 * Upload video và chỉ trả về URL (secureUrl ưu tiên)
 * @param {File|File[]} files
 * @returns {Promise<string|string[]>}
 */
export const uploadVideoAndGetUrl = async (files) => {
    if (Array.isArray(files)) {
        const results = await uploadMultipleVideos(files);
        return results.map(extractUrl);
    }
    return extractUrl(await uploadVideo(files));
};
