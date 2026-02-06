export default function ProductInfo({ product }) {
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
            <span className="detail-value">{product.condition}</span>
          </div>
        )}
        {product.status && (
          <div className="detail-row">
            <span className="detail-label">📌 Trạng thái:</span>
            <span className="detail-value">{product.status}</span>
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
        <button className="btn-add-cart">
          🛒 Thêm vào giỏ hàng
        </button>
        <button className="btn-compare">
          ⚖️ So sánh sản phẩm
        </button>
      </div>

      <div className="seller-section">
        <div className="seller-card">
          <div className="seller-avatar">NV</div>
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
