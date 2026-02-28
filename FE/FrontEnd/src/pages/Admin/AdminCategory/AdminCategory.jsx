import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategoriesByCategoryId,
  createSubCategory,
} from '../../../service/admin/api.admin.category';
import {
  updateSubCategory,
  deleteSubCategory
} from '../../../service/admin/api.admin.subcategory';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
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
  
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [formData, setFormData] = useState({
    name: '',
    iconUrl: '',
    isActive: true
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    iconUrl: ''
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Fetch categories on mount and page change
  useEffect(() => {
    loadCategories();
  }, [pagination.page]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const skip = (pagination.page - 1) * pagination.limit;
      const response = await getAllCategories(searchTerm, skip, pagination.limit);
      setCategories(response.items || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (err) {
      toast.error('Failed to load categories');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId) => {
    try {
      setLoadingSubcategories(true);
      setLoadingSubcategories(true);
      const response = await getSubCategoriesByCategoryId(categoryId);
      setSubcategories(response.items || []);
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
        await updateCategory(editingCategory.categoryId, formData);
        toast.success('Category updated successfully!');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully!');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to create category');
      console.error('Error:', err);
    }
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory && !editingCategory) return; 

    try {
        if (editingCategory && editingCategory.isSubcategory) { 
            await updateSubCategory(editingCategory.subCategoryId, subcategoryFormData);
            toast.success('Subcategory updated successfully!');
             if (expandedCategory) loadSubcategories(expandedCategory); 
        } else { 
            await createSubCategory(selectedCategory.categoryId, subcategoryFormData);
            toast.success('Subcategory created successfully!');
            loadSubcategories(selectedCategory.categoryId);
        }
        setIsSubcategoryModalOpen(false);
    } catch (err) {
        toast.error('Failed to save subcategory');
        console.error('Error:', err);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteCategory(id);
          toast.success('Category deleted successfully!');
          loadCategories();
        } catch (err) {
          toast.error('Failed to delete category');
          console.error('Error:', err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteSubcategory = (subId, parentId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subcategory',
      message: 'Are you sure you want to delete this subcategory? This action cannot be undone.',
      onConfirm: async () => {
        try {
            await deleteSubCategory(subId);
            toast.success('Subcategory deleted successfully!');
            loadSubcategories(parentId);
        } catch (err) {
             toast.error('Failed to delete subcategory');
             console.error('Error:', err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleOpenEditSubcategory = (subcategory, parentId) => {
      // Reuse subcategory modal/form but need to distinguish edit vs create
      // For simplicity, let's use the same isSubcategoryModalOpen but with editingCategory set
      setEditingCategory({ ...subcategory, isSubcategory: true, parentId }); 
      setSelectedCategory(null); // Clear selectedCategory to denote edit mode or handle logic
      setSubcategoryFormData({
          name: subcategory.name || '',
          iconUrl: subcategory.iconUrl || ''
      });
      setIsSubcategoryModalOpen(true);
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-category-page">
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
                                    <div key={subcat.subCategoryId} className="subcategory-item">
                                      <div className="subcategory-info">
                                        <h6>{subcat.name}</h6>
                                      </div>
                                      <div className="subcategory-actions">
                                        <button 
                                            className="admin-action-icon edit" 
                                            title="Edit"
                                            onClick={() => handleOpenEditSubcategory(subcat, category.categoryId)}
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                            className="admin-action-icon delete" 
                                            title="Delete"
                                            onClick={() => handleDeleteSubcategory(subcat.subCategoryId, category.categoryId)}
                                        >
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

          {/* Pagination */}
          <div className="admin-pagination">
            <button 
                className="admin-pagination-btn" 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
                Previous
            </button>
            <span className="admin-pagination-info">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}</span>
            <button 
                className="admin-pagination-btn"
                disabled={categories.length < pagination.limit} 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
                Next
            </button>
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
              <div className="admin-form-group">
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

              <div className="admin-form-group">
                <label>Icon URL</label>
                <input
                  type="text"
                  name="iconUrl"
                  value={formData.iconUrl}
                  onChange={handleFormChange}
                  placeholder="Enter icon URL"
                />
              </div>

              <div className="admin-form-group">
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
              <h3>{editingCategory?.isSubcategory ? 'Edit Subcategory' : `Add Subcategory to ${selectedCategory?.name}`}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setIsSubcategoryModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubcategorySubmit} className="admin-modal-form">
              <div className="admin-form-group">
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

              <div className="admin-form-group">
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
                  {editingCategory?.isSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  );
}
