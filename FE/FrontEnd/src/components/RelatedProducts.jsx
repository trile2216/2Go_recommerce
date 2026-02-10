import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Scale, ShoppingCart } from 'lucide-react';
import { addToFavorites, removeFromFavorites } from '../store/slices/favoritesSlice';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function RelatedProducts({ products }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToCart, isInCart } = useCart();
  const toast = useToast();

  const favorites = useSelector(state => state.favorites.items);
  const compareItems = useSelector(state => state.compare.items);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleFavorite = (e, product) => {
    e.stopPropagation();
    const isFav = favorites.some(item => item.id === product.listingId);
    if (isFav) {
      dispatch(removeFromFavorites(product.listingId));
      toast.info('Đã xóa khỏi yêu thích');
    } else {
      dispatch(addToFavorites({
        id: product.listingId,
        title: product.title,
        price: product.price,
        image: product.primaryImageUrl,
        ...product
      }));
      toast.success('Đã thêm vào yêu thích');
    }
  };

  const handleCompare = (e, product) => {
    e.stopPropagation();
    const inCompare = compareItems.some(item => item.id === product.listingId);
    if (inCompare) {
      dispatch(removeFromCompare(product.listingId));
      toast.info('Đã xóa khỏi so sánh');
    } else if (compareItems.length < 5) {
      dispatch(addToCompare({
        id: product.listingId,
        title: product.title,
        price: product.price,
        image: product.primaryImageUrl,
        ...product
      }));
      toast.success('Đã thêm vào so sánh');
    } else {
      toast.warning('Bạn chỉ có thể so sánh tối đa 5 sản phẩm');
    }
  };

  const handleCart = async (e, product) => {
    e.stopPropagation();
    if (isInCart(product.listingId)) return;
    const result = await addToCart(product.listingId);
    if (result.success) {
      toast.success('Đã thêm vào giỏ hàng');
    } else {
      toast.error(typeof result.message === 'string' ? result.message : 'Thêm vào giỏ hàng thất bại');
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="related-products-section">
      <h2 className="section-heading">Tin đăng tương tự</h2>
      
      <div className="related-products-grid">
        {products.map((product) => {
          const isFav = favorites.some(item => item.id === product.listingId);
          const inCompare = compareItems.some(item => item.id === product.listingId);
          const inCart = isInCart(product.listingId);

          return (
            <div 
              key={product.listingId} 
              className="related-product-card"
              onClick={() => navigate(`/product/${product.listingId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="related-image-wrapper">
                <img 
                  src={product.primaryImageUrl} 
                  alt={product.title} 
                  className="related-image" 
                />
                <div className="related-actions">
                  <button 
                    className={`related-action-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => handleFavorite(e, product)}
                    title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Heart size={14} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#1e293b'} />
                  </button>
                  <button 
                    className={`related-action-btn ${inCompare ? 'active' : ''}`}
                    onClick={(e) => handleCompare(e, product)}
                    title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
                  >
                    <Scale size={14} color={inCompare ? '#3b82f6' : '#1e293b'} />
                  </button>
                  <button 
                    className={`related-action-btn ${inCart ? 'active' : ''}`}
                    onClick={(e) => handleCart(e, product)}
                    title={inCart ? 'Đã trong giỏ hàng' : 'Thêm vào giỏ hàng'}
                  >
                    <ShoppingCart size={14} color={inCart ? '#22c55e' : '#1e293b'} />
                  </button>
                </div>
              </div>
              
              <div className="related-product-info">
                <h4 className="related-title">{product.title}</h4>
                <div className="related-price">{formatPrice(product.price)}</div>
                <div className="related-meta">
                  {product.condition && (
                    <span className="meta-badge">{product.condition}</span>
                  )}
                  {product.brand && (
                    <span className="meta-badge">{product.brand}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
