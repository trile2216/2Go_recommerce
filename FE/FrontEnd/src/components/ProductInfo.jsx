import { useCart } from '../context/CartContext';
import { useDispatch, useSelector } from 'react-redux';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import { useToast } from '../context/ToastContext';

export default function ProductInfo({ product, listingId, primaryImageUrl, rawPrice }) {
  const { addToCart, isInCart } = useCart();
  const dispatch = useDispatch();
  const toast = useToast();
  const compareItems = useSelector(state => state.compare.items);
  const addedToCart = listingId ? isInCart(listingId) : false;
  const isInCompare = listingId ? compareItems.some(item => item.id === listingId) : false;

  const handleAddToCart = async () => {
    if (!listingId || addedToCart) return;
    const result = await addToCart(listingId);
    if (result.success) {
      toast.success('Đã thêm vào giỏ hàng');
    } else {
      toast.error(typeof result.message === 'string' ? result.message : 'Thêm vào giỏ hàng thất bại');
    }
  };

  const handleCompare = () => {
    if (!listingId) return;
    if (isInCompare) {
      dispatch(removeFromCompare(listingId));
      toast.info('Đã xóa khỏi so sánh');
    } else {
      if (compareItems.length >= 5) {
        toast.warning('Bạn chỉ có thể so sánh tối đa 5 sản phẩm');
        return;
      }
      dispatch(addToCompare({
        id: listingId,
        title: product.title,
        price: rawPrice,
        image: primaryImageUrl,
        condition: product.condition,
        brand: product.brand,
      }));
      toast.success('Đã thêm vào so sánh');
    }
  };

  return (
    <div className="product-info-detail">
      <h1 className="product-title-detail">{product.title}</h1>
      
      <div className="product-rating">
        <div className="stars">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`pd-star ${i < 5 ? 'filled' : ''}`}>★</span>
          ))}
        </div>
        <span className="rating-count">(12 đánh giá)</span>
      </div>

      <div className="price-section">
        <div className="price-main">{product.price}</div>
      </div>

      <div className="product-details">
        {product.brand && (
          <div className="detail-row">
            <span className="detail-label">🏷️ Hãng:</span>
            <span className="detail-value">{product.brand}</span>
          </div>
        )}
        {product.condition && (
          <div className="detail-row">
            <span className="detail-label">✨ Tình trạng:</span>
            <span className="detail-value">{product.condition === "USED" ? 'Đã sử dụng' : 'Mới'}</span>
          </div>
        )}
        {product.seller && (
          <div className="detail-row">
            <span className="detail-label">📞 Số điện thoại:</span>
            <span className="detail-value">{product.seller}</span>
          </div>
        )}
        {product.location && (
          <div className="detail-row">
            <span className="detail-label">✉️ Email:</span>
            <span className="detail-value">{product.location}</span>
          </div>
        )}
      </div>

      <div className="product-actions-detail">
        <button className={`btn-add-cart ${addedToCart ? 'added' : ''}`} onClick={handleAddToCart}>
          🛒 {addedToCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
        </button>
        <button className={`btn-compare ${isInCompare ? 'added' : ''}`} onClick={handleCompare}>
          ⚖️ {isInCompare ? 'Đã thêm so sánh' : 'So sánh sản phẩm'}
        </button>
      </div>

      <div className="seller-section">
        <div className="seller-card">
          <div className="seller-avatar">
            <img src="" alt="Seller Avatar" />
          </div>
          <div className="seller-info">
            <div className="seller-name">Người bán</div>
            <div className="seller-rating">⭐ 4.8 (328 đánh giá)</div>
          </div>
          <button className="btn-contact">Liên hệ</button>
        </div>
      </div>
    </div>
  );
}
