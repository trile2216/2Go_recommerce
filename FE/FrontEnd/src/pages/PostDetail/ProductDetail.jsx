import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductGallery from '../../components/ProductGallery';
import ProductInfo from '../../components/ProductInfo';
import ProductDescription from '../../components/ProductDescription';
import RelatedProducts from '../../components/RelatedProducts';
import ErrorPage from '../ErrorPage/ErrorPage';
import { useTitle } from '../../hooks/useTitle';
import '../../styles/loader.css';
import './ProductDetail.css';
import { fetchProductById, fetchProducts } from '../../service/home/api.product';

export default function ProductDetail() {
  const { id } = useParams();
  useTitle('Product Details');
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProductDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
        setError(null);

        // Fetch related products by same category/subCategory
        try {
          const related = await fetchProducts({
            categoryId: data.categoryId,
            status: 'Active',
            take: 8,
          });
          // Filter out the current product
          const filtered = (related.items || []).filter(
            (item) => item.listingId !== parseInt(id)
          );
          setRelatedProducts(filtered.slice(0, 4));
        } catch {
          setRelatedProducts([]);
        }
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
          <div className="loading-state">
            <div className="loader"></div>
            <div className="loading-state-text">Đang tải chi tiết sản phẩm...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return <ErrorPage error={error || 'Không tìm thấy sản phẩm'} />;
  }

  const productData = {
    title: product.title,
    price: formatPrice(product.price),
    location: product.sellerEmail, 
    seller: product.sellerPhone,
    condition: product.condition,
    brand: product.brand,
    status: product.status,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    sellerAvatar: product.sellerAvatarUrl,
    sellerEmail: product.sellerEmail,
    sellerPhone: product.sellerPhone,
  };

  const descriptionText = product.description ? [product.description] : ['Không có mô tả'];

  const specifications = {
    highlights: [
      `Tình trạng: ${product.condition === "USED" ? 'Đã sử dụng' : 'Mới'} `,
      `Thương lượng: ${product.hasNegotiation ? 'Có' : 'Không'}`,
      `Hãng: ${product.brand}`,
      `Danh mục: ${product.categoryName}`,
      `Phân loại: ${product.subCategoryName}`,
    ],
    included: [
      product.sellerEmail && `Email người bán: ${product.sellerEmail}`,
      product.sellerPhone && `Số điện thoại: ${product.sellerPhone}`,
    ].filter(Boolean)
  };

  return (
    <div className="product-detail-page">
      <Header />
      <main className="product-detail-main">
        <div className="product-detail-container">
          <div className="detail-layout">
            <div className="detail-gallery-section">
              <ProductGallery images={
                product.media && product.media.length > 0
                  ? [...product.media]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(m => m.url)
                  : [product.primaryImageUrl].filter(Boolean)
              } />
            </div>
            
            <div className="detail-info-section">
              <ProductInfo product={productData} listingId={product.listingId} primaryImageUrl={product.primaryImageUrl} rawPrice={product.price} />
            </div>
          </div>
        </div>

        <div className="product-detail-container">
          <ProductDescription 
            description={descriptionText}
            specifications={specifications}
            listingId={product.listingId}
          />
        </div>
         {relatedProducts.length > 0 &&  
          <div className="product-detail-container">
            <RelatedProducts products={relatedProducts} />
          </div>
         }
       
      </main>

      <Footer />
    </div>
  );
}
