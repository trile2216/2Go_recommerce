import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, X, Phone } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './Compare.css';

const Compare = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productIds = searchParams.get('ids')?.split(',') || [];

  // Mock data - trong thực tế sẽ fetch từ API
  const [products] = useState([
    {
      id: 1,
      name: 'iPhone 13 Pro 128GB',
      price: 12500000,
      image: 'https://via.placeholder.com/200x200?text=iPhone+13+Pro',
      rating: 5,
      reviews: 126,
      brand: 'Apple',
      baseStorage: '128GB',
      processor: 'A15 Bionic',
      ram: '6GB',
      location: 'Phường Linh Xuân, Thủ Đức',
      weight: '203g',
      battery: '3240mAh',
      seller: 'Nguyễn Văn A',
      sellerRating: '4.9'
    },
    {
      id: 2,
      name: 'iPhone 14 Pro Max 256GB',
      price: 15500000,
      image: 'https://via.placeholder.com/200x200?text=iPhone+14+Pro+Max',
      rating: 5,
      reviews: 234,
      brand: 'Apple',
      baseStorage: '256GB',
      processor: 'A16 Bionic',
      ram: '8GB',
      location: 'Phường Tam Phú, Thủ Đức',
      weight: '240g',
      battery: '4323mAh',
      seller: 'Nguyễn Văn B',
      sellerRating: '4.8'
    }
  ]);

  const comparisonItems = [
    {
      label: 'Thương hiệu cơ bản',
      key: 'brand'
    },
    {
      label: 'Giá',
      key: 'price',
      format: (value) => value.toLocaleString('vi-VN') + '₫'
    },
    {
      label: 'Dung lượng',
      key: 'baseStorage'
    },
    {
      label: 'Bộ xử lý',
      key: 'processor'
    },
    {
      label: 'RAM',
      key: 'ram'
    },
    {
      label: 'Vị trí',
      key: 'location'
    },
    {
      label: 'Khối lượng',
      key: 'weight'
    },
    {
      label: 'Pin',
      key: 'battery'
    },
    {
      label: 'Người bán',
      key: 'seller'
    },
    {
      label: 'Đánh giá người bán',
      key: 'sellerRating'
    }
  ];

  const handleChangeProduct = (index) => {
    navigate('/');
  };

  const handleContactSeller = (product) => {
    // Navigate to messages or open contact dialog
    navigate(`/messages?seller=${product.seller}`);
  };

  const renderRating = (rating, reviews) => {
    return (
      <div className="rating">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="star">★</span>
        ))}
        <span className="review-count">({reviews})</span>
      </div>
    );
  };

  return (
    <div className="compare-page">
      <Header />
      
      <main className="compare-container">
        <div className="compare-wrapper">
          {/* Title */}
          <div className="compare-header">
            <h1 className="compare-title">So sánh sản phẩm</h1>
            <p className="compare-subtitle">So sánh chi tiết giữa các sản phẩm để chọn lựa tốt nhất</p>
          </div>

          {/* Product Cards */}
          <div className="compare-cards">
            {products.map((product, index) => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <button className="wishlist-btn">
                    <Heart size={20} fill="currentColor" />
                  </button>
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  
                  <div className="product-price">
                    {product.price.toLocaleString('vi-VN')}
                    <span className="currency">₫</span>
                  </div>

                  {renderRating(product.rating, product.reviews)}

                  <div className="product-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => handleChangeProduct(index)}
                    >
                      Thay đổi
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleContactSeller(product)}
                    >
                      <Phone size={16} />
                      Liên hệ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="comparison-table">
            <h2 className="table-title">Bảng so sánh chi tiết</h2>
            
            <table className="spec-table">
              <tbody>
                {comparisonItems.map((item) => (
                  <tr key={item.key} className="spec-row">
                    <td className="spec-label">{item.label}</td>
                    {products.map((product) => (
                      <td key={`${product.id}-${item.key}`} className="spec-value">
                        {item.format ? item.format(product[item.key]) : product[item.key]}
                      </td>
                    ))}
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
