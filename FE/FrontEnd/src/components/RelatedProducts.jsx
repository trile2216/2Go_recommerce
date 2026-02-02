export default function RelatedProducts({ products }) {
  return (
    <section className="related-products-section">
      <h2 className="section-heading">Tin đăng tương tự</h2>
      
      <div className="related-products-grid">
        {products.map((product) => (
          <div key={product.id} className="related-product-card">
            <div className="related-image-wrapper">
              <img src={product.image} alt={product.title} className="related-image" />
              <button className="like-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15.8333 11.6667C16.8267 10.6927 17.8333 9.49668 17.8333 7.83333C17.8333 6.72917 17.3334 5.70208 16.4905 4.85913C15.6476 4.01618 14.6205 3.51667 13.5163 3.51667C12.1576 3.51667 11.2496 3.91667 9.99958 5.16667C8.74958 3.91667 7.84167 3.51667 6.48292 3.51667C5.37875 3.51667 4.35167 4.01618 3.50871 4.85913C2.66575 5.70208 2.16625 6.72917 2.16625 7.83333C2.16625 9.50042 3.16625 10.6971 4.16625 11.6667L9.99958 17.5L15.8333 11.6667Z" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="related-product-info">
              <h4 className="related-title">{product.title}</h4>
              <div className="related-price">{product.price}</div>
              <div className="related-meta">
                <span className="meta-badge">📍 {product.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
