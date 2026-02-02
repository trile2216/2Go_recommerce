import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Scale } from 'lucide-react';
import { addToFavorites, removeFromFavorites } from '../store/slices/favoritesSlice';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get favorites and compare items from Redux
  const favorites = useSelector(state => state.favorites.items);
  const compareItems = useSelector(state => state.compare.items);
  
  const isFavorited = favorites.some(item => item.id === product.listingId);
  const isInCompare = compareItems.some(item => item.id === product.listingId);

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleProductClick = () => {
    navigate(`/product/${product.listingId}`);
  };

  const handleAddToFavorites = (e) => {
    e.stopPropagation();
    if (isFavorited) {
      dispatch(removeFromFavorites(product.listingId));
    } else {
      dispatch(addToFavorites({
        id: product.listingId,
        title: product.title,
        price: product.price,
        image: product.primaryImageUrl,
        ...product
      }));
    }
  };

  const handleAddToCompare = (e) => {
    e.stopPropagation();
    if (isInCompare) {
      dispatch(removeFromCompare(product.listingId));
    } else {
      const canAdd = compareItems.length < 5;
      if (canAdd) {
        dispatch(addToCompare({
          id: product.listingId,
          name: product.title,
          price: product.price,
          image: product.primaryImageUrl,
          ...product
        }));
      } else {
        alert('Bạn chỉ có thể so sánh tối đa 5 sản phẩm');
      }
    }
  };

  return (
    <article className="product-card" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
      <div className="product-image-wrapper">
        {product.primaryImageUrl ? (
          <img src={product.primaryImageUrl} alt={product.title} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>{product.title}</span>
          </div>
        )}
        <div className="product-actions">
          <button 
            className={`action-btn ${isFavorited ? 'active' : ''}`}
            onClick={handleAddToFavorites}
            title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart size={16} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : '#1e293b'} />
          </button>
          <button 
            className={`action-btn ${isInCompare ? 'active' : ''}`}
            onClick={handleAddToCompare}
            title={isInCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
          >
            <Scale size={16} color={isInCompare ? '#3b82f6' : '#1e293b'} />
          </button>
        </div>
        {product.status === 'Active' && (
          <span className="product-badge">{product.subCategoryName}</span>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        {product.price && (
          <div className="product-pricing">
            <div className="product-price">{formatPrice(product.price)}</div>
            {product.categoryName && (
              <div className="product-condition">{product.categoryName}</div>
            )}
          </div>
        )}
        
        <div className="product-meta">
          <div className="meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10 5C10 7.4965 7.2305 10.0965 6.3005 10.8995C6.21386 10.9646 6.1084 10.9999 6 10.9999C5.8916 10.9999 5.78614 10.9646 5.6995 10.8995C4.7695 10.0965 2 7.4965 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{product.status}</span>
          </div>
          <div className="meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 3V6L8 7" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{formatDate(product.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
