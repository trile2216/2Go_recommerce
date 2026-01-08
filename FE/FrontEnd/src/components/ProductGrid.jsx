import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
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

      <div className="load-more-wrapper">
        <button className="load-more-btn">Xem thêm</button>
      </div>
    </main>
  );
}
