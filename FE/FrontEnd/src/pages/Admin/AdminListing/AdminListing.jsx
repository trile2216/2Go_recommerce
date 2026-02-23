import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, X, Check, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchListings, fetchListingById, deleteListingById, updateListingStatusById } from '../../../service/admin/api.listing';
import './AdminListing.css';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';

export default function AdminListing() {
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal states
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Notification Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });
  const [statusFormData, setStatusFormData] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  // Pagination (simple client-side for now, or match backend params)
  const [pagination, setPagination] = useState({ skip: 0, take: 20, total: 0, page: 1 });

  // Fetch listings
  useEffect(() => {
    loadListings();
  }, [filterStatus, pagination.page]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.take,
        take: pagination.take
      };
      
      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }

      const data = await fetchListings(params);
      setListings(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Sold': return 'badge-secondary';
      case 'Draft': return 'badge-warning';
      case 'PendingReview': return 'badge-info';
      case 'Rejected': return 'badge-danger';
      case 'Deleted': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  // Filter by search term locally for now (since backend search is limited)
  const filteredListings = listings.filter(listing => {
    const term = searchTerm.toLowerCase();
    return (
      (listing.title && listing.title.toLowerCase().includes(term)) ||
      (listing.categoryName && listing.categoryName.toLowerCase().includes(term))
    );
  });

  const handleViewDetails = async (listing) => {
    try {
      const detailedListing = await fetchListingById(listing.listingId);
      setSelectedListing(detailedListing);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load listing details');
    }
  };

  const handleEditStatusClick = (listing) => {
    setStatusFormData({
      listingId: listing.listingId,
      title: listing.title,
      currentStatus: listing.status,
      newStatus: listing.status
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await updateListingStatusById(statusFormData.listingId, statusFormData.newStatus);
      toast.success('Listing status updated successfully');
      setShowStatusModal(false);
      await loadListings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update listing status');
    }
  };

  const handleDeleteListing = async () => {
    if (!deleteId) return;
    try {
      await deleteListingById(deleteId);
      toast.success('Listing deleted successfully');
      setDeleteId(null);
      await loadListings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete listing');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-listing-page">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h1>Listings</h1>
            <p>Manage product listings and moderation</p>
          </div>
        </div>

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
              <option value="PendingReview">Pending Review</option>
              <option value="Draft">Draft</option>
              <option value="Sold">Sold</option>
              <option value="Rejected">Rejected</option>
              <option value="Flagged">Flagged</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>Listings List</h4>
            <span className="admin-results-count">
              Total: {pagination.total} listings
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
                        <div className="listing-title_text" title={listing.title}>
                             {listing.title}
                        </div>
                      </td>
                      <td>
                        <div className="admin-category-info">
                          <div className="admin-category">{listing.categoryName || '-'}</div>
                          <div className="admin-subcategory">{listing.subCategoryName || '-'}</div>
                        </div>
                      </td>
                      <td className="admin-price">{formatPrice(listing.price)}</td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(listing.status)}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="admin-date">{formatDate(listing.createdAt)}</td>
                      <td className="admin-actions">
                        <button 
                          className="admin-action-icon view"
                          onClick={() => handleViewDetails(listing)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="admin-action-icon edit"
                          onClick={() => handleEditStatusClick(listing)}
                          title="Update Status"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="admin-action-icon delete"
                          onClick={() => setDeleteId(listing.listingId)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          className="admin-action-icon view"
                          title="Notify Seller"
                          onClick={() => {
                            setNotifyTarget({
                              userId: listing.userId,
                              userName: listing.sellerName || `Seller`,
                              defaultTitle: `Listing: ${listing.title}`,
                              defaultMessage: `Regarding your listing "${listing.title}"`
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
                <p>No listings found</p>
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
            <span className="admin-pagination-info">Page {pagination.page} of {Math.ceil(pagination.total / pagination.take) || 1}</span>
            <button 
                className="admin-pagination-btn"
                disabled={filteredListings.length < pagination.take} 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
                Next
            </button>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedListing && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
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
                    {/* Show gallery if needed */}
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
                      <span className="admin-modal-label">Seller:</span>
                      <span className="admin-modal-value">{selectedListing.sellerName} ({selectedListing.sellerEmail})</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Price:</span>
                      <span className="admin-modal-value">{formatPrice(selectedListing.price)}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Status:</span>
                      <span className={`admin-badge ${getStatusBadgeClass(selectedListing.status)}`}>
                        {selectedListing.status}
                      </span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Category:</span>
                      <span className="admin-modal-value">{selectedListing.categoryName} {'>'} {selectedListing.subCategoryName}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Created:</span>
                      <span className="admin-modal-value">{formatDate(selectedListing.createdAt)}</span>
                    </div>
                     <div className="admin-modal-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                      <span className="admin-modal-label">Full Description:</span>
                      <p className="admin-modal-value description-text" style={{marginTop: '5px', textAlign: 'left', lineHeight: '1.5'}}>{selectedListing.description || 'No description provided.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && (
          <div className="admin-modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Update Listing Status</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowStatusModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p>Updating status for: <strong>{statusFormData.title}</strong></p>
                <div className="admin-form-group" style={{marginTop: '15px'}}>
                  <label>New Status</label>
                  <select 
                    value={statusFormData.newStatus}
                    onChange={(e) => setStatusFormData({...statusFormData, newStatus: e.target.value})}
                    className="admin-input"
                  >
                    <option value="Active">Active</option>
                    <option value="PendingReview">Pending Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Sold">Sold</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                    <option value="Flagged">Flagged</option>
                    {/* Add other statuses as needed */}
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={handleUpdateStatus}
                >
                  <Check size={20} />
                  Save Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Delete */}
        <ConfirmationModal 
            isOpen={!!deleteId}
            title="Delete Listing"
            message="Are you sure you want to delete this listing? This action cannot be undone."
            onConfirm={handleDeleteListing}
            onCancel={() => setDeleteId(null)}
        />

        {/* Notification Modal */}
        <SendNotificationModal
          isOpen={notifyModalOpen}
          onClose={() => setNotifyModalOpen(false)}
          userId={notifyTarget.userId}
          userName={notifyTarget.userName}
          defaultTitle={notifyTarget.defaultTitle}
          defaultMessage={notifyTarget.defaultMessage}
          defaultType="listing"
        />
      </div>
    </AdminLayout>
  );
}

