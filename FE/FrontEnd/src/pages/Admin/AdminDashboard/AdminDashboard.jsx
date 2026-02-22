import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import './admin-dashboard.css'

import { getDashboardSummary, getDashboardTimeseries } from '../../../service/admin/api.admin.dashboard';
import { getOrders } from '../../../service/admin/api.admin.order';

// Available metrics for the chart selector
const CHART_METRICS = [
  { key: 'ordersTotal', label: 'Orders', color: '#3b82f6' },
  { key: 'gmvCompleted', label: 'Revenue (GMV)', color: '#10b981', isCurrency: true },
  { key: 'listingsNew', label: 'New Listings', color: '#f59e0b' },
  { key: 'usersNew', label: 'New Users', color: '#8b5cf6' },
  { key: 'ordersCompleted', label: 'Completed Orders', color: '#06b6d4' },
  { key: 'ordersCancelled', label: 'Cancelled Orders', color: '#ef4444' },
  { key: 'commissionRevenue', label: 'Commission', color: '#ec4899', isCurrency: true },
  { key: 'reportsNew', label: 'New Reports', color: '#f97316' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    ordersToday: 0,
    customersThisMonth: 0
  });
  const [timeseriesPoints, setTimeseriesPoints] = useState([]);
  const [timeBucket, setTimeBucket] = useState('day');
  const [chartMetric, setChartMetric] = useState('ordersTotal');
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summary, timeseries, ordersData] = await Promise.all([
          getDashboardSummary(),
          getDashboardTimeseries('', '', timeBucket),
          getOrders({ skip: 0, take: 5 })
        ]);

        setStats({
          totalProducts: summary.summary.listingsActive,
          totalCustomers: summary.summary.usersNew, 
          totalOrders: summary.summary.ordersTotal,
          totalRevenue: summary.summary.gmvCompleted,
          ordersToday: 0, 
          customersThisMonth: 0 
        });

        // Store the full timeseries points
        setTimeseriesPoints(timeseries.points || []);

        // Set Recent Orders
        if (ordersData && ordersData.items) {
            setRecentOrders(ordersData.items);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeBucket]);

  // Derive chart values from the selected metric
  const selectedMetricInfo = CHART_METRICS.find(m => m.key === chartMetric) || CHART_METRICS[0];
  const chartValues = timeseriesPoints.map(p => p[chartMetric] || 0);
  const maxChartValue = Math.max(...chartValues, 1);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatChartValue = (value) => {
    if (selectedMetricInfo.isCurrency) {
      return formatPrice(value);
    }
    return value.toLocaleString('vi-VN');
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    if (timeBucket === 'month') {
      return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Processing':
      case 'Confirmed':
        return 'badge-info';
      case 'Cancelled':
        return 'badge-danger'; 
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
          <div className="admin-chart-container" style={{ flex: '1 1 100%' }}>
            <div className="admin-chart-header">
              <h4>{selectedMetricInfo.label} Overview</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="admin-chart-filter"
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                >
                  {CHART_METRICS.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <select 
                  className="admin-chart-filter"
                  value={timeBucket}
                  onChange={(e) => setTimeBucket(e.target.value)}
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>
            <div className="admin-chart-body">
              {/* Y-axis max label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>{formatChartValue(maxChartValue)}</span>
                <span>Total: {formatChartValue(chartValues.reduce((a, b) => a + b, 0))}</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '220px',
                padding: '10px 20px 0',
                gap: '2px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {timeseriesPoints.length > 0 ? timeseriesPoints.map((point, idx) => {
                  const value = point[chartMetric] || 0;
                  const barHeight = maxChartValue > 0 ? (value / maxChartValue) * 200 : 0;
                  return (
                    <div
                      key={idx}
                      title={`${formatDateLabel(point.periodStart)}: ${formatChartValue(value)}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: `${Math.max(barHeight, value > 0 ? 4 : 1)}px`,
                        backgroundColor: value > 0 ? selectedMetricInfo.color : '#e2e8f0',
                        borderRadius: '3px 3px 0 0',
                        opacity: value > 0 ? 0.85 : 0.3,
                        transition: 'height 0.3s ease, opacity 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                }) : <p style={{ margin: 'auto', color: '#94a3b8' }}>No data available</p>}
              </div>
              {/* Date labels */}
              {timeseriesPoints.length > 0 && (
                <div style={{
                  display: 'flex',
                  padding: '6px 20px 10px',
                  gap: '2px'
                }}>
                  {timeseriesPoints.map((point, idx) => {
                    // Show label every N points to avoid overcrowding
                    const showEvery = timeseriesPoints.length > 14 ? Math.ceil(timeseriesPoints.length / 7) : 1;
                    const showLabel = idx % showEvery === 0 || idx === timeseriesPoints.length - 1;
                    return (
                      <div key={idx} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {showLabel ? formatDateLabel(point.periodStart) : ''}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <th>Order Code</th>
                  <th>Product</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                    <tr key={order.orderId}>
                        <td className="admin-order-id">#{order.orderCode}</td>
                        <td>{order.listingTitle || 'N/A'}</td>
                        <td>{formatPrice(order.totalAmount)}</td>
                        <td>
                        <span className={`admin-badge ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                        </td>
                        <td>
                             <span className="admin-badge badge-secondary" style={{fontSize: '0.75rem'}}>
                                {order.paymentMethod}
                            </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No recent orders found</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
