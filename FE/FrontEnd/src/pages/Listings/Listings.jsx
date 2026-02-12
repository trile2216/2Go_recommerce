import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import './Listings.css';
import '../../styles/loader.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { fetchProducts } from '../../service/home/api.product';
import { fetchAllCategories, fetchSubCategoriesByCategoryId } from '../../service/home/api.category';
import Pagination from '../../components/Pagination/Pagination';

const PAGE_SIZE = 20;

const CONDITION_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'NEW', label: 'Mới' },
  { value: 'USED', label: 'Đã sử dụng' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'newest', label: 'Mới nhất' },
];

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Products state
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filter state - initialized from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subCategoryId') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Categories
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchAllCategories();
        setCategories(data.items || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([]);
      setSelectedSubCategory('');
      return;
    }
    const loadSubCategories = async () => {
      try {
        const data = await fetchSubCategoriesByCategoryId(selectedCategory);
        setSubCategories(data || []);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        setSubCategories([]);
      }
    };
    loadSubCategories();
  }, [selectedCategory]);

  // Sync URL params to state when URL changes (e.g. from Header search)
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('categoryId') || '');
    setSelectedSubCategory(searchParams.get('subCategoryId') || '');
    setCondition(searchParams.get('condition') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSort(searchParams.get('sort') || '');
    setPage(0);
  }, [searchParams]);

  // Build params and fetch products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubCategory) params.subCategoryId = selectedSubCategory;
      if (condition) params.condition = condition;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sort) params.sort = sort;

      // Get wardId from URL
      const wardId = searchParams.get('ward');
      if (wardId) params.wardId = wardId;

      const data = await fetchProducts(params);
      setProducts(data.items || []);
      setTotalCount(data.total ?? data.totalCount ?? data.items?.length ?? 0);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory, selectedSubCategory, condition, minPrice, maxPrice, sort, searchParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Update URL when filters change from within the page
  const applyFilters = (overrides = {}) => {
    const s = {
      search: overrides.search !== undefined ? overrides.search : searchQuery,
      categoryId: overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory,
      subCategoryId: overrides.subCategoryId !== undefined ? overrides.subCategoryId : selectedSubCategory,
      condition: overrides.condition !== undefined ? overrides.condition : condition,
      minPrice: overrides.minPrice !== undefined ? overrides.minPrice : minPrice,
      maxPrice: overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice,
      sort: overrides.sort !== undefined ? overrides.sort : sort,
    };
    const params = new URLSearchParams();
    if (s.search.trim()) params.set('search', s.search.trim());
    if (s.categoryId) params.set('categoryId', s.categoryId);
    if (s.subCategoryId) params.set('subCategoryId', s.subCategoryId);
    if (s.condition) params.set('condition', s.condition);
    if (s.minPrice) params.set('minPrice', s.minPrice);
    if (s.maxPrice) params.set('maxPrice', s.maxPrice);
    if (s.sort) params.set('sort', s.sort);
    const wardId = searchParams.get('ward');
    if (wardId) params.set('ward', wardId);
    setSearchParams(params);
    setPage(0);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSort('');
    setSearchParams({});
    setPage(0);
  };

  const handleCategoryClick = (categoryId) => {
    const newId = String(categoryId);
    const newCategory = selectedCategory === newId ? '' : newId;
    setSelectedCategory(newCategory);
    setSelectedSubCategory('');
    applyFilters({ categoryId: newCategory, subCategoryId: '' });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeFilterCount = [selectedCategory, selectedSubCategory, condition, minPrice, maxPrice].filter(Boolean).length;

  const getCategoryName = (id) => {
    const cat = categories.find(c => String(c.categoryId) === String(id));
    return cat?.name || '';
  };

  return (
    <div className="listings-page">
      <Header />
      <main className="listings-main">
        <div className="listings-container">
          {/* Page Header */}
          <div className="listings-header">
            <div className="listings-title-row">
              <h1 className="listings-title">
                {searchQuery
                  ? `Kết quả tìm kiếm: "${searchQuery}"`
                  : selectedCategory
                    ? `Danh mục: ${getCategoryName(selectedCategory)}`
                    : 'Tất cả tin đăng'}
              </h1>
              <span className="listings-count">{totalCount} kết quả</span>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="listings-categories">
            <button
              className={`listings-category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => { setSelectedCategory(''); setSelectedSubCategory(''); applyFilters({ categoryId: '', subCategoryId: '' }); }}
            >
              <div className="listings-category-icon-placeholder">
                <span>🏷️</span>
              </div>
              <span>Tất cả</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                className={`listings-category-btn ${String(selectedCategory) === String(cat.categoryId) ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.categoryId)}
              >
                {cat.iconUrl ? (
                  <img src={cat.iconUrl} alt={cat.name} className="listings-category-icon" />
                ) : (
                  <div className="listings-category-icon-placeholder">
                    <span>{cat.name?.charAt(0)}</span>
                  </div>
                )}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Toolbar: Sort + Filter toggle */}
          <div className="listings-toolbar">
            <div className="listings-toolbar-right">
              <select
                className="listings-sort-select"
                value={sort}
                onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                className={`listings-filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={16} />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="filter-count-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="listings-filters">
              <div className="filters-grid">
                {subCategories.length > 0 && (
                  <div className="filter-group">
                    <label className="filter-label">Phân loại</label>
                    <select
                      className="filter-select"
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      {subCategories.map(sub => (
                        <option key={sub.subCategoryId} value={sub.subCategoryId}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="filter-group">
                  <label className="filter-label">Tình trạng</label>
                  <select
                    className="filter-select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    {CONDITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Giá từ</label>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Giá đến</label>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="10,000,000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="filters-actions">
                <button className="filter-clear-btn" onClick={clearFilters}>
                  <X size={14} /> Xóa bộ lọc
                </button>
                <button className="filter-apply-btn" onClick={applyFilters}>
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="active-filters">
              {selectedCategory && (
                <span className="filter-tag">
                  {getCategoryName(selectedCategory)}
                  <button onClick={() => { setSelectedCategory(''); setSelectedSubCategory(''); applyFilters({ categoryId: '', subCategoryId: '' }); }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {condition && (
                <span className="filter-tag">
                  {CONDITION_OPTIONS.find(o => o.value === condition)?.label}
                  <button onClick={() => { setCondition(''); applyFilters({ condition: '' }); }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="filter-tag">
                  {minPrice ? `${Number(minPrice).toLocaleString('vi-VN')}₫` : '0'}
                  {' - '}
                  {maxPrice ? `${Number(maxPrice).toLocaleString('vi-VN')}₫` : '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); applyFilters({ minPrice: '', maxPrice: '' }); }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              <button className="clear-all-filters" onClick={clearFilters}>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <div className="loading-state-text">Đang tải sản phẩm...</div>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="listings-grid">
                {products.map(product => (
                  <ProductCard key={product.listingId} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={page + 1} 
                totalPages={totalPages} 
                onPageChange={(p) => setPage(p - 1)} 
              />
            </>
          ) : (
            <div className="listings-empty">
              <PackageSearch size={48} strokeWidth={1} />
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm.</p>
              <button className="clear-filters-btn" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
