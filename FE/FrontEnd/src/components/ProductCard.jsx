export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        {product.image ? (
          <img src={product.image} alt={product.title} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>{product.title}</span>
          </div>
        )}
        <div className="product-actions">
          <button className={`action-btn ${product.liked ? 'liked' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12.6663 9.33333C13.6597 8.36 14.6663 7.19333 14.6663 5.66667C14.6663 4.69421 14.28 3.76158 13.5924 3.07394C12.9048 2.38631 11.9721 2 10.9997 2C9.82634 2 8.99967 2.33333 7.99967 3.33333C6.99967 2.33333 6.17301 2 4.99967 2C4.02721 2 3.09458 2.38631 2.40695 3.07394C1.71932 3.76158 1.33301 4.69421 1.33301 5.66667C1.33301 7.2 2.33301 8.36667 3.33301 9.33333L7.99967 14L12.6663 9.33333Z" stroke={product.liked ? "white" : "#1E293B"} fill={product.liked ? "white" : "none"} strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="action-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.99967 8.66659C8.36786 8.66659 8.66634 8.36811 8.66634 7.99992C8.66634 7.63173 8.36786 7.33325 7.99967 7.33325C7.63148 7.33325 7.33301 7.63173 7.33301 7.99992C7.33301 8.36811 7.63148 8.66659 7.99967 8.66659Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.99967 4.00008C8.36786 4.00008 8.66634 3.7016 8.66634 3.33341C8.66634 2.96522 8.36786 2.66675 7.99967 2.66675C7.63148 2.66675 7.33301 2.96522 7.33301 3.33341C7.33301 3.7016 7.63148 4.00008 7.99967 4.00008Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.99967 13.3333C8.36786 13.3333 8.66634 13.0349 8.66634 12.6667C8.66634 12.2985 8.36786 12 7.99967 12C7.63148 12 7.33301 12.2985 7.33301 12.6667C7.33301 13.0349 7.63148 13.3333 7.99967 13.3333Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        {product.price && (
          <div className="product-pricing">
            <div className="product-price">{product.price}</div>
            {product.condition && (
              <div className="product-condition">{product.condition}</div>
            )}
          </div>
        )}
        
        <div className="product-meta">
          <div className="meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10 5C10 7.4965 7.2305 10.0965 6.3005 10.8995C6.21386 10.9646 6.1084 10.9999 6 10.9999C5.8916 10.9999 5.78614 10.9646 5.6995 10.8995C4.7695 10.0965 2 7.4965 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{product.location}</span>
          </div>
          <div className="meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 3V6L8 7" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{product.time}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
