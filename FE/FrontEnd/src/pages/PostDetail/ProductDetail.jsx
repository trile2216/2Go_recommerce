import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductGallery from '../../components/ProductGallery';
import ProductInfo from '../../components/ProductInfo';
import ProductDescription from '../../components/ProductDescription';
import RelatedProducts from '../../components/RelatedProducts';
import './ProductDetail.css';
import { fetchProductById } from '../../service/home/api.product';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProductDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch product detail:', err);
        setError(err.message);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    getProductDetail();
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <Header />
        <main className="product-detail-main">
          <p>Đang tải chi tiết sản phẩm...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Header />
        <main className="product-detail-main">
          <p style={{ color: 'red' }}>Lỗi: {error || 'Không tìm thấy sản phẩm'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const productData = {
    title: product.title,
    price: formatPrice(product.price),
    location: product.sellerEmail,
    seller: product.sellerPhone,
    condition: product.condition,
    brand: product.brand,
    status: product.status,
  };

  const descriptionText = product.description ? [product.description] : ['Không có mô tả'];

  const specifications = {
    highlights: [
      `Tình trạng: ${product.condition}`,
      `Thương lượng: ${product.hasNegotiation ? 'Có' : 'Không'}`,
      `Hãng: ${product.brand}`,
      `Danh mục: ${product.categoryName}`,
      `Phân loại: ${product.subCategoryName}`,
    ],
    included: [
      `Email người bán: ${product.sellerEmail}`,
      `Số điện thoại: ${product.sellerPhone}`,
    ]
  };

  const relatedProducts = [
    {
      id: 2,
      title: 'iPhone 13 Pro 128GB - Đẹp như mới',
      price: '15.500.000 đ',
      location: 'Phường Linh Xuân, Thủ Đức',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/bf95040152b70a135d0df38766088c92c548a01f?width=518',
    },
    {
      id: 3,
      title: 'iPhone 13 Pro 128GB - Đẹp như mới',
      price: '15.500.000 đ',
      location: 'Phường Linh Xuân, Thủ Đức',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/bf95040152b70a135d0df38766088c92c548a01f?width=518',
    },
    {
      id: 4,
      title: 'iPhone 13 Pro 128GB - Đẹp như mới',
      price: '15.500.000 đ',
      location: 'Phường Linh Xuân, Thủ Đức',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/bf95040152b70a135d0df38766088c92c548a01f?width=518',
    },
    {
      id: 5,
      title: 'iPhone 13 Pro 128GB - Đẹp như mới',
      price: '15.500.000 đ',
      location: 'Phường Linh Xuân, Thủ Đức',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/bf95040152b70a135d0df38766088c92c548a01f?width=518',
    },
  ];

  return (
    <div className="product-detail-page">
      <Header />
      <main className="product-detail-main">
        <div className="product-detail-container">
          <div className="detail-layout">
            <div className="detail-gallery-section">
              <ProductGallery images={product.images || [product.primaryImageUrl]} />
            </div>
            
            <div className="detail-info-section">
              <ProductInfo product={productData} />
            </div>
          </div>
        </div>

        <div className="product-detail-container">
          <ProductDescription 
            description={descriptionText}
            specifications={specifications}
          />
        </div>

        <div className="product-detail-container">
          <RelatedProducts products={relatedProducts} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
