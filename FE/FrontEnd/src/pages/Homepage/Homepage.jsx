import { useState, useEffect } from 'react';
import './Homepage.css';
import '../../styles/loader.css';
import Header from '../../components/Header';
import HeroBanner from '../../components/HeroBanner';
import ProductGrid from '../../components/ProductGrid';
import Footer from '../../components/Footer';
import ErrorPage from '../ErrorPage/ErrorPage';
import { fetchProducts } from '../../service/home/api.product';

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
      {loading && (
        <div className="loading-state">
          <div className="loader"></div>
          <div className="loading-state-text">Đang tải sản phẩm...</div>
        </div>
      )}
      {error && <ErrorPage error={error} />}
      {!loading && !error && <ProductGrid products={products} />}
      <Footer />
    </div>
  );
}
