import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Eye, EyeOff, Upload } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import { 
  getUserInfo, 
  updateUserProfile, 
  newPassword 
} from '../../service/home/api.user';
import './userinfo.css';

export default function UserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
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

  // Mock data - replace with API call
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const response = await getUserInfo();
      setUserInfo(response);
      setProfileForm(response.profile || {});
      setError('');
    } catch (err) {
      setError('Failed to load user information');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(profileForm);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      loadUserInfo();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error:', err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await newPassword(passwordForm);
      setSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change password');
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="userinfo-container">
          <div className="loading-state">Loading user information...</div>
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
          <h1>My Profile</h1>
          <p>Manage your account information and preferences</p>
        </div>
        <div className="userinfo-header-actions">
          {!isEditing && !showPasswordForm && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                <User size={18} />
                Edit Profile
              </button>
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-secondary"
              >
                <Shield size={18} />
                Change Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">&times;</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">&times;</button>
        </div>
      )}

      <div className="userinfo-content">
        {/* Sidebar - Profile Card */}
        <div className="userinfo-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              <img 
                src={userInfo?.profile?.avatarUrl || 'https://via.placeholder.com/150'} 
                alt={userInfo?.profile?.fullName}
                className="avatar-image"
              />
              {isEditing && (
                <div className="avatar-overlay">
                  <Upload size={20} />
                </div>
              )}
            </div>
            <h3 className="profile-name">{userInfo?.profile?.fullName}</h3>
            <p className="profile-role">{userInfo?.role}</p>
            
            <div className="profile-status">
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className={`status-badge ${userInfo?.status?.toLowerCase()}`}>
                  {userInfo?.status}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Email Verified:</span>
                <span className={`status-badge ${userInfo?.emailVerified ? 'verified' : 'unverified'}`}>
                  {userInfo?.emailVerified ? '✓ Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Phone Verified:</span>
                <span className={`status-badge ${userInfo?.phoneVerified ? 'verified' : 'unverified'}`}>
                  {userInfo?.phoneVerified ? '✓ Verified' : 'Not Verified'}
                </span>
              </div>
            </div>

            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-label">Created At:</span>
                <span className="meta-value">{formatDate(userInfo?.createdAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Login:</span>
                <span className="meta-value">{formatDate(userInfo?.lastLoginAt)}</span>
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
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
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
                    <h6>Email Address</h6>
                    <p>{userInfo?.email}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon phone">
                    <Phone size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Phone Number</h6>
                    <p>{userInfo?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon location">
                    <MapPin size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Address</h6>
                    <p>{userInfo?.profile?.address || 'Not provided'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon birthday">
                    <Calendar size={24} />
                  </div>
                  <div className="info-details">
                    <h6>Birthday</h6>
                    <p>{userInfo?.profile?.birthday || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bio-section">
                <h5>Bio</h5>
                <p className="bio-text">{userInfo?.profile?.bio || 'No bio provided'}</p>
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
                      <td className="label">Full Name</td>
                      <td className="value">{userInfo?.profile?.fullName}</td>
                    </tr>
                    <tr>
                      <td className="label">Email</td>
                      <td className="value">{userInfo?.email}</td>
                    </tr>
                    <tr>
                      <td className="label">Phone</td>
                      <td className="value">{userInfo?.phone}</td>
                    </tr>
                    <tr>
                      <td className="label">Gender</td>
                      <td className="value">{userInfo?.profile?.gender}</td>
                    </tr>
                    <tr>
                      <td className="label">Address</td>
                      <td className="value">{userInfo?.profile?.address}</td>
                    </tr>
                    <tr>
                      <td className="label">Birthday</td>
                      <td className="value">{userInfo?.profile?.birthday}</td>
                    </tr>
                    <tr>
                      <td className="label">Role</td>
                      <td className="value">{userInfo?.role}</td>
                    </tr>
                    <tr>
                      <td className="label">Status</td>
                      <td className="value">
                        <span className={`badge ${userInfo?.status?.toLowerCase()}`}>
                          {userInfo?.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Email Verified</td>
                      <td className="value">
                        <span className={`badge ${userInfo?.emailVerified ? 'verified' : 'unverified'}`}>
                          {userInfo?.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Phone Verified</td>
                      <td className="value">
                        <span className={`badge ${userInfo?.phoneVerified ? 'verified' : 'unverified'}`}>
                          {userInfo?.phoneVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Account Created</td>
                      <td className="value">{formatDate(userInfo?.createdAt)}</td>
                    </tr>
                    <tr>
                      <td className="label">Last Login</td>
                      <td className="value">{formatDate(userInfo?.lastLoginAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="form-section">
              <h4>Edit Profile</h4>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileFormChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={profileForm.gender}
                      onChange={handleProfileFormChange}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Birthday</label>
                    <input
                      type="date"
                      name="birthday"
                      value={profileForm.birthday}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileFormChange}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileFormChange}
                    placeholder="Tell us about yourself"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Avatar URL</label>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={profileForm.avatarUrl}
                    onChange={handleProfileFormChange}
                    placeholder="Enter your avatar URL"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Form */}
          {showPasswordForm && (
            <div className="form-section">
              <h4>Change Password</h4>
              <form onSubmit={handleResetPassword} className="password-form">
                <div className="form-group">
                  <label>Current Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Enter current password"
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

                <div className="form-group">
                  <label>New Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Enter new password"
                      required
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

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordFormChange}
                      placeholder="Confirm new password"
                      required
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
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Change Password
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
