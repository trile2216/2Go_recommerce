import React, { useState } from 'react';
import { Eye, Edit2, Trash2, Search, Filter } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/Admin/admin-orders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([
    {
      id: 'ORD-001',
      customer: 'John Doe',
      product: 'iPhone 13 Pro',
      quantity: 1,
      totalAmount: 15500000,
      status: 'Completed',
      paymentStatus: 'Paid',
      date: '2024-01-14',
      deliveryDate: '2024-01-16'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      product: 'MacBook Pro',
      quantity: 1,
      totalAmount: 35000000,
      status: 'Pending',
      paymentStatus: 'Pending',
      date: '2024-01-13',
      deliveryDate: null
    },
    {
      id: 'ORD-003',
      customer: 'Mike Johnson',
      product: 'iPad Air',
      quantity: 2,
      totalAmount: 24000000,
      status: 'Processing',
      paymentStatus: 'Paid',
      date: '2024-01-13',
      deliveryDate: '2024-01-17'
    },
    {
      id: 'ORD-004',
      customer: 'Sarah Williams',
      product: 'AirPods Pro',
      quantity: 3,
      totalAmount: 15000000,
      status: 'Completed',
      paymentStatus: 'Paid',
      date: '2024-01-12',
      deliveryDate: '2024-01-14'
    },
    {
      id: 'ORD-005',
      customer: 'Tom Brown',
      product: 'Apple Watch',
      quantity: 1,
      totalAmount: 8000000,
      status: 'Cancelled',
      paymentStatus: 'Refunded',
      date: '2024-01-11',
      deliveryDate: null
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Processing':
        return 'badge-info';
      case 'Cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Refunded':
        return 'badge-secondary';
      default:
        return 'badge-danger';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-orders-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Orders</h1>
            <p>View and manage all customer orders</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-filter-select"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Orders ({filteredOrders.length})</h4>
            <span className="admin-results-count">
              Total: {orders.length} orders
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="admin-order-id">
                        <strong>{order.id}</strong>
                      </td>
                      <td>{order.customer}</td>
                      <td>{order.product}</td>
                      <td className="admin-quantity">{order.quantity}</td>
                      <td className="admin-price">{formatPrice(order.totalAmount)}</td>
                      <td>
                        <span className={`admin-badge ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${getPaymentColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>{order.date}</td>
                      <td>{order.deliveryDate || '-'}</td>
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
                          onClick={() => handleDelete(order.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="admin-empty-state">
                      <p>No orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button className="admin-pagination-btn disabled">Previous</button>
            <span className="admin-pagination-info">Page 1 of 2</span>
            <button className="admin-pagination-btn">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
