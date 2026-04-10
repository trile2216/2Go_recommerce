import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { X, Phone } from 'lucide-react';
import { removeFromCompare, clearCompare } from '../../store/slices/compareSlice';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './Compare.css';
import { useTitle } from '../../hooks/useTitle';
import { fetchProductById } from '../../service/home/api.product';

const Compare = () => {
  useTitle('So sánh sản phẩm');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const productItems = useSelector(state => state.compare.items);
  const [detailedProducts, setDetailedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const comparisonItems = [
    { label: 'Giá', key: 'price', format: (value) => formatPrice(value) },
    { label: 'Danh mục', key: 'categoryName' },
    { label: 'Danh mục phụ', key: 'subCategoryName' },
    { label: 'Mô tả', key: 'description' },
  ];

  const handleRemoveProduct = (productId) => {
    dispatch(removeFromCompare(productId));
  };

  const handleClearAll = () => {
    dispatch(clearCompare());
    navigate('/');
  };

  const productIdsString = productItems.map(p => p.id).join(',');

  useEffect(() => {
    const loadProductDetails = async () => {
      if (productItems.length === 0) {
        setDetailedProducts([]);
        return;
      }

      setLoading(true);
      try {
        const details = await Promise.all(
          productItems.map(item => fetchProductById(item.id))
        );
        // The API returns listingId, we map it to id as well for consistency
        const mappedDetails = details.filter(Boolean).map(d => ({...d, id: d.listingId || d.id}));
        setDetailedProducts(mappedDetails);
      } catch (error) {
        console.error("Error fetching comparison details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProductDetails();
  }, [productIdsString]);

  if (productItems.length === 0) {
    return (
      <div className="compare-page">
        <Header />
        <main className="compare-container">
          <div className="compare-wrapper">
            <div className="compare-empty">
              <h2>Chưa có sản phẩm nào để so sánh</h2>
              <p>Hãy thêm sản phẩm từ trang chủ để bắt đầu so sánh</p>
              <button className="btn-add-product" onClick={() => navigate('/')}>
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="compare-page">
      <Header />
      
      <main className="compare-container">
        <div className="compare-wrapper">
          {/* Product Cards */}
          <div className="compare-cards">
            {loading ? (
              <div className="compare-loading">Đang tải thông tin chi tiết...</div>
            ) : (
             detailedProducts.map((product) => (
              <div key={product.id} className="compare-product-card">
                <div className="compare-product-image-wrapper">
                  {product.primaryImageUrl ? (
                    <img src={product.primaryImageUrl} alt={product.title} className="compare-product-image" />
                  ) : (
                    <div className="compare-image-placeholder">{product.title}</div>
                  )}
                  <button 
                    className="compare-remove-btn"
                    onClick={() => handleRemoveProduct(product.id)}
                    title="Xóa khỏi so sánh"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="compare-product-info">
                  <h3 className="compare-product-name">{product.title}</h3>
                  
                  <div className="compare-product-price">
                    {formatPrice(product.price)}
                  </div>

                  {product.categoryName && (
                    <span className="compare-product-category">{product.categoryName}</span>
                  )}

                  <div className="compare-product-actions">
                    <button 
                      className="cmp-btn-secondary"
                      onClick={() => navigate(`/listings/${product.id}`)}
                    >
                      Xem chi tiết
                    </button>
                    <button 
                      className="cmp-btn-primary"
                      onClick={() => navigate(`/chat`)}
                    >
                      <Phone size={16} />
                      Liên hệ
                    </button>
                  </div>
                </div>
              </div>
             ))
            )}
          </div>

          {/* Comparison Table */}
          <div className="comparison-table">
            <h2 className="table-title">Bảng so sánh chi tiết</h2>
            
            <table className="spec-table">
              <tbody>
                {comparisonItems.map((item) => (
                  <tr key={item.key} className="spec-row">
                    <td className="spec-label">{item.label}</td>
                    {loading ? (
                       <td colSpan={productItems.length} className="spec-value" style={{textAlign: 'center'}}>Đang tải...</td>
                    ) : (
                      detailedProducts.map((product) => (
                        <td key={`${product.id}-${item.key}`} className="spec-value">
                          {item.format 
                            ? item.format(product[item.key]) 
                            : (product[item.key] || '—')}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="compare-footer">
            <button 
              className="btn-add-product"
              onClick={() => navigate('/')}
            >
              + Thêm sản phẩm để so sánh
            </button>
            <button className="cmp-btn-clear" onClick={handleClearAll}>
              Xóa tất cả
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
