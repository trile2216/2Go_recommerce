import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Bell, Trash2, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { fetchListingById, updateListingStatusById, deleteListingById } from '../../../service/admin/api.listing';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import './AdminListing.css';

export default function AdminListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Notification
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await fetchListingById(Number(id));
      setListing(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Sold': return 'badge-secondary';
      case 'Draft': return 'badge-warning';
      case 'PendingReview': return 'badge-info';
      case 'Rejected': case 'Deleted': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === listing.status) return;
    try {
      await updateListingStatusById(listing.listingId, newStatus);
      toast.success('Status updated successfully');
      setListing({ ...listing, status: newStatus });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListingById(listing.listingId);
      toast.success('Listing deleted');
      navigate('/admin/listings');
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-listing-page">
          <div className="admin-loading">Loading listing details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!listing) {
    return (
      <AdminLayout>
        <div className="admin-listing-page">
          <div className="admin-empty-state"><p>Listing not found</p></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-listing-page">
        {/* Header */}
        <div className="admin-page-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/listings')}
              style={{padding: '6px 10px'}}>
              <ArrowLeft size={18} />
            </button>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button className="admin-btn admin-btn-secondary" onClick={() => setNotifyModalOpen(true)}>
              <Bell size={16} /> Notify Seller
            </button>
            <button className="admin-btn admin-btn-secondary" style={{color: '#ef4444'}}
              onClick={() => setDeleteConfirm(true)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', marginTop: '20px'}}>
          {/* Left: Image */}
          <div className="admin-card" style={{padding: '16px'}}>
            <img
              src={listing.primaryImageUrl}
              alt={listing.title}
              style={{width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '350px'}}
              onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
            />
            {listing.imageUrls && listing.imageUrls.length > 0 && (
              <div style={{display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap'}}>
                {listing.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`img-${i}`}
                    style={{width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer'}}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="admin-card" style={{padding: '20px'}}>
            <h3 style={{marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600}}>Listing Information</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'}}>
              <InfoRow label="Listing ID" value={`#${listing.listingId}`} />
              <InfoRow label="Title" value={listing.title} />
              <InfoRow label="Price" value={formatPrice(listing.price)} />
              <InfoRow label="Category" value={`${listing.categoryName || '-'} > ${listing.subCategoryName || '-'}`} />
              <InfoRow label="Seller" value={`${listing.sellerName || '-'} (${listing.sellerEmail || '-'})`} />
              <InfoRow label="Condition" value={listing.condition === 'used' ? 'Used' : 'New'} />
              <InfoRow label="Created" value={formatDate(listing.createdAt)} />
              <InfoRow label="Updated" value={formatDate(listing.updatedAt)} />

              {/* Status with inline edit */} 
              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px'}}>
                  <span style={{fontWeight: 500, color: '#64748b', minWidth: '80px'}}>Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="admin-input"
                    style={{padding: '6px 10px', fontSize: '0.875rem', width: 'auto', minWidth: '160px'}}
                  >
                    <option value="Draft">Draft</option>
                    <option value="PendingReview">Pending Review</option>
                    <option value="Active">Active</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Deleted">Deleted</option>
                  </select>
                  {newStatus !== listing.status && (
                    <>
                      <button className="admin-btn admin-btn-primary"
                        style={{padding: '6px 14px', fontSize: '0.8rem'}}
                        onClick={handleStatusUpdate}>
                        <Check size={14} /> Save
                      </button>
                      <button className="admin-btn admin-btn-secondary"
                        style={{padding: '6px 14px', fontSize: '0.8rem'}}
                        onClick={() => setNewStatus(listing.status)}>
                        <X size={14} /> Cancel
                      </button>
                    </>
                  )}
                  <span className={`admin-badge ${getStatusBadgeClass(listing.status)}`}>
                    Current: {listing.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
              <h4 style={{fontWeight: 600, marginBottom: '8px'}}>Description</h4>
              <p style={{color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap'}}>
                {listing.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />

      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={listing.userId}
        userName={listing.sellerName || 'Seller'}
        defaultTitle={`Listing: ${listing.title}`}
        defaultMessage={`Regarding your listing "${listing.title}"`}
        defaultType="listing"
      />
    </AdminLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '2px'}}>{label}</span>
      <span style={{fontSize: '0.9rem', color: '#1e293b'}}>{value}</span>
    </div>
  );
}
