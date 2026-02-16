import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import { getMyListingById, deleteListing, publishListing, archiveListing } from '../../service/home/api.sellerListing';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatPrice } from '../../utils/utils';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Send, 
  Archive, 
  MapPin, 
  Clock, 
  Tag, 
  Info,
  Loader2
} from 'lucide-react';
import { Image, Button, Modal, Tag as AntTag, Descriptions, Card, Divider, Spin } from 'antd';
import './SellerListingDetail.css';

const STATUS_COLORS = {
  Draft: 'default',
  PendingReview: 'warning',
  Active: 'success',
  Archived: 'default',
  Rejected: 'error',
  Deleted: 'error'
};

const STATUS_LABELS = {
  Draft: 'Nháp',
  PendingReview: 'Chờ duyệt',
  Active: 'Đang bán',
  Archived: 'Đã ẩn',
  Rejected: 'Bị từ chối',
  Deleted: 'Đã xóa'
};

export default function SellerListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchListingDetail();
  }, [id]);

  const fetchListingDetail = async () => {
    try {
      setLoading(true);
      const data = await getMyListingById(id);
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing detail:', error);
      toast.error('Không thể tải thông tin bài đăng');
      navigate('/seller/listings');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
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
      fetchListingDetail();
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
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await archiveListing(id);
      toast.success('Đã ẩn bài đăng');
      fetchListingDetail();
    } catch (err) {
      toast.error(err.response?.data || 'Ẩn bài đăng thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Xóa bài đăng?',
      content: 'Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteListing(id);
          toast.success('Đã xóa bài đăng');
          navigate('/seller/listings');
        } catch (err) {
          toast.error(err.response?.data || 'Xóa bài đăng thất bại');
        }
      }
    });
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="sld-loading">
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      </UserLayout>
    );
  }

  if (!listing) return null;

  return (
    <UserLayout>
      <div className="sld-container">
        {/* Header Navigation */}
        <div className="sld-nav">
          <Button 
            type="text" 
            icon={<ArrowLeft size={20} />} 
            onClick={() => navigate('/seller/listings')}
            className="sld-back-btn"
          >
            Quay lại danh sách
          </Button>
        </div>

        {/* Status Bar */}
        <div className="sld-status-bar">
          <div className="sld-status-info">
            <span className="sld-id">#{listing.listingId}</span>
            <AntTag color={STATUS_COLORS[listing.status] || 'default'} className="sld-status-tag">
              {STATUS_LABELS[listing.status] || listing.status}
            </AntTag>
            <span className="sld-date">
              <Clock size={14} /> Cập nhật: {formatDate(listing.updatedAt || listing.createdAt)}
            </span>
          </div>
          
          <div className="sld-actions">
            {(listing.status === 'Draft' || listing.status === 'Rejected') && (
              <>
                <Button 
                  icon={<Edit size={16} />} 
                  onClick={() => navigate(`/post/listing?edit=${listing.listingId}`)}
                >
                  Chỉnh sửa
                </Button>
                <Button 
                  type="primary"
                  icon={<Send size={16} />} 
                  loading={actionLoading}
                  onClick={handlePublish}
                  style={{ backgroundColor: '#facc15', color: '#000' }}
                >
                  Đăng ngay
                </Button>
              </>
            )}
            
            {listing.status === 'Active' && (
              <Button 
                icon={<Archive size={16} />} 
                loading={actionLoading}
                onClick={handleArchive}
              >
                Ẩn bài đăng
              </Button>
            )}

            {listing.status !== 'Deleted' && (
              <Button 
                danger 
                icon={<Trash2 size={16} />} 
                onClick={handleDelete}
              >
                Xóa
              </Button>
            )}
          </div>
        </div>

        <div className="sld-content-grid">
          {/* Main Info */}
          <div className="sld-main">
            <Card className="sld-card">
              <h1 className="sld-title">{listing.title}</h1>
              <div className="sld-price">
                {listing.price > 0 ?  formatPrice(listing.price) : 'Miễn phí'}
              </div>
              
              <Divider />
              
              <div className="sld-description">
                <h3>Mô tả chi tiết</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>

              <Divider />

              <div className="sld-attributes">
                <h3>Thông tin sản phẩm</h3>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Danh mục">{listing.categoryName} {'>'} {listing.subCategoryName}</Descriptions.Item>
                  <Descriptions.Item label="Tình trạng">{listing.condition === 'new' ? 'Mới' : 'Đã sử dụng'}</Descriptions.Item>
                  <Descriptions.Item label="Thương hiệu">{listing.brand || 'Không có'}</Descriptions.Item>
                  {listing.attributes?.map(attr => (
                    <Descriptions.Item key={attr.name} label={attr.name}>{attr.value}</Descriptions.Item>
                  ))}
                </Descriptions>
              </div>
            </Card>
          </div>

          {/* Sidebar / Media */}
          <div className="sld-sidebar">
            <Card title="Hình ảnh & Video" className="sld-card">
              <div className="sld-media-grid">
                <Image.PreviewGroup>
                  {listing.media?.map((item, index) => (
                    <div key={index} className="sld-media-item">
                      {item.mediaType === 'VIDEO' ? (
                        <video src={item.url} controls className="sld-video" />
                      ) : (
                        <Image src={item.url} className="sld-image" />
                      )}
                      {item.isPrimary && <span className="sld-primary-badge">Ảnh bìa</span>}
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            </Card>
            
            <Card title="Địa điểm" className="sld-card mt-4">
              <div className="sld-location">
                <MapPin size={20} className="text-gray-500" />
                <span>
                 {/*  TODO: Need ward/district info in ListingDetail if not available. 
                      Assuming listing has full address or seller info. 
                      For now showing simplified location if not available in basic fetch 
                  */}
                  {listing.sellerAddress || 'Thông tin địa chỉ đang cập nhật'} 
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
