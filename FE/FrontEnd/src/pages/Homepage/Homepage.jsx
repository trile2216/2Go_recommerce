import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import './Homepage.css';
import '../../styles/loader.css';
import Header from '../../components/Header';
import HeroBanner from '../../components/HeroBanner';
import ProductGrid from '../../components/ProductGrid';
import Footer from '../../components/Footer';
import ErrorPage from '../ErrorPage/ErrorPage';
import { fetchProducts } from '../../service/home/api.product';

const PAGE_SIZE = 20;

export default function Homepage() {
  const role = useSelector((state) => state.user.role);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip fetching if user will be redirected
    if (role === 'Admin' || role === 'Manager') return;

    const getProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts({ take: PAGE_SIZE });
        setProducts(data.items);
        setTotalCount(data.totalCount ?? data.items?.length ?? 0);
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
  }, [role]);

  // Redirect Admin/Manager to their dashboard
  if (role === 'Admin') return <Navigate to="/admin" replace />;
  if (role === 'Manager') return <Navigate to="/mod/users" replace />;

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
      {!loading && !error && <ProductGrid products={products} totalCount={totalCount} />}
      <Footer />
    </div>
  );
}
