import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/Admin/admin-products.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([
    {
      id: 1,
      title: 'iPhone 13 Pro 128GB',
      category: 'Electronics',
      price: 15500000,
      stock: 45,
      status: 'Active',
      seller: 'Seller A',
      date: '2024-01-10'
    },
    {
      id: 2,
      title: 'MacBook Pro 16"',
      category: 'Electronics',
      price: 35000000,
      stock: 12,
      status: 'Active',
      seller: 'Seller B',
      date: '2024-01-09'
    },
    {
      id: 3,
      title: 'Winter Jacket',
      category: 'Fashion',
      price: 890000,
      stock: 0,
      status: 'Inactive',
      seller: 'Seller C',
      date: '2024-01-08'
    },
    {
      id: 4,
      title: 'Office Chair',
      category: 'Home & Garden',
      price: 2500000,
      stock: 28,
      status: 'Active',
      seller: 'Seller D',
      date: '2024-01-07'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-products-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Products</h1>
            <p>Manage your product listings</p>
          </div>
          <Link to="/admin/products/create" className="admin-btn admin-btn-primary">
            <Plus size={20} />
            Add Product
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="admin-filter-select"
            >
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Home & Garden</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Products ({filteredProducts.length})</h4>
            <span className="admin-results-count">
              Showing {filteredProducts.length} of {products.length}
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Seller</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="admin-product-name">
                        <strong>{product.title}</strong>
                      </td>
                      <td>{product.category}</td>
                      <td className="admin-price">{formatPrice(product.price)}</td>
                      <td>
                        <span className={`admin-stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${product.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>{product.seller}</td>
                      <td>{product.date}</td>
                      <td className="admin-actions">
                        <button 
                          className="admin-action-icon view"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="admin-action-icon edit"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="admin-action-icon delete"
                          onClick={() => handleDelete(product.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="admin-empty-state">
                      <p>No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button className="admin-pagination-btn disabled">Previous</button>
            <span className="admin-pagination-info">Page 1 of 5</span>
            <button className="admin-pagination-btn">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
