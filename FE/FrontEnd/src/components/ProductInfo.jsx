import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDispatch, useSelector } from 'react-redux';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import { useToast } from '../context/ToastContext';
import { getSavedStatus, saveListing, removeSavedListing } from '../service/home/api.savedListing';
import { createOrGetChat } from '../service/home/api.chat';
import { getRatingsForUser as getSellerRating } from '../service/home/api.rating';

export default function ProductInfo({ product, listingId, primaryImageUrl, rawPrice }) {
  const { addToCart, isInCart } = useCart();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const compareItems = useSelector(state => state.compare.items);
  const addedToCart = listingId ? isInCart(listingId) : false;
  const isInCompare = listingId ? compareItems.some(item => item.id === listingId) : false;

  const [isSaved, setIsSaved] = useState(false);
  const [savingListing, setSavingListing] = useState(false);
  const [sellerRating, setSellerRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    if (!listingId) return;
    const checkSavedStatus = async () => {
      try {
        const res = await getSavedStatus(listingId);
        setIsSaved(res.isSaved);
      } catch {
        setIsSaved(false);
      }
    };
    checkSavedStatus();
  }, [listingId]);

  useEffect(() => {
    if (!product?.sellerId) return;
    const fetchSellerRating = async () => {
      try {
        const data = await getSellerRating(product.sellerId, 0, 1);
        setSellerRating({ avg: data.avgRating || 0, count: data.total });
      } catch (error) {
        console.error("Failed to fetch seller rating:", error);
      }
    };
    fetchSellerRating();
  }, [product?.sellerId]);

  const handleAddToCart = async () => {
    if (!listingId || addedToCart) return;
    
    // Pass full product object for optimistic update
    const result = await addToCart({
      listingId,
      title: product.title,
      price: rawPrice || product.price,
      primaryImageUrl,
      priceSnapshot: rawPrice || product.price,
      sellerName: product.sellerName,
      ...product
    });

    if (result.success) {
      toast.success('Đã thêm vào giỏ hàng');
    } else {
      toast.error(typeof result.message === 'string' ? result.message : 'Thêm vào giỏ hàng thất bại');
    }
  };

  const handleBuyNow = () => {
    if (!listingId) return;
    navigate('/checkout', {
      state: {
        item: {
          listingId,
          title: product.title,
          priceSnapshot: rawPrice,
          primaryImageUrl,
          quantity: 1,
        },
      },
    });
  };

  const handleToggleSave = async () => {
    if (!listingId || savingListing) return;
    setSavingListing(true);
    try {
      if (isSaved) {
        await removeSavedListing(listingId);
        setIsSaved(false);
        toast.info('Đã bỏ lưu bài đăng');
      } else {
        await saveListing(listingId);
        setIsSaved(true);
        toast.success('Đã lưu bài đăng');
      }
    } catch (err) {
      toast.error('Thao tác thất bại, vui lòng thử lại');
    } finally {
      setSavingListing(false);
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

  const handleChatWithSeller = async () => {
    if (!product.sellerId) {
      toast.error('Không tìm thấy thông tin người bán.');
      return;
    }
    try {
      const chat = await createOrGetChat(product.sellerId);
      if (chat && chat.chatId) {
        navigate(`/chat/${chat.chatId}`);
      } else {
        toast.error('Không thể tạo cuộc trò chuyện với người bán.');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Đã xảy ra lỗi khi tạo cuộc trò chuyện.');
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
        {product.sellerPhone && (
          <div className="detail-row">
            <span className="detail-label">📞 Số điện thoại:</span>
            <span className="detail-value">{product.sellerPhone}</span>
          </div>
        )}
        {product.sellerEmail && (
          <div className="detail-row">
            <span className="detail-label">✉️ Email:</span>
            <span className="detail-value">{product.sellerEmail}</span>
          </div>
        )}
      </div>

      <div className="product-actions-detail">
        <button className="btn-buy-now" onClick={handleBuyNow}>
          ⚡ Mua ngay
        </button>
        <button className={`btn-add-cart ${addedToCart ? 'added' : ''}`} onClick={handleAddToCart}>
          🛒 {addedToCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
        </button>
      </div>

      <div className="product-actions-secondary">
        <button className={`btn-save-listing ${isSaved ? 'saved' : ''}`} onClick={handleToggleSave} disabled={savingListing}>
          {isSaved ? '❤️ Đã lưu' : '🤍 Lưu tin'}
        </button>
        <button className={`btn-compare ${isInCompare ? 'added' : ''}`} onClick={handleCompare}>
          ⚖️ {isInCompare ? 'Đã thêm so sánh' : 'So sánh sản phẩm'}
        </button>
      </div>

      <div className="seller-section">
        <div className="seller-card">
          <div className="seller-avatar">
            <img 
              src={product.sellerAvatar} 
              alt={product.sellerName} 
            />
          </div>
          <div className="seller-info">
            <div className="seller-name">{product.sellerName || 'Người bán'}</div>
            <div className="seller-rating">⭐ {sellerRating.avg > 0 ? sellerRating.avg.toFixed(1) : "N/A"} ({sellerRating.count} đánh giá)</div>
          </div>
          <button className="btn-contact" onClick={handleChatWithSeller}>Chat với người bán</button>
        </div>
      </div>
    </div>
  );
}
