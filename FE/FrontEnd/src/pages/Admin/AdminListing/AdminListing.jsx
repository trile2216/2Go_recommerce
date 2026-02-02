import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchListings, fetchListingById, deleteListingById, updateListingById } from '../../../service/admin/api.listing';
import './AdminListing.css';

export default function AdminListing() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch listings on component mount
  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await fetchListings();
      setListings(data.items || []);
      setError('');
    } catch (err) {
      setError('Failed to load listings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Sold':
        return 'badge-secondary';
      case 'Draft':
        return 'badge-warning';
      case 'PendingReview':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PendingReview':
        return 'Pending Review';
      default:
        return status;
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = async (listing) => {
    try {
      const detailedListing = await fetchListingById(listing.listingId);
      setSelectedListing(detailedListing);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load listing details');
    }
  };

  const handleEditClick = (listing) => {
    setEditFormData({
      listingId: listing.listingId,
      title: listing.title,
      price: listing.price,
      status: listing.status,
      categoryId: listing.categoryId,
      subCategoryId: listing.subCategoryId
    });
    setShowEditModal(true);
  };

  const handleUpdateListing = async () => {
    try {
      await updateListingById(editFormData.listingId, editFormData);
      setSuccess('Listing updated successfully');
      setShowEditModal(false);
      await loadListings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update listing');
      console.error(err);
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListingById(id);
        setSuccess('Listing deleted successfully');
        await loadListings();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete listing');
        console.error(err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="admin-listing-page">
        {/* Alerts */}
        {error && <div className="admin-alert alert-error">{error}</div>}
        {success && <div className="admin-alert alert-success">{success}</div>}


        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search listings by title or category..."
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
              <option value="Draft">Draft</option>
              <option value="PendingReview">Pending Review</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Listings ({filteredListings.length})</h4>
            <span className="admin-results-count">
              Showing {filteredListings.length} of {listings.length}
            </span>
          </div>

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading listings...</div>
            ) : filteredListings.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.listingId}>
                      <td className="admin-listing-image">
                        <img 
                          src={listing.primaryImageUrl} 
                          alt={listing.title}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                        />
                      </td>
                      <td className="admin-listing-title">
                        <strong>{listing.title}</strong>
                      </td>
                      <td>
                        <div className="admin-category-info">
                          <div className="admin-category">{listing.categoryName}</div>
                          <div className="admin-subcategory">{listing.subCategoryName}</div>
                        </div>
                      </td>
                      <td className="admin-price">{formatPrice(listing.price)}</td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(listing.status)}`}>
                          {getStatusLabel(listing.status)}
                        </span>
                      </td>
                      <td className="admin-date">{formatDate(listing.createdAt)}</td>
                      <td className="admin-actions">
                        <button 
                          className="admin-btn-icon admin-btn-view"
                          onClick={() => handleViewDetails(listing)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-edit"
                          onClick={() => handleEditClick(listing)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="admin-btn-icon admin-btn-delete"
                          onClick={() => handleDeleteListing(listing.listingId)}
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
                <p>No listings found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedListing && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Listing Details</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-modal-grid">
                  <div className="admin-modal-image">
                    <img 
                      src={selectedListing.primaryImageUrl} 
                      alt={selectedListing.title}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                    />
                  </div>
                  <div className="admin-modal-info">
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Title:</span>
                      <span className="admin-modal-value">{selectedListing.title}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Listing ID:</span>
                      <span className="admin-modal-value">{selectedListing.listingId}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Price:</span>
                      <span className="admin-modal-value">{formatPrice(selectedListing.price)}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Status:</span>
                      <span className={`admin-badge ${getStatusBadgeClass(selectedListing.status)}`}>
                        {getStatusLabel(selectedListing.status)}
                      </span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Category:</span>
                      <span className="admin-modal-value">{selectedListing.categoryName}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Sub Category:</span>
                      <span className="admin-modal-value">{selectedListing.subCategoryName}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Created:</span>
                      <span className="admin-modal-value">{formatDate(selectedListing.createdAt)}</span>
                    </div>
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
                <h3>Edit Listing</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      value={editFormData.price || ''}
                      onChange={(e) => setEditFormData({...editFormData, price: parseFloat(e.target.value)})}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select 
                      value={editFormData.status || ''}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="admin-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="PendingReview">Pending Review</option>
                      <option value="Sold">Sold</option>
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
                  onClick={handleUpdateListing}
                >
                  <Check size={20} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
