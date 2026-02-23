import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, ShieldBan, ShieldCheck, Bell } from 'lucide-react';
import ModLayout from '../../../layouts/ModLayout';
import { useToast } from '../../../context/ToastContext';
import { getModUsers, banUser, unbanUser } from '../../../service/mod/api.mod.user';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import '../../../styles/Admin/admin-global.css';

export default function ModUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Ban Modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');

  // Unban Modal
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanUser_, setUnbanUser_] = useState(null);

  // Notification Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterStatus, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      };
      if (filterStatus !== 'All') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const data = await getModUsers(params);
      setUsers(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDuration('');
    setShowBanModal(true);
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.warning('Please provide a reason for the ban.');
      return;
    }
    try {
      await banUser(selectedUser.userId, {
        reason: banReason,
        durationDays: banDuration ? parseInt(banDuration) : null
      });
      toast.success(`User ${selectedUser.fullName || selectedUser.email} has been banned.`);
      setShowBanModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Ban failed:', error);
      toast.error('Failed to ban user.');
    }
  };

  const openUnbanModal = (user) => {
    setUnbanUser_(user);
    setShowUnbanModal(true);
  };

  const handleUnban = async () => {
    if (!unbanUser_) return;
    try {
      await unbanUser(unbanUser_.userId);
      toast.success(`User ${unbanUser_.fullName || unbanUser_.email} has been unbanned.`);
      setShowUnbanModal(false);
      setUnbanUser_(null);
      fetchUsers();
    } catch (error) {
      console.error('Unban failed:', error);
      toast.error('Failed to unban user.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Banned': return 'badge-danger';
      case 'Inactive': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  return (
    <ModLayout>
      <div className="admin-orders-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>User Management</h1>
            <p>View users and manage bans</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={fetchUsers} disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
              className="admin-filter-select"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Banned">Banned</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>Users</h4>
            <span className="admin-results-count">Total: {pagination.total}</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading users...</td></tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.userId}>
                      <td><strong>#{user.userId}</strong></td>
                      <td>{user.fullName || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>{user.phone || '-'}</td>
                      <td><span className="admin-badge badge-secondary">{user.role}</span></td>
                      <td>
                        <span className={`admin-badge ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="admin-actions">
                        {user.status === 'Active' && user.role !== 'Admin' && (
                          <button 
                            className="admin-action-icon delete"
                            title="Ban User"
                            onClick={() => openBanModal(user)}
                          >
                            <ShieldBan size={18} />
                          </button>
                        )}
                        {user.status === 'Banned' && (
                          <button 
                            className="admin-action-icon edit"
                            title="Unban User"
                            onClick={() => openUnbanModal(user)}
                          >
                            <ShieldCheck size={18} />
                          </button>
                        )}
                        <button
                          className="admin-action-icon view"
                          title="Send Notification"
                          onClick={() => {
                            setNotifyTarget({
                              userId: user.userId,
                              userName: user.fullName || user.email,
                              defaultTitle: '',
                              defaultMessage: ''
                            });
                            setNotifyModalOpen(true);
                          }}
                        >
                          <Bell size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="admin-empty-state"><p>No users found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button className="admin-pagination-btn" disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
              Previous
            </button>
            <span className="admin-pagination-info">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button className="admin-pagination-btn" disabled={users.length < pagination.limit}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="admin-modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '480px'}}>
            <div className="admin-modal-header">
              <h3>Ban User: {selectedUser?.fullName || selectedUser?.email}</h3>
              <button className="admin-modal-close" onClick={() => setShowBanModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{marginBottom: '1rem'}}>
                <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Reason *</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter ban reason..."
                  rows={3}
                  style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontFamily:'inherit', resize:'vertical'}}
                />
              </div>
              <div>
                <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Duration (days, leave empty for permanent)</label>
                <input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  placeholder="e.g. 7, 30..."
                  min="1"
                  style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem'}}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowBanModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleBan} disabled={!banReason.trim()}
                style={{background: '#ef4444'}}>
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnbanModal}
        title="Unban User"
        message={`Are you sure you want to unban ${unbanUser_?.fullName || unbanUser_?.email || 'this user'}?`}
        onConfirm={handleUnban}
        onCancel={() => { setShowUnbanModal(false); setUnbanUser_(null); }}
        confirmText="Unban"
        type="primary"
      />

      {/* Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={notifyTarget.userId}
        userName={notifyTarget.userName}
        defaultTitle={notifyTarget.defaultTitle}
        defaultMessage={notifyTarget.defaultMessage}
        defaultType="system"
      />
    </ModLayout>
  );
}
