import api from "../../config/axios";

/**
 * Lấy thông tin user hiện tại
 * GET /api/users/me
 * @returns {Promise<UserInfoResponse>}
 * UserInfoResponse: { userId, email, phone, role, status, createdAt, lastLoginAt, emailVerified, phoneVerified,
 *   profile: { fullName, birthday, gender, address, bio, avatarUrl, bankAccountNumber, bankAccountName } }
 */
export const getUserInfo = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

/**
 * Cập nhật thông tin profile
 * PATCH /api/users/me
 * @param {{ fullName?: string, birthday?: string, gender?: string, address?: string, bio?: string, avatarUrl?: string, bankAccountNumber?: string, bankAccountName?: string }} profileData
 * @returns {Promise<UserInfoResponse>}
 *//**
* Cập nhật thông tin profile
* PATCH /api/users/me
* @param {{ fullName?: string, birthday?: string, gender?: string, address?: string, bio?: string, avatarUrl?: string, bankAccountNumber?: string, bankAccountName?: string }} profileData
* @returns {Promise<UserInfoResponse>}
*/
export const updateUserProfile = async (profileData) => {
    const response = await api.patch('/users/me', profileData);
    return response.data;
};

/**
 * Đổi mật khẩu
 * PUT /api/users/me/password
 * @param {{ currentPassword: string, newPassword: string }} data
 * @returns {Promise<BasicResponse>}
 */
export const changePassword = async (data) => {
    const response = await api.put('/users/me/password', data);
    return response.data;
};

/**
 * Lấy danh sách thiết bị đã đăng nhập
 * GET /api/users/me/devices
 * @returns {Promise<DeviceResponse[]>}
 */
export const getMyDevices = async () => {
    const response = await api.get('/users/me/devices');
    return response.data;
};

/**
 * Xóa thiết bị đăng nhập
 * DELETE /api/users/me/devices/:deviceId
 * @param {number} deviceId
 * @returns {Promise<BasicResponse>}
 */
export const removeDevice = async (deviceId) => {
    const response = await api.delete(`/users/me/devices/${deviceId}`);
    return response.data;
};

/**
 * Lấy lịch sử hoạt động
 * GET /api/users/me/activity
 * @returns {Promise<ActivityResponse[]>}
 */
export const getMyActivity = async () => {
    const response = await api.get('/users/me/activity');
    return response.data;
};