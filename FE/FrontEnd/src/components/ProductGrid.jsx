import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, totalCount = 0 }) {
  const navigate = useNavigate();

  return (
    <main className="main-content">
      <div className="products-grid">
        {products && products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.listingId} product={product} />
          ))
        ) : (
          <p>Không có sản phẩm nào</p>
        )}
      </div>

      {totalCount > products?.length && (
        <div className="load-more-wrapper">
          <button className="hp-load-more-btn" onClick={() => navigate('/listings')}>
            Xem thêm
          </button>
        </div>
      )}
    </main>
  );
}
