import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, X, Check, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchCustomers, fetchCustomerById, deleteCustomerById, updateCustomerById } from '../../../service/admin/api.customer';
import { useToast } from '../../../context/ToastContext';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import './admin-customers.css';

export default function AdminCustomers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Notification Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Fetch customers on component mount and page change
  useEffect(() => {
    loadCustomers();
  }, [currentPage]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * pageSize;
      const data = await fetchCustomers({ skip, take: pageSize });
      setCustomers(data.items || []);
      const total = data.totalCount || data.total || (data.items || []).length;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / pageSize) || 1);
    } catch (err) {
      toast.error('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Deleted':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'badge-danger';
      case 'Manager':
        return 'badge-warning';
      case 'User':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    const matchesRole = filterRole === 'All' || customer.role === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleViewDetails = async (customer) => {
    try {
      const detailedCustomer = await fetchCustomerById(customer.userId);
      console.log('Fetched customer details:', detailedCustomer);
      setSelectedCustomer(detailedCustomer);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load customer details');
      console.error(error);
    }
  };

  const handleEditClick = (customer) => {
    // Handle both flat structure (from list) and nested profile structure (from detail)
    const profile = customer.profile || {};
    const fullName = profile.fullName || customer.fullName || '';
    
    // Convert birthday to YYYY-MM-DD format for date input
    let birthday = '';
    if (profile.birthday) {
      const birthdayDate = new Date(profile.birthday);
      birthday = birthdayDate.toISOString().split('T')[0];
    }
    
    setEditFormData({
      userId: customer.userId,
      email: customer.email || '',
      phone: customer.phone || '',
      fullName: fullName,
      birthday: birthday,
      gender: profile.gender || '',
      address: profile.address || '',
      bio: profile.bio || '',
      avatarUrl: profile.avatarUrl || '',
      status: customer.status,
      role: customer.role
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    try {
      // Validate required fields
      if (!editFormData.email || !editFormData.phone) {
        toast.error('Email and Phone are required fields');
        return;
      }

      // Send data with nested profile structure to match API expectations
      const updateData = {
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim() || '',
        status: editFormData.status,
        role: editFormData.role,
        profile: {
          fullName: editFormData.fullName.trim() || '',
          birthday: editFormData.birthday ? new Date(editFormData.birthday).toISOString().split('T')[0] : '',
          gender: editFormData.gender || '',
          address: editFormData.address.trim() || '',
          bio: editFormData.bio.trim() || '',
          avatarUrl: editFormData.avatarUrl.trim() || ''
        }
      };
      
      console.log('Sending update data:', updateData);
      
      await updateCustomerById(editFormData.userId, updateData);
      toast.success('Customer updated successfully');
      setShowEditModal(false);
      await loadCustomers();
    } catch (err) {
      // Extract backend error message if available
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update customer';
      toast.error(errorMessage);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomerById(id);
        toast.success('Customer deleted successfully');
        await loadCustomers();
      } catch (err) {
        toast.error('Failed to delete customer');
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="admin-customers-page">
        {/* Alerts */}

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Customers</h1>
            <p>Manage customer accounts and information</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-filter-select"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="admin-filter-select"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Customers ({totalCount})</h4>
            <span className="admin-results-count">
              Showing {filteredCustomers.length} of {totalCount}
            </span>
          </div>

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading customers...</div>
            ) : filteredCustomers.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.userId}>
                      <td className="admin-customer-name">
                        <strong>{customer.fullName || 'N/A'}</strong>
                      </td>
                      <td className="admin-email">
                        {customer.email}
                        {customer.emailVerified && <span className="admin-verified-badge">✓</span>}
                      </td>
                      <td className="admin-phone">
                        {customer.phone}
                        {customer.phoneVerified && <span className="admin-verified-badge">✓</span>}
                      </td>
                      <td>
                        <span className={`admin-badge ${getRoleBadgeClass(customer.role)}`}>
                          {customer.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="admin-date">{formatDate(customer.createdAt)}</td>
                      <td className="admin-date">{formatTime(customer.lastLoginAt)}</td>
                      <td className="admin-actions">
                        <button 
                          className="admin-btn-icon admin-btn-view"
                          onClick={() => handleViewDetails(customer)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-edit"
                          onClick={() => handleEditClick(customer)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-delete"
                          onClick={() => handleDeleteCustomer(customer.userId)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-view"
                          title="Send Notification"
                          onClick={() => {
                            setNotifyTarget({
                              userId: customer.userId,
                              userName: customer.fullName || customer.email,
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
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty-state">
                <p>No customers found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button 
                className="admin-pagination-btn" 
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
            >
                Previous
            </button>
            <span className="admin-pagination-info">Page {currentPage} of {totalPages}</span>
            <button 
                className="admin-pagination-btn"
                disabled={customers.length < pageSize} 
                onClick={() => handlePageChange(currentPage + 1)}
            >
                Next
            </button>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedCustomer && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Customer Details</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-modal-info">
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">User ID:</span>
                    <span className="admin-modal-value">{selectedCustomer.userId}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Full Name:</span>
                    <span className="admin-modal-value">{selectedCustomer.profile?.fullName || selectedCustomer.fullName || 'N/A'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Email:</span>
                    <span className="admin-modal-value">{selectedCustomer.email}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Phone:</span>
                    <span className="admin-modal-value">{selectedCustomer.phone}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Birthday:</span>
                    <span className="admin-modal-value">
                      {selectedCustomer.profile?.birthday 
                        ? formatDate(selectedCustomer.profile.birthday) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Gender:</span>
                    <span className="admin-modal-value">{selectedCustomer.profile?.gender || 'N/A'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Address:</span>
                    <span className="admin-modal-value">{selectedCustomer.profile?.address || 'N/A'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Bio:</span>
                    <span className="admin-modal-value">{selectedCustomer.profile?.bio || 'N/A'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Avatar URL:</span>
                    <span className="admin-modal-value">{selectedCustomer.profile?.avatarUrl || 'N/A'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Role:</span>
                    <span className={`admin-badge ${getRoleBadgeClass(selectedCustomer.role)}`}>
                      {selectedCustomer.role}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Status:</span>
                    <span className={`admin-badge ${getStatusBadgeClass(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Email Verified:</span>
                    <span className="admin-modal-value">
                      {selectedCustomer.emailVerified ? <span style={{color: 'green'}}>✓ Yes</span> : <span style={{color: 'red'}}>✗ No</span>}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Phone Verified:</span>
                    <span className="admin-modal-value">
                      {selectedCustomer.phoneVerified ? <span style={{color: 'green'}}>✓ Yes</span> : <span style={{color: 'red'}}>✗ No</span>}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Joined:</span>
                    <span className="admin-modal-value">{formatDate(selectedCustomer.createdAt)}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Last Login:</span>
                    <span className="admin-modal-value">{formatTime(selectedCustomer.lastLoginAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Edit Customer</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editFormData.fullName || ''}
                    onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Birthday</label>
                    <input
                      type="date"
                      value={editFormData.birthday || ''}
                      onChange={(e) => setEditFormData({...editFormData, birthday: e.target.value})}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Gender</label>
                    <select 
                      value={editFormData.gender || ''}
                      onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                      className="admin-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Bio</label>
                  <textarea
                    value={editFormData.bio || ''}
                    onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                    className="admin-input"
                    rows="3"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Avatar URL</label>
                  <input
                    type="url"
                    value={editFormData.avatarUrl || ''}
                    onChange={(e) => setEditFormData({...editFormData, avatarUrl: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Role</label>
                    <select 
                      value={editFormData.role || ''}
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      className="admin-input"
                    >
                      <option value="User">User</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select 
                      value={editFormData.status || ''}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="admin-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Deleted">Deleted</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={handleUpdateCustomer}
                >
                  <Check size={20} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </AdminLayout>
  );
}
