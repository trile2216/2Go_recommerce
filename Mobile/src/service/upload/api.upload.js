import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API;

// --- Helpers ---

/**
 * Build FormData for React Native file upload
 * React Native requires file object with: uri, type, name
 */
const buildFormData = (file) => {
    const formData = new FormData();
    // For React Native, file should have { uri, type, name }
    formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `upload_${Date.now()}.jpg`,
    });
    return formData;
};

/**
 * Trích xuất secure URL từ CloudinaryUploadResult
 * Backend trả về: { publicId, url, secureUrl }
 */
const extractUrl = (result) => result.secureUrl || result.url;

/**
 * Upload file using fetch (more reliable in React Native than axios for FormData)
 */
const uploadWithFetch = async (endpoint, file) => {
    const token = await AsyncStorage.getItem('token');
    const formData = buildFormData(file);
    
    console.log(`[Upload] Uploading to ${endpoint}`, { uri: file.uri, type: file.type, name: file.name });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            // Don't set Content-Type - fetch will set it with proper boundary for FormData
        },
        body: formData,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Upload Error] ${response.status}:`, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Upload Success]`, data);
    return data;
};

// --- Image ---

/**
 * Upload 1 ảnh lên Cloudinary (max 10 MB)
 * @param {{uri: string, type: string, name: string}} file
 * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
 */
export const uploadImage = async (file) => {
    if (!file || !file.uri) throw new Error('File with uri is required');
    return uploadWithFetch('/uploads/image', file);
};

/**
 * Upload nhiều ảnh cùng lúc (sequential to avoid network issues)
 * @param {Array<{uri: string, type: string, name: string}>} files
 * @returns {Promise<Array<{publicId: string, url: string, secureUrl: string}>>}
 */
export const uploadMultipleImages = async (files) => {
    const list = Array.from(files);
    if (list.length === 0) throw new Error('Files are required');

    // Upload sequentially to avoid network congestion
    const results = [];
    for (const file of list) {
        const result = await uploadImage(file);
        results.push(result);
    }
    return results;
};

/**
 * Upload ảnh và chỉ trả về URL (secureUrl ưu tiên)
 * @param {Array<{uri: string, type: string, name: string}>|{uri: string, type: string, name: string}} files
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
 * @param {{uri: string, type: string, name: string}} file
 * @returns {Promise<{publicId: string, url: string, secureUrl: string}>}
 */
export const uploadVideo = async (file) => {
    if (!file || !file.uri) throw new Error('File with uri is required');
    return uploadWithFetch('/uploads/video', file);
};

/**
 * Upload nhiều video cùng lúc (sequential)
 * @param {Array<{uri: string, type: string, name: string}>} files
 * @returns {Promise<Array<{publicId: string, url: string, secureUrl: string}>>}
 */
export const uploadMultipleVideos = async (files) => {
    const list = Array.from(files);
    if (list.length === 0) throw new Error('Files are required');

    const results = [];
    for (const file of list) {
        const result = await uploadVideo(file);
        results.push(result);
    }
    return results;
};

/**
 * Upload video và chỉ trả về URL (secureUrl ưu tiên)
 * @param {Array<{uri: string, type: string, name: string}>|{uri: string, type: string, name: string}} files
 * @returns {Promise<string|string[]>}
 */
export const uploadVideoAndGetUrl = async (files) => {
    if (Array.isArray(files)) {
        const results = await uploadMultipleVideos(files);
        return results.map(extractUrl);
    }
    return extractUrl(await uploadVideo(files));
};
