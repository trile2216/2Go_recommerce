import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  return (
    <main className="main-content">
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="load-more-wrapper">
        <button className="load-more-btn">Xem thêm</button>
      </div>
    </main>
  );
}
