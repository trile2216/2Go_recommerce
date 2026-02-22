import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, X, Check } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchPlans, fetchPlanById, deletePlanById, updatePlanById, createPlan } from '../../../service/admin/api.plan';
import { useToast } from '../../../context/ToastContext';
import './Plan.css';

export default function Plan() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Fetch plans on component mount and page change
  useEffect(() => {
    loadPlans();
  }, [pagination.page]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const skip = (pagination.page - 1) * pagination.limit;
      const data = await fetchPlans({ skip, take: pagination.limit });
      setPlans(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total || data.totalCount || 0 }));
    } catch (err) {
      toast.error('Failed to load plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || (filterStatus === 'Active' ? plan.isActive : !plan.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = async (plan) => {
    try {
      const detailedPlan = await fetchPlanById(plan.planId);
      setSelectedPlan(detailedPlan);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load plan details');
      console.error(error);
    }
  };

  const handleEditClick = (plan) => {
    setEditFormData({
      planId: plan.planId,
      code: plan.code || '',
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || 0,
      durationDays: plan.durationDays || 30,
      monthlyListingLimit: plan.monthlyListingLimit || 0,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder || 1
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setEditFormData({
      code: '',
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      monthlyListingLimit: 0,
      isActive: true,
      sortOrder: plans.length + 1
    });
    setShowCreateModal(true);
  };

  const handleUpdatePlan = async () => {
    try {
      // Validate required fields
      if (!editFormData.name) {
        toast.error('Name is a required field');
        return;
      }

      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || '',
        price: Number(editFormData.price) || 0,
        durationDays: Number(editFormData.durationDays) || 30,
        monthlyListingLimit: Number(editFormData.monthlyListingLimit) || 0,
        isActive: editFormData.isActive,
        sortOrder: Number(editFormData.sortOrder) || 1
      };

      await updatePlanById(editFormData.planId, updateData);
      toast.success('Plan updated successfully');
      setShowEditModal(false);
      await loadPlans();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update plan';
      toast.error(errorMessage);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleCreatePlan = async () => {
    try {
      // Validate required fields
      if (!editFormData.code || !editFormData.name) {
        toast.error('Code and Name are required fields');
        return;
      }

      const createData = {
        code: editFormData.code.trim().toUpperCase(),
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || '',
        price: Number(editFormData.price) || 0,
        durationDays: Number(editFormData.durationDays) || 30,
        monthlyListingLimit: Number(editFormData.monthlyListingLimit) || 0,
        isActive: editFormData.isActive,
        sortOrder: Number(editFormData.sortOrder) || 1
      };

      await createPlan(createData);
      toast.success('Plan created successfully');
      setShowCreateModal(false);
      await loadPlans();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create plan';
      toast.error(errorMessage);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deletePlanById(id);
        toast.success('Plan deleted successfully');
        await loadPlans();
      } catch (err) {
        toast.error('Failed to delete plan');
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="admin-plans-page">

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Subscription Plans</h1>
            <p>Manage subscription plans and pricing</p>
          </div>
          <button 
            className="admin-btn admin-btn-primary"
            onClick={handleCreateClick}
          >
            <Plus size={20} />
            Add New Plan
          </button>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name, code or description..."
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
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Plans ({filteredPlans.length})</h4>
            <span className="admin-results-count">
              Showing {filteredPlans.length} of {plans.length}
            </span>
          </div>

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading plans...</div>
            ) : filteredPlans.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Listing Limit</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr key={plan.planId}>
                      <td className="admin-plan-code">
                        <strong>{plan.code}</strong>
                      </td>
                      <td className="admin-plan-name">
                        {plan.name}
                      </td>
                      <td className="admin-plan-price">
                        {formatCurrency(plan.price)}
                      </td>
                      <td className="admin-plan-duration">
                        {plan.durationDays} days
                      </td>
                      <td className="admin-plan-limit">
                        {plan.monthlyListingLimit === null ? 'Unlimited' : plan.monthlyListingLimit + ' listings'}
                      </td>
                      <td>
                        <span className={`admin-badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
   
                      <td className="admin-date">{formatDate(plan.updatedAt)}</td>
                      <td className="admin-actions">
                        <button 
                          className="admin-btn-icon admin-btn-view"
                          onClick={() => handleViewDetails(plan)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-edit"
                          onClick={() => handleEditClick(plan)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-delete"
                          onClick={() => handleDeletePlan(plan.planId)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty-state">
                <p>No plans found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button 
                className="admin-pagination-btn" 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
                Previous
            </button>
            <span className="admin-pagination-info">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}</span>
            <button 
                className="admin-pagination-btn"
                disabled={plans.length < pagination.limit} 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
                Next
            </button>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedPlan && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Plan Details</h3>
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
                    <span className="admin-modal-label">Plan ID:</span>
                    <span className="admin-modal-value">{selectedPlan.planId}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Code:</span>
                    <span className="admin-modal-value"><strong>{selectedPlan.code}</strong></span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Name:</span>
                    <span className="admin-modal-value">{selectedPlan.name}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Description:</span>
                    <span className="admin-modal-value">{selectedPlan.description}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Price:</span>
                    <span className="admin-modal-value">{formatCurrency(selectedPlan.price)}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Duration:</span>
                    <span className="admin-modal-value">{selectedPlan.durationDays} days</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Monthly Listing Limit:</span>
                    <span className="admin-modal-value">{selectedPlan.monthlyListingLimit === null ? 'Unlimited' : selectedPlan.monthlyListingLimit + ' listings'}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Status:</span>
                    <span className={`admin-badge ${selectedPlan.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {selectedPlan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Sort Order:</span>
                    <span className="admin-modal-value">{selectedPlan.sortOrder}</span>
                  </div>
                  <div className="admin-modal-row">
                    <span className="admin-modal-label">Last Updated:</span>
                    <span className="admin-modal-value">{formatDate(selectedPlan.updatedAt)}</span>
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
                <h3>Edit Plan</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={editFormData.code || ''}
                    onChange={(e) => setEditFormData({...editFormData, code: e.target.value.toUpperCase()})}
                    className="admin-input"
                    placeholder="e.g., BASIC, PREMIUM"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="admin-input"
                    placeholder="Plan name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="admin-input"
                    rows="3"
                    placeholder="Plan description"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price (VND)</label>
                    <input
                      type="number"
                      value={editFormData.price || 0}
                      onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      className="admin-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      value={editFormData.durationDays || 30}
                      onChange={(e) => setEditFormData({...editFormData, durationDays: e.target.value})}
                      className="admin-input"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Monthly Listing Limit</label>
                    <input
                      type="number"
                      value={editFormData.monthlyListingLimit || 0}
                      onChange={(e) => setEditFormData({...editFormData, monthlyListingLimit: e.target.value})}
                      className="admin-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={editFormData.sortOrder || 1}
                      onChange={(e) => setEditFormData({...editFormData, sortOrder: e.target.value})}
                      className="admin-input"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editFormData.isActive || false}
                      onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                    />
                    {' '}Active
                  </label>
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
                  onClick={handleUpdatePlan}
                >
                  <Check size={20} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Create New Plan</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={editFormData.code || ''}
                    onChange={(e) => setEditFormData({...editFormData, code: e.target.value.toUpperCase()})}
                    className="admin-input"
                    placeholder="e.g., BASIC, PREMIUM"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="admin-input"
                    placeholder="Plan name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="admin-input"
                    rows="3"
                    placeholder="Plan description"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price (VND)</label>
                    <input
                      type="number"
                      value={editFormData.price || 0}
                      onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      className="admin-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      value={editFormData.durationDays || 30}
                      onChange={(e) => setEditFormData({...editFormData, durationDays: e.target.value})}
                      className="admin-input"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Monthly Listing Limit</label>
                    <input
                      type="number"
                      value={editFormData.monthlyListingLimit || 0}
                      onChange={(e) => setEditFormData({...editFormData, monthlyListingLimit: e.target.value})}
                      className="admin-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={editFormData.sortOrder || 1}
                      onChange={(e) => setEditFormData({...editFormData, sortOrder: e.target.value})}
                      className="admin-input"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editFormData.isActive || false}
                      onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                    />
                    {' '}Active
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={handleCreatePlan}
                >
                  <Check size={20} />
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
