import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import ListingCard from '../../components/ListingCard';
import PageEmptyState from '../../components/PageEmptyState';
import { useToast } from '../../context/ToastContext';
import {
  getMyListings,
  publishListing,
  archiveListing,
  deleteListing,
} from '../../service/home/api.sellerListing';
import { formatDate } from '../../utils/utils';
import { Store, Plus, Loader2, Eye, Send, Archive, Trash2, Edit } from 'lucide-react';
import './SellerListings.css';

const STATUS_TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'Draft', label: 'Nháp' },
  { key: 'PendingReview', label: 'Chờ duyệt' },
  { key: 'Active', label: 'Đang bán' },
  { key: 'Archived', label: 'Đã ẩn' },
  { key: 'Rejected', label: 'Bị từ chối' },
];

const STATUS_LABEL = {
  Draft: 'Nháp',
  PendingReview: 'Chờ duyệt',
  Active: 'Đang bán',
  Archived: 'Đã ẩn',
  Rejected: 'Bị từ chối',
  Deleted: 'Đã xóa',
};

const STATUS_CLASS = {
  Draft: 'sl-badge-draft',
  PendingReview: 'sl-badge-pending',
  Active: 'sl-badge-active',
  Archived: 'sl-badge-archived',
  Rejected: 'sl-badge-rejected',
  Deleted: 'sl-badge-deleted',
};

const REVIEW_NOTE_KEY = 'listingReviewNotes';

export default function SellerListings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [skip, setSkip] = useState(0);
  const [actionLoading, setActionLoading] = useState(null); // listingId đang xử lý
  const take = 20;

  const getPublishErrorMessage = (error) => {
    const raw =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Đăng bài thất bại';
    if (typeof raw !== 'string') return 'Đăng bài thất bại';

    if (raw.includes('Images did not pass quality checks')) {
      return 'Ảnh chưa đạt chất lượng nên chưa thể đăng. Vui lòng cập nhật ảnh rõ nét hơn rồi thử lại.';
    }
    if (raw.includes('Price must be greater than 0') || raw.includes('Price must be >= 0')) {
      return 'Giá bán không hợp lệ. Vui lòng nhập giá >= 0.';
    }
    return raw;
  };

  const getPublishSuccessMessage = (response) => {
    const raw = response?.message || '';
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase();
      if (lower.includes('review')) {
        return 'Đăng bài thành công! Đang chờ duyệt.';
      }
      if (lower.includes('published')) {
        return 'Đăng bài thành công! Bài đang bán.';
      }
    }
    return 'Đăng bài thành công!';
  };

  const fetchListings = useCallback(async (status, currentSkip = 0) => {
    try {
      setLoading(true);
      const data = await getMyListings({ status: status || undefined, skip: currentSkip, take });
      if (currentSkip === 0) {
        setListings(data.items || []);
      } else {
        setListings(prev => [...prev, ...(data.items || [])]);
      }
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching seller listings:', err);
      toast.error('Không thể tải danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  }, [toast, take]);

  useEffect(() => {
    setListings([]); // Clear previous data to show loading state
    setSkip(0);
    fetchListings(activeTab, 0);
  }, [activeTab, fetchListings]);

  const handleLoadMore = () => {
    const newSkip = skip + take;
    setSkip(newSkip);
    fetchListings(activeTab, newSkip);
  };

  const handlePublish = async (id) => {
    setActionLoading(id);
    try {
      const res = await publishListing(id);
      toast.success(getPublishSuccessMessage(res));
      try {
        const stored = JSON.parse(localStorage.getItem('listingDraftNotes') || '{}');
        if (stored[String(id)]) {
          delete stored[String(id)];
          localStorage.setItem('listingDraftNotes', JSON.stringify(stored));
        }
      } catch {
        // ignore
      }
      fetchListings(activeTab, 0);
      setSkip(0);
    } catch (err) {
      const msg = getPublishErrorMessage(err);
      toast.error(msg);
      try {
        const stored = JSON.parse(localStorage.getItem('listingDraftNotes') || '{}');
        stored[String(id)] = { message: msg, updatedAt: new Date().toISOString() };
        localStorage.setItem('listingDraftNotes', JSON.stringify(stored));
      } catch {
        // ignore
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id) => {
    setActionLoading(id);
    try {
      await archiveListing(id);
      toast.success('Đã ẩn bài đăng');
      fetchListings(activeTab, 0);
      setSkip(0);
    } catch (err) {
      toast.error(err.response?.data || 'Ẩn bài đăng thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài đăng này?')) return;
    setActionLoading(id);
    try {
      await deleteListing(id);
      toast.success('Đã xóa bài đăng');
      fetchListings(activeTab, 0);
      setSkip(0);
    } catch (err) {
      toast.error(err.response?.data || 'Xóa bài đăng thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const getDraftNote = (listingId) => {
    if (!listingId) return null;
    try {
      const stored = JSON.parse(localStorage.getItem('listingDraftNotes') || '{}');
      return stored[String(listingId)]?.message || null;
    } catch {
      return null;
    }
  };

  const renderBadge = (status, listingId) => {
    const draftNote = status === 'Draft' ? getDraftNote(listingId) : null;
    const shortDraftNote = draftNote?.includes('Ảnh chưa đạt chất lượng')
      ? 'Cần cập nhật ảnh'
      : draftNote
        ? 'Cần cập nhật'
        : null;
    let note = null;
    if (status === 'PendingReview') {
      try {
        const stored = JSON.parse(localStorage.getItem(REVIEW_NOTE_KEY) || '{}');
        note = stored[String(listingId)]?.note || null;
      } catch {
        note = null;
      }
    }

    const label = STATUS_LABEL[status] || status;
    const title = draftNote || note || undefined;
    return (
      <span
        className={`sl-badge ${STATUS_CLASS[status] || ''}`}
        title={title}
      >
        {shortDraftNote ? `${label} • ${shortDraftNote}` : label}
      </span>
    );
  };

  const renderActions = (item) => {
    const isProcessing = actionLoading === item.listingId;
    const status = item.status;
    return (
      <>
        {(status === 'Draft' || status === 'Rejected') && (
          <>
            <button
              className="sl-action-btn sl-btn-edit"
              title="Chỉnh sửa"
              onClick={() => navigate(`/post/listing?edit=${item.listingId}`)}
              disabled={isProcessing}
            >
              <Edit size={15} />
            </button>
            <button
              className="sl-action-btn sl-btn-publish"
              title="Đăng bài"
              onClick={() => handlePublish(item.listingId)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            </button>
          </>
        )}
        {status === 'Active' && (
          <>
          <button
            className="sl-action-btn sl-btn-archive"
            title="Ẩn bài đăng"
            onClick={() => handleArchive(item.listingId)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 size={15} className="spin" /> : <Archive size={15} />}
          </button>
          
          <button
            className="sl-action-btn sl-btn-view"
            title="Xem chi tiết"
            onClick={() => navigate(`/seller/listings/${item.listingId}`)}
          >
            <Eye size={15} />
          </button>
          </>
        )}
        {(status === 'Draft' || status === 'PendingReview') && (
          <button
            className="sl-action-btn sl-btn-view"
            title="Xem chi tiết"
            onClick={() => navigate(`/seller/listings/${item.listingId}`)}
          >
            <Eye size={15} />
          </button>
        )}
        {status !== 'Deleted' && (
          <button
            className="sl-action-btn sl-btn-delete"
            title="Xóa"
            onClick={() => handleDelete(item.listingId)}
            disabled={isProcessing}
          >
            <Trash2 size={15} />
          </button>
        )}        
        
      </>
    );
  };

  return (
    <UserLayout>
      <div className="sl-container">
        {/* Header */}
        <div className="sl-header">
          <div>
            <h1 className="sl-title">Bài đăng của tôi</h1>
            <p className="sl-subtitle">Quản lý các bài đăng bán hàng của bạn</p>
          </div>
          <button className="sl-create-btn" onClick={() => navigate('/post/listing')}>
            <Plus size={18} />
            Đăng tin mới
          </button>
        </div>

        {/* Tabs */}
        <div className="sl-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              className={`sl-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && listings.length === 0 ? (
          <div className="loading-state">
            <div className="loader"></div>
            <div className="loading-state-text">Đang tải bài đăng...</div>
          </div>
        ) : listings.length === 0 ? (
          <PageEmptyState
            icon={<Store size={56} />}
            title="Chưa có bài đăng nào"
            description="Bắt đầu bán hàng bằng cách tạo bài đăng đầu tiên"
            actionLabel="Đăng tin ngay"
            actionTo="/post/listing"
          />
        ) : (
          <>
            <div className="sl-count">
              Hiển thị {listings.length} / {total} bài đăng
            </div>
            <div className="sl-list">
              {listings.map(item => (
                <ListingCard
                  key={item.listingId}
                  listing={item}
                  badge={renderBadge(item.status, item.listingId)}
                  meta={
                    <>
                      <span>Ngày tạo: {formatDate(item.createdAt)}</span>
                      {item.updatedAt && <span>• Cập nhật: {formatDate(item.updatedAt)}</span>}
                    </>
                  }
                  actions={renderActions(item)}
                  onClick={() => navigate(`/seller/listings/${item.listingId}`)}
                />
              ))}
            </div>

            {listings.length < total && (
              <div className="sl-load-more">
                <button
                  className="sl-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={16} className="spin" /> Đang tải...</>
                  ) : (
                    'Xem thêm'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
