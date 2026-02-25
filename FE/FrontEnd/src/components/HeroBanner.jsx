import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAllCategories } from '../service/home/api.category';

const VISIBLE_COUNT = 5;
const SLIDE_INTERVAL = 3000;

export default function HeroBanner() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchAllCategories();
        setCategories(data.items.filter(cat => cat.isActive === true) || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const totalPages = Math.max(1, Math.ceil(categories.length / VISIBLE_COUNT));

  const slideNext = useCallback(() => {
    setStartIndex(prev => {
      const nextPage = Math.floor(prev / VISIBLE_COUNT) + 1;
      return nextPage >= totalPages ? 0 : nextPage * VISIBLE_COUNT;
    });
  }, [totalPages]);

  const slidePrev = () => {
    setStartIndex(prev => {
      const currentPage = Math.floor(prev / VISIBLE_COUNT);
      return currentPage <= 0 ? (totalPages - 1) * VISIBLE_COUNT : (currentPage - 1) * VISIBLE_COUNT;
    });
  };

  // Auto-slide
  useEffect(() => {
    if (categories.length <= VISIBLE_COUNT) return;
    intervalRef.current = setInterval(slideNext, SLIDE_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [categories.length, slideNext]);

  const resetAutoSlide = () => {
    clearInterval(intervalRef.current);
    if (categories.length > VISIBLE_COUNT) {
      intervalRef.current = setInterval(slideNext, SLIDE_INTERVAL);
    }
  };

  const handlePrev = () => { slidePrev(); resetAutoSlide(); };
  const handleNext = () => { slideNext(); resetAutoSlide(); };

  const handleCategoryClick = (categoryId) => {
    navigate(`/listings?categoryId=${categoryId}`);
  };

  const visibleCategories = categories.slice(startIndex, startIndex + VISIBLE_COUNT);
  const currentPage = Math.floor(startIndex / VISIBLE_COUNT);
  const showNav = categories.length > VISIBLE_COUNT;

  return (
    <section className="hero-banner">
      <img 
        src="https://api.builder.io/api/v1/image/assets/TEMP/8f1289c9da77db6112fd900daa77b9dcc319fba9?width=2764" 
        alt="Hero Banner"
        className="hero-image"
      />
      <div className="categories-slider">
        {showNav && (
          <button className="slider-arrow slider-arrow-left" onClick={handlePrev}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="categories">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px', color: '#6b7280' }}>
              Đang tải danh mục...
            </div>
          ) : (
            visibleCategories.map((category) => (
              <button
                key={category.categoryId}
                className="category-btn"
                onClick={() => handleCategoryClick(category.categoryId)}
              >
                {category.iconUrl ? (
                  <img src={category.iconUrl} alt={category.name} className="category-icon" />
                ) : (
                  <div className="category-icon-placeholder">
                    <span>{category.name?.charAt(0)}</span>
                  </div>
                )}
                <span>{category.name}</span>
              </button>
            ))
          )}
        </div>
        {showNav && (
          <button className="slider-arrow slider-arrow-right" onClick={handleNext}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
      {showNav && (
        <div className="slider-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`slider-dot ${i === currentPage ? 'active' : ''}`}
              onClick={() => { setStartIndex(i * VISIBLE_COUNT); resetAutoSlide(); }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
