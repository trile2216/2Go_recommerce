import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import UserLayout from '../../layouts/UserLayout';
import { useToast } from '../../context/ToastContext';
import { updateUser } from '../../context/UserSlice';
import { 
  getUserInfo, 
  updateUserProfile, 
  changePassword 
} from '../../service/home/api.user';
import { uploadImageAndGetUrl } from '../../service/upload/api.upload';
import '../../styles/loader.css';
import './userinfo.css';

export default function UserInfo() {
  const toast = useToast();
  const dispatch = useDispatch();
  const avatarInputRef = useRef(null);
  // Load initial data from localStorage, then refresh from API
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [userInfo, setUserInfo] = useState(storedUser);
  const [loading, setLoading] = useState(!storedUser);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    birthday: '',
    gender: '',
    address: '',
    bio: '',
    avatarUrl: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Pre-fill form from stored data
    if (storedUser) {
      setProfileForm({
        fullName: storedUser.profile?.fullName || '',
        birthday: storedUser.profile?.birthday || '',
        gender: storedUser.profile?.gender || '',
        address: storedUser.profile?.address || '',
        bio: storedUser.profile?.bio || '',
        avatarUrl: storedUser.profile?.avatarUrl || ''
      });
    }
    // Also refresh from API to get latest data
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      if (!userInfo) setLoading(true);
      const data = await getUserInfo();
      setUserInfo(data);
      // Update localStorage & Redux with latest data
      dispatch(updateUser(data));
      // Pre-fill form with profile data
      setProfileForm({
        fullName: data.profile?.fullName || '',
        birthday: data.profile?.birthday || '',
        gender: data.profile?.gender || '',
        address: data.profile?.address || '',
        bio: data.profile?.bio || '',
        avatarUrl: data.profile?.avatarUrl || ''
      });
    } catch (err) {
      console.error('Error loading user info:', err);
      if (!userInfo) toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName?.trim()) {
      toast.warning('Vui lòng nhập họ và tên');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUserProfile(profileForm);
      setUserInfo(updated);
      // Sync updated profile to localStorage & Redux
      dispatch(updateUser(updated));
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 8) {
      toast.warning('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('Mật khẩu xác nhận không khớp');
      return;
    }

    // Check password has at least 1 letter and 1 digit
    const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword);
    const hasDigit = /\d/.test(passwordForm.newPassword);
    if (!hasLetter || !hasDigit) {
      toast.warning('Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số');
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      console.error('Error changing password:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Đổi mật khẩu thất bại';
      toast.error(typeof msg === 'string' ? msg : 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const startEditing = () => {
    setProfileForm({
      fullName: userInfo?.profile?.fullName || '',
      birthday: userInfo?.profile?.birthday || '',
      gender: userInfo?.profile?.gender || '',
      address: userInfo?.profile?.address || '',
      bio: userInfo?.profile?.bio || '',
      avatarUrl: userInfo?.profile?.avatarUrl || ''
    });
    setIsEditing(true);
    setShowPasswordForm(false);
  };

  const startPasswordChange = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(true);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file ảnh (jpg, png, gif...)');
      return;
    }

    // Validate file size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Ảnh không được vượt quá 10 MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadImageAndGetUrl(file);
      setProfileForm(prev => ({ ...prev, avatarUrl: url }));
      toast.success('Tải ảnh lên thành công!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Tải ảnh lên thất bại, vui lòng thử lại');
    } finally {
      setUploadingAvatar(false);
      // Reset input để có thể chọn lại cùng file
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="userinfo-container">
          <div className="loading-state">
            <div className="loader"></div>
            <div className="loading-state-text">Đang tải thông tin...</div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!userInfo) {
    return (
      <UserLayout>
        <div className="userinfo-container">
          <div className="loading-state">
            <p>Không thể tải thông tin người dùng</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="userinfo-container">
      {/* Header */}
      <div className="userinfo-header">
        <div className="userinfo-header-content">
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản của bạn</p>
        </div>
        <div className="userinfo-header-actions">
          {!isEditing && !showPasswordForm && (
            <>
              <button 
                onClick={startEditing}
                className="ui-btn ui-btn-primary"
              >
                <User size={18} />
                Chỉnh sửa
              </button>
              <button 
                onClick={startPasswordChange}
                className="ui-btn ui-btn-secondary"
              >
                <Shield size={18} />
                Đổi mật khẩu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="userinfo-content">
        {/* Sidebar - Profile Card */}
        <div className="userinfo-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              <img 
                src={(isEditing ? profileForm.avatarUrl : userInfo.profile?.avatarUrl) || 'https://via.placeholder.com/150?text=Avatar'} 
                alt={userInfo.profile?.fullName || 'Avatar'}
                className="avatar-image"
              />
              {isEditing && (
                <div className="avatar-overlay" onClick={handleAvatarClick}>
                  {uploadingAvatar ? (
                    <Loader2 size={24} className="spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <h3 className="profile-name">{userInfo.profile?.fullName || 'Chưa cập nhật'}</h3>
            
            <div className="profile-status">
              <div className="status-item">
                <span className="ui-status-label">Trạng thái:</span>
                <span className={`status-badge ${userInfo.status?.toLowerCase()}`}>
                  {userInfo.status === 'Active' ? 'Hoạt động' : userInfo.status}
                </span>
              </div>
              <div className="status-item">
                <span className="ui-status-label">Email:</span>
                <span className={`status-badge ${userInfo.emailVerified ? 'verified' : 'unverified'}`}>
                  {userInfo.emailVerified ? '✓ Đã xác minh' : 'Chưa xác minh'}
                </span>
              </div>
              <div className="status-item">
                <span className="ui-status-label">Điện thoại:</span>
                <span className={`status-badge ${userInfo.phoneVerified ? 'verified' : 'unverified'}`}>
                  {userInfo.phoneVerified ? '✓ Đã xác minh' : 'Chưa xác minh'}
                </span>
              </div>
            </div>

            <div className="profile-meta">
              <div className="ui-meta-item">
                <span className="meta-label">Ngày tạo tài khoản</span>
                <span className="meta-value">{formatDate(userInfo.createdAt)}</span>
              </div>
              <div className="ui-meta-item">
                <span className="meta-label">Đăng nhập lần cuối</span>
                <span className="meta-value">{formatDate(userInfo.lastLoginAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="userinfo-main">
          {/* Tabs */}
          <div className="userinfo-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button 
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Chi tiết
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && !isEditing && !showPasswordForm && (
            <div className="tab-content">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon email">
                    <Mail size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Email</h6>
                    <p>{userInfo.email || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon phone">
                    <Phone size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Số điện thoại</h6>
                    <p>{userInfo.phone || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon location">
                    <MapPin size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Địa chỉ</h6>
                    <p>{userInfo.profile?.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon birthday">
                    <Calendar size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Ngày sinh</h6>
                    <p>{userInfo.profile?.birthday || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>

              <div className="bio-section">
                <h5>Giới thiệu</h5>
                <p className="bio-text">{userInfo.profile?.bio || 'Chưa có giới thiệu'}</p>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && !isEditing && !showPasswordForm && (
            <div className="tab-content">
              <div className="details-table">
                <table>
                  <tbody>
                    <tr>
                      <td className="label">Họ và tên</td>
                      <td className="value">{userInfo.profile?.fullName || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="label">Email</td>
                      <td className="value">{userInfo.email || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="label">Số điện thoại</td>
                      <td className="value">{userInfo.phone || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="label">Giới tính</td>
                      <td className="value">
                        {userInfo.profile?.gender === 'Male' ? 'Nam' 
                          : userInfo.profile?.gender === 'Female' ? 'Nữ' 
                          : userInfo.profile?.gender || 'Chưa cập nhật'}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Địa chỉ</td>
                      <td className="value">{userInfo.profile?.address || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="label">Ngày sinh</td>
                      <td className="value">{userInfo.profile?.birthday || 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="label">Trạng thái</td>
                      <td className="value">
                        <span className={`ui-badge ${userInfo.status?.toLowerCase()}`}>
                          {userInfo.status === 'Active' ? 'Hoạt động' : userInfo.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Email xác minh</td>
                      <td className="value">
                        <span className={`ui-badge ${userInfo.emailVerified ? 'verified' : 'unverified'}`}>
                          {userInfo.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">SĐT xác minh</td>
                      <td className="value">
                        <span className={`ui-badge ${userInfo.phoneVerified ? 'verified' : 'unverified'}`}>
                          {userInfo.phoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Ngày tạo tài khoản</td>
                      <td className="value">{formatDate(userInfo.createdAt)}</td>
                    </tr>
                    <tr>
                      <td className="label">Đăng nhập lần cuối</td>
                      <td className="value">{formatDate(userInfo.lastLoginAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="form-section">
              <h4>Chỉnh sửa hồ sơ</h4>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="ui-form-row">
                  <div className="ui-form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileFormChange}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                  <div className="ui-form-group">
                    <label>Giới tính</label>
                    <select
                      name="gender"
                      value={profileForm.gender}
                      onChange={handleProfileFormChange}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="ui-form-row">
                  <div className="ui-form-group">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      name="birthday"
                      value={profileForm.birthday}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                  <div className="ui-form-group">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileFormChange}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                <div className="ui-form-group">
                  <label>Giới thiệu</label>
                  <textarea
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileFormChange}
                    placeholder="Giới thiệu về bản thân"
                    rows="4"
                  />
                </div>

                <div className="ui-form-group">
                  <label>Ảnh đại diện</label>
                  <div className="avatar-upload-field">
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary avatar-upload-btn"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <><Loader2 size={16} className="spin" /> Đang tải lên...</>
                      ) : (
                        <><Upload size={16} /> Chọn ảnh từ máy</>
                      )}
                    </button>
                    {profileForm.avatarUrl && (
                      <span className="avatar-upload-preview">
                        <img src={profileForm.avatarUrl} alt="Preview" />
                        <span className="avatar-upload-filename">Đã tải ảnh lên</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="ui-btn ui-btn-secondary"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={saving}>
                    {saving ? (
                      <><Loader2 size={16} className="spin" /> Đang lưu...</>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Form */}
          {showPasswordForm && (
            <div className="form-section">
              <h4>Đổi mật khẩu</h4>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="ui-form-group">
                  <label>Mật khẩu hiện tại *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="password-toggle"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="ui-form-group">
                  <label>Mật khẩu mới *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Ít nhất 8 ký tự, gồm chữ cái và chữ số"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="password-toggle"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="ui-form-group">
                  <label>Xác nhận mật khẩu mới *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="password-toggle"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="ui-btn ui-btn-secondary"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={saving}>
                    {saving ? (
                      <><Loader2 size={16} className="spin" /> Đang xử lý...</>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
    </UserLayout>
  );
}
