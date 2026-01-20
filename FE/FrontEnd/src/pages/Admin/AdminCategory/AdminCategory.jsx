import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  fetchCategories,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  fetchSubCategoriesByCategoryId,
} from '../../../service/api.category';
import './admin-category.css';

export default function AdminCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    iconUrl: '',
    isActive: true
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    iconUrl: ''
  });

  // Fetch categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchCategories();
      setCategories(response.items || []);
      setError('');
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId) => {
    try {
      setLoadingSubcategories(true);
      const response = await fetchSubCategoriesByCategoryId(categoryId);
      setSubcategories(response.data || []);
    } catch (err) {
      console.error('Error loading subcategories:', err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleExpandCategory = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setSubcategories([]);
    } else {
      setExpandedCategory(categoryId);
      loadSubcategories(categoryId);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        iconUrl: category.iconUrl || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        iconUrl: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenSubcategoryModal = (category) => {
    setSelectedCategory(category);
    setSubcategoryFormData({
      name: '',
      iconUrl: ''
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubcategoryFormChange = (e) => {
    const { name, value } = e.target;
    setSubcategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategoryById(editingCategory.categoryId, formData);
        setSuccess('Category updated successfully!');
      } else {
        await createCategory(formData);
        setSuccess('Category created successfully!');
      }
      setIsModalOpen(false);
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(editingCategory ? 'Failed to update category' : 'Failed to create category');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategoryById(id);
        setSuccess('Category deleted successfully!');
        loadCategories();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete category');
        console.error('Error:', err);
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-category-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Categories</h1>
            <p>Manage product categories and subcategories</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="admin-btn admin-btn-primary"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="admin-alert admin-alert-error">
            {error}
            <button onClick={() => setError('')} className="admin-alert-close">&times;</button>
          </div>
        )}
        {success && (
          <div className="admin-alert admin-alert-success">
            {success}
            <button onClick={() => setSuccess('')} className="admin-alert-close">&times;</button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Categories ({filteredCategories.length})</h4>
          </div>

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading categories...</div>
            ) : filteredCategories.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Category Name</th>
                    <th>Icon</th>
                    <th>Status</th>
                    <th>Subcategories</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <React.Fragment key={category.categoryId}>
                      <tr className="admin-table-row">
                        <td className="admin-expand-btn">
                          <button
                            onClick={() => handleExpandCategory(category.categoryId)}
                            className={`expand-icon ${expandedCategory === category.categoryId ? 'expanded' : ''}`}
                          >
                            <ChevronDown size={18} />
                          </button>
                        </td>
                        <td className="admin-category-name">
                          <strong>{category.name}</strong>
                        </td>
                        <td className="admin-image-cell">
                          {category.iconUrl ? (
                            <img
                              src={category.iconUrl}
                              alt={category.name}
                              className="admin-thumbnail"
                            />
                          ) : (
                            <span className="no-image">No icon</span>
                          )}
                        </td>
                        <td>
                          <span className={`admin-badge ${category.isActive ? 'badge-success' : 'badge-warning'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="admin-subcategory-count">
                          <button
                            onClick={() => handleExpandCategory(category.categoryId)}
                            className="subcategory-link"
                          >
                            View ({subcategories.length})
                          </button>
                        </td>
                        <td className="admin-actions">
                          <button
                            className="admin-action-icon edit"
                            onClick={() => handleOpenModal(category)}
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="admin-action-icon delete"
                            onClick={() => handleDelete(category.categoryId)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>

                      {/* Subcategories Row */}
                      {expandedCategory === category.categoryId && (
                        <tr className="admin-subcategories-row">
                          <td colSpan="7">
                            <div className="subcategories-section">
                              <div className="subcategories-header">
                                <h5>Subcategories</h5>
                                <button
                                  onClick={() => handleOpenSubcategoryModal(category)}
                                  className="admin-btn admin-btn-small admin-btn-success"
                                >
                                  <Plus size={16} /> Add Subcategory
                                </button>
                              </div>

                              {loadingSubcategories ? (
                                <div className="admin-loading-small">Loading subcategories...</div>
                              ) : subcategories.length > 0 ? (
                                <div className="subcategories-list">
                                  {subcategories.map((subcat) => (
                                    <div key={subcat.categoryId} className="subcategory-item">
                                      <div className="subcategory-info">
                                        <h6>{subcat.name}</h6>
                                      </div>
                                      <div className="subcategory-actions">
                                        <button className="admin-action-icon edit" title="Edit">
                                          <Edit2 size={16} />
                                        </button>
                                        <button className="admin-action-icon delete" title="Delete">
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-subcategories">
                                  No subcategories yet
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty-state">
                <p>No categories found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Icon URL</label>
                <input
                  type="text"
                  name="iconUrl"
                  value={formData.iconUrl}
                  onChange={handleFormChange}
                  placeholder="Enter icon URL"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && selectedCategory && (
        <div className="admin-modal-overlay" onClick={() => setIsSubcategoryModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add Subcategory to {selectedCategory.name}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setIsSubcategoryModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form className="admin-modal-form">
              <div className="form-group">
                <label>Subcategory Name *</label>
                <input
                  type="text"
                  name="name"
                  value={subcategoryFormData.name}
                  onChange={handleSubcategoryFormChange}
                  placeholder="Enter subcategory name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Icon URL</label>
                <input
                  type="text"
                  name="iconUrl"
                  value={subcategoryFormData.iconUrl}
                  onChange={handleSubcategoryFormChange}
                  placeholder="Enter icon URL"
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
