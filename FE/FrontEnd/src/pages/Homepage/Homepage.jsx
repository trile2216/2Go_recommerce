import { useState, useEffect } from 'react';
import './Homepage.css';
import Header from '../../components/Header';
import HeroBanner from '../../components/HeroBanner';
import ProductGrid from '../../components/ProductGrid';
import Footer from '../../components/Footer';
import { fetchProducts } from '../../service/api.product';

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data.items);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  return (
    <div className="homepage">
      <Header />
      <HeroBanner />
      {loading && <p>Đang tải sản phẩm...</p>}
      {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
      {!loading && <ProductGrid products={products} />}
      <Footer />
    </div>
  );
}
