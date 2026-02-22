import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/utils';
import { ImageOff } from 'lucide-react';


/**
 * Card hiển thị bài đăng - dùng chung cho SellerListings & SavedListings
 * @param {Object} props
 * @param {Object} props.listing - { listingId, title, price, primaryImageUrl, ... }
 * @param {React.ReactNode} [props.badge] - Badge trạng thái (tuỳ chọn)
 * @param {React.ReactNode} [props.meta] - Thông tin phụ dưới giá (tuỳ chọn)
 * @param {React.ReactNode} [props.actions] - Nút hành động (tuỳ chọn)
 * @param {function} [props.onClick] - Click handler (mặc định navigate tới /product/:id)
 */
export default function ListingCard({ listing, badge, meta, actions, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(listing);
    } else {
      navigate(`/listings/${listing.listingId}`);
    }
  };

  return (
    <div className="listing-card" onClick={handleClick}>
      <div className="listing-card-image-wrapper">
        {listing.primaryImageUrl ? (
          <img
            src={listing.primaryImageUrl}
            alt={listing.title || 'Bài đăng'}
            className="listing-card-image"
          />
        ) : (
          <div className="listing-card-image listing-card-no-image">
            <ImageOff size={32} />
          </div>
        )}
        {badge && <div className="listing-card-badge">{badge}</div>}
      </div>
      <div className="listing-card-body">
        <h3 className="listing-card-title">{listing.title || 'Chưa có tiêu đề'}</h3>
        <p className="listing-card-price">
          {listing.price ? formatPrice(listing.price) : 'Liên hệ'}
        </p>
        {meta && <div className="listing-card-meta">{meta}</div>}
      </div>
      {actions && (
        <div className="listing-card-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
