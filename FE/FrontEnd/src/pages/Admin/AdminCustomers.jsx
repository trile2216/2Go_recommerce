import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/Admin/admin-customers.css';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0912345678',
      location: 'Thủ Đức',
      totalOrders: 5,
      totalSpent: 75000000,
      joinDate: '2023-06-15',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      location: 'Bình Thạnh',
      totalOrders: 12,
      totalSpent: 185000000,
      joinDate: '2023-05-20',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '0923456789',
      location: 'Quận 1',
      totalOrders: 3,
      totalSpent: 45000000,
      joinDate: '2023-07-10',
      status: 'Inactive'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '0934567890',
      location: 'Thủ Đức',
      totalOrders: 8,
      totalSpent: 120000000,
      joinDate: '2023-04-05',
      status: 'Active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-customers-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Customers</h1>
            <p>Manage customer accounts and information</p>
          </div>
          <button className="admin-btn admin-btn-primary">
            <Plus size={20} />
            Add Customer
          </button>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="admin-filter-select"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {/* Customers Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Customers ({filteredCustomers.length})</h4>
            <span className="admin-results-count">
              Total: {customers.length} customers
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="admin-customer-name">
                        <strong>{customer.name}</strong>
                      </td>
                      <td>
                        <div className="admin-contact-info">
                          <div>
                            <Mail size={16} />
                            <span>{customer.email}</span>
                          </div>
                          <div>
                            <Phone size={16} />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>{customer.location}</td>
                      <td className="admin-orders-count">{customer.totalOrders}</td>
                      <td className="admin-price">{formatPrice(customer.totalSpent)}</td>
                      <td>{customer.joinDate}</td>
                      <td>
                        <span className={`admin-badge ${customer.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                          {customer.status}
                        </span>
                      </td>
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
                          onClick={() => handleDelete(customer.id)}
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
                      <p>No customers found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button className="admin-pagination-btn disabled">Previous</button>
            <span className="admin-pagination-info">Page 1 of 3</span>
            <button className="admin-pagination-btn">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
