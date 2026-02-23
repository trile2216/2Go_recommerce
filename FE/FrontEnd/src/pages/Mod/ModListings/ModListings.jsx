import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, CheckCircle, XCircle, Flag, Eye, Bell, X } from 'lucide-react';
import ModLayout from '../../../layouts/ModLayout';
import { useToast } from '../../../context/ToastContext';
import { getModListings, getModListingById, approveListing, rejectListing, flagListing } from '../../../service/mod/api.mod.listing';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import '../../../styles/Admin/admin-global.css';

export default function ModListings() {
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PendingReview');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Detail Modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Reject/Flag Modal
  const [actionModal, setActionModal] = useState({ show: false, type: '', listing: null });
  const [actionReason, setActionReason] = useState('');

  // Notification Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });

  useEffect(() => {
    fetchListings();
  }, [pagination.page, filterStatus]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      };
      if (filterStatus !== 'All') params.status = filterStatus;

      const data = await getModListings(params);
      setListings(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (listing) => {
    try {
      const detail = await getModListingById(listing.listingId);
      setSelectedListing(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching listing detail:', error);
      toast.error('Failed to load listing details');
    }
  };

  const handleApprove = async (listingId) => {
    try {
      await approveListing(listingId);
      toast.success('Listing approved!');
      fetchListings();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Failed to approve listing.');
    }
  };

  const openActionModal = (type, listing) => {
    setActionModal({ show: true, type, listing });
    setActionReason('');
  };

  const handleActionSubmit = async () => {
    if (!actionReason.trim()) {
      toast.warning('Please provide a reason.');
      return;
    }
    const { type, listing } = actionModal;
    try {
      if (type === 'reject') {
        await rejectListing(listing.listingId, { reason: actionReason });
        toast.success('Listing rejected.');
      } else if (type === 'flag') {
        await flagListing(listing.listingId, { reason: actionReason });
        toast.success('Listing flagged.');
      }
      setActionModal({ show: false, type: '', listing: null });
      setShowDetailModal(false);
      fetchListings();
    } catch (error) {
      console.error(`${type} failed:`, error);
      toast.error(`Failed to ${type} listing.`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'PendingReview': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      case 'Flagged': return 'badge-danger';
      case 'Draft': return 'badge-secondary';
      case 'Sold': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  return (
    <ModLayout>
      <div className="admin-orders-page">
        <div className="admin-page-header">
          <div>
            <h1>Listing Moderation</h1>
            <p>Review, approve, reject, or flag listings</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={fetchListings} disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters-section">
          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
              className="admin-filter-select"
            >
              <option value="All">All Status</option>
              <option value="PendingReview">Pending Review</option>
              <option value="Active">Active</option>
              <option value="Flagged">Flagged</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>Listings</h4>
            <span className="admin-results-count">Total: {pagination.total}</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
                ) : listings.length > 0 ? (
                  listings.map((listing) => (
                    <tr key={listing.listingId}>
                      <td><strong>#{listing.listingId}</strong></td>
                      <td>
                        {listing.primaryImageUrl ? (
                          <img src={listing.primaryImageUrl} alt={listing.title} 
                            style={{width:48, height:48, objectFit:'cover', borderRadius:6}} />
                        ) : (
                          <div style={{width:48, height:48, background:'#f1f5f9', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.7rem'}}>
                            No img
                          </div>
                        )}
                      </td>
                      <td style={{maxWidth: 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {listing.title}
                      </td>
                      <td>
                        <span style={{fontSize: '0.85rem', color: '#64748b'}}>
                          {listing.categoryName || '-'}{listing.subCategoryName ? ` / ${listing.subCategoryName}` : ''}
                        </span>
                      </td>
                      <td className="admin-price"><strong>{formatPrice(listing.price)}</strong></td>
                      <td>
                        <span className={`admin-badge ${getStatusColor(listing.status)}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td>{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="admin-actions">
                        <button className="admin-action-icon view" title="View Details"
                          onClick={() => handleViewDetail(listing)}>
                          <Eye size={18} />
                        </button>
                        {listing.status === 'PendingReview' && (
                          <>
                            <button className="admin-action-icon edit" title="Approve"
                              onClick={() => handleApprove(listing.listingId)}>
                              <CheckCircle size={18} />
                            </button>
                            <button className="admin-action-icon delete" title="Reject"
                              onClick={() => openActionModal('reject', listing)}>
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {listing.status === 'Active' && (
                          <button className="admin-action-icon delete" title="Flag Listing"
                            onClick={() => openActionModal('flag', listing)}>
                            <Flag size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="admin-empty-state"><p>No listings found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-pagination-btn" disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</button>
            <span className="admin-pagination-info">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button className="admin-pagination-btn" disabled={listings.length < pagination.limit}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedListing && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', maxHeight: '85vh', overflow: 'auto'}}>
            <div className="admin-modal-header">
              <h3>Listing Detail #{selectedListing.listingId}</h3>
              <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}><X size={24} /></button>
            </div>
            <div className="admin-modal-body">
              {/* Images */}
              {selectedListing.media && selectedListing.media.length > 0 && (
                <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom: '1rem'}}>
                  {selectedListing.media.filter(m => m.mediaType === 'Image').map((m, i) => (
                    <img key={i} src={m.url} alt={`media-${i}`}
                      style={{width:100, height:100, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0'}} />
                  ))}
                </div>
              )}

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                <div><strong>Title:</strong> {selectedListing.title}</div>
                <div><strong>Price:</strong> {formatPrice(selectedListing.price)}</div>
                <div><strong>Category:</strong> {selectedListing.categoryName} / {selectedListing.subCategoryName}</div>
                <div><strong>Condition:</strong> {selectedListing.condition || '-'}</div>
                <div><strong>Brand:</strong> {selectedListing.brand || '-'}</div>
                <div><strong>Status:</strong> <span className={`admin-badge ${getStatusColor(selectedListing.status)}`}>{selectedListing.status}</span></div>
                <div><strong>Seller:</strong> {selectedListing.sellerName || '-'} (ID: {selectedListing.sellerId})</div>
                <div><strong>Location:</strong> {selectedListing.wardName}, {selectedListing.districtName}</div>
              </div>

              {selectedListing.description && (
                <div style={{marginTop:'1rem'}}>
                  <strong>Description:</strong>
                  <p style={{marginTop:'0.25rem', color:'#475569', whiteSpace:'pre-wrap'}}>{selectedListing.description}</p>
                </div>
              )}

              {/* Attributes */}
              {selectedListing.attributes && selectedListing.attributes.length > 0 && (
                <div style={{marginTop:'1rem'}}>
                  <strong>Attributes:</strong>
                  <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:'0.25rem'}}>
                    {selectedListing.attributes.map((attr, i) => (
                      <span key={i} className="admin-badge badge-secondary">{attr.name}: {attr.value}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              {selectedListing.status === 'PendingReview' && (
                <>
                  <button className="admin-btn admin-btn-primary" onClick={() => handleApprove(selectedListing.listingId)}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{background:'#ef4444', color:'#fff', borderColor:'#ef4444'}}
                    onClick={() => openActionModal('reject', selectedListing)}>
                    <XCircle size={16} /> Reject
                  </button>
                </>
              )}
              {selectedListing.status === 'Active' && (
                <button className="admin-btn admin-btn-secondary" style={{background:'#f59e0b', color:'#fff', borderColor:'#f59e0b'}}
                  onClick={() => openActionModal('flag', selectedListing)}>
                  <Flag size={16} /> Flag
                </button>
              )}
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setNotifyTarget({
                    userId: selectedListing.sellerId,
                    userName: selectedListing.sellerName || `Seller #${selectedListing.sellerId}`,
                    defaultTitle: `Listing: ${selectedListing.title}`,
                    defaultMessage: `Regarding your listing "${selectedListing.title}"`
                  });
                  setNotifyModalOpen(true);
                }}
              >
                <Bell size={16} /> Notify Seller
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Flag Modal */}
      {actionModal.show && (
        <div className="admin-modal-overlay" onClick={() => setActionModal({ show: false, type: '', listing: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '480px'}}>
            <div className="admin-modal-header">
              <h3>{actionModal.type === 'reject' ? 'Reject' : 'Flag'} Listing: {actionModal.listing?.title}</h3>
              <button className="admin-modal-close" onClick={() => setActionModal({ show: false, type: '', listing: null })}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div>
                <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Enter ${actionModal.type} reason...`}
                  rows={3}
                  style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontFamily:'inherit', resize:'vertical'}}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setActionModal({ show: false, type: '', listing: null })}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleActionSubmit} disabled={!actionReason.trim()}
                style={{background: actionModal.type === 'reject' ? '#ef4444' : '#f59e0b'}}>
                {actionModal.type === 'reject' ? 'Reject' : 'Flag'} Listing
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
        defaultType="listing"
      />
    </ModLayout>
  );
}
