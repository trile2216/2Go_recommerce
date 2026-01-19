import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import './admin-dashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 1250,
    totalCustomers: 450,
    totalOrders: 890,
    totalRevenue: 125000,
    ordersToday: 45,
    customersThisMonth: 89
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: 'ORD-001',
      customer: 'John Doe',
      product: 'iPhone 13 Pro',
      amount: 15500000,
      status: 'Completed',
      date: '2024-01-14'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      product: 'MacBook Pro',
      amount: 35000000,
      status: 'Pending',
      date: '2024-01-13'
    },
    {
      id: 'ORD-003',
      customer: 'Mike Johnson',
      product: 'iPad Air',
      amount: 12000000,
      status: 'Processing',
      date: '2024-01-13'
    },
    {
      id: 'ORD-004',
      customer: 'Sarah Williams',
      product: 'AirPods Pro',
      amount: 5000000,
      status: 'Completed',
      date: '2024-01-12'
    }
  ]);

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
      default:
        return 'badge-secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        {/* Page Header */}
        <div className="admin-page-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your business performance</p>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-primary">
              <ShoppingCart size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Orders</p>
              <h3>{stats.totalOrders}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> 12% increase
              </span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-success">
              <Users size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Customers</p>
              <h3>{stats.totalCustomers}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> 8% increase
              </span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-info">
              <BarChart3 size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Products</p>
              <h3>{stats.totalProducts}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> 5% increase
              </span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-warning">
              <TrendingUp size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Revenue</p>
              <h3>{formatPrice(stats.totalRevenue)}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> 15% increase
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="admin-charts-section">
          <div className="admin-chart-container">
            <div className="admin-chart-header">
              <h4>Sales Overview</h4>
              <select className="admin-chart-filter">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="admin-chart-body">
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: '250px',
                padding: '20px'
              }}>
                {[30, 40, 35, 50, 45, 60, 55, 70, 65, 75, 80, 85].map((value, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '30px',
                      height: `${(value / 100) * 200}px`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.8
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="admin-chart-container">
            <div className="admin-chart-header">
              <h4>Top Categories</h4>
            </div>
            <div className="admin-chart-body">
              <div className="admin-category-list">
                {[
                  { name: 'Electronics', percentage: 45, value: 50000000 },
                  { name: 'Fashion', percentage: 25, value: 28000000 },
                  { name: 'Home & Garden', percentage: 20, value: 22000000 },
                  { name: 'Others', percentage: 10, value: 11000000 }
                ].map((cat, idx) => (
                  <div key={idx} className="admin-category-item">
                    <div className="admin-category-info">
                      <span className="admin-category-name">{cat.name}</span>
                      <span className="admin-category-value">{formatPrice(cat.value)}</span>
                    </div>
                    <div className="admin-category-progress">
                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                      <span className="admin-category-percent">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-recent-orders">
          <div className="admin-card-header">
            <h4>Recent Orders</h4>
            <a href="/admin/orders" className="admin-view-all">View All →</a>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-order-id">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{formatPrice(order.amount)}</td>
                    <td>
                      <span className={`admin-badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <button className="admin-action-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
