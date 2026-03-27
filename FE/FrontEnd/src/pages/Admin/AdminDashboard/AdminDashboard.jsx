import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, ArrowUp, ArrowDown, CreditCard, Percent } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import './admin-dashboard.css'

import { getDashboardSummary, getDashboardTimeseries } from '../../../service/admin/api.admin.dashboard';
import { getOrders } from '../../../service/admin/api.admin.order';
import { getAdminPayments } from '../../../service/admin/api.admin.payment';

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
    subscriptionRevenue: 0,
    commissionRevenue: 0,
    ordersToday: 0,
    customersThisMonth: 0
  });
  const [timeseriesPoints, setTimeseriesPoints] = useState([]);
  const [timeBucket, setTimeBucket] = useState('day');
  const [chartMetric, setChartMetric] = useState('ordersTotal');
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [paymentItems, setPaymentItems] = useState([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSkip, setPaymentSkip] = useState(0);
  const paymentTake = 10;

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
          subscriptionRevenue: summary.summary.subscriptionRevenue,
          commissionRevenue: summary.summary.commissionRevenue,
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return 'N/A';
    const numericRate = Number(rate);
    if (Number.isNaN(numericRate)) return 'N/A';
    if (numericRate <= 1) return `${(numericRate * 100).toFixed(2)}%`;
    return `${numericRate}%`;
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

  const fetchPayments = async (type, nextSkip = 0) => {
    setPaymentLoading(true);
    try {
      const response = await getAdminPayments({
        paymentType: type,
        status: 'Paid',
        skip: nextSkip,
        take: paymentTake
      });
      const items = response.items || response.Items || [];
      const total = response.total ?? response.Total ?? 0;
      setPaymentItems(items);
      setPaymentTotal(total);
      setPaymentSkip(nextSkip);
    } catch (error) {
      console.error('Failed to fetch payment details', error);
      setPaymentItems([]);
      setPaymentTotal(0);
    } finally {
      setPaymentLoading(false);
    }
  };

  const openPaymentModal = async (type) => {
    setPaymentType(type);
    setPaymentModalOpen(true);
    await fetchPayments(type, 0);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentType('');
    setPaymentItems([]);
    setPaymentTotal(0);
    setPaymentSkip(0);
  };

  const paymentTitle = paymentType === 'SUBSCRIPTION' ? 'Subscription Revenue Details' : 'Commission Revenue Details';
  const isSubscription = paymentType === 'SUBSCRIPTION';

  return (
    <AdminLayout>
      <div className="admin-dashboard">
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

          <div className="admin-stat-card is-clickable" onClick={() => openPaymentModal('SUBSCRIPTION')}>
            <div className="admin-stat-icon bg-info">
              <CreditCard size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Subscription Revenue</p>
              <h3>{formatPrice(stats.subscriptionRevenue)}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> View details
              </span>
            </div>
          </div>

          <div className="admin-stat-card is-clickable" onClick={() => openPaymentModal('COMMISSION')}>
            <div className="admin-stat-icon bg-success">
              <Percent size={24} />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Commission Revenue</p>
              <h3>{formatPrice(stats.commissionRevenue)}</h3>
              <span className="admin-stat-change positive">
                <ArrowUp size={16} /> View details
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

      {paymentModalOpen && (
        <div className="admin-modal-overlay" onClick={closePaymentModal}>
          <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{paymentTitle}</h3>
              <button className="admin-modal-close" onClick={closePaymentModal}>?</button>
            </div>
            <div className="admin-modal-body">
              {paymentLoading ? (
                <p style={{ textAlign: 'center', padding: '16px' }}>Loading...</p>
              ) : (
                <>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          {isSubscription ? (
                            <>
                              <th>User</th>
                              <th>Plan</th>
                              <th>Amount</th>
                              <th>Valid Until</th>
                              <th>Status</th>
                              <th>Created At</th>
                            </>
                          ) : (
                            <>
                              <th>Order Code</th>
                              <th>Listing</th>
                              <th>Order Total</th>
                              <th>Rate</th>
                              <th>Commission</th>
                              <th>Status</th>
                              <th>Created At</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {paymentItems.length > 0 ? (
                          paymentItems.map((p) => (
                            <tr key={p.paymentId}>
                              <td className="admin-order-id">#{p.paymentId}</td>
                              {isSubscription ? (
                                <>
                                  <td>{p.userEmail || 'N/A'}</td>
                                  <td>{p.subscriptionPlanCode || 'N/A'}</td>
                                  <td>{formatPrice(p.amount || 0)}</td>
                                  <td>{p.subscriptionValidUntil ? formatDateTime(p.subscriptionValidUntil) : 'N/A'}</td>
                                  <td>{p.status || 'N/A'}</td>
                                  <td>{formatDateTime(p.createdAt)}</td>
                                </>
                              ) : (
                                <>
                                  <td>{p.orderCode ? `#${p.orderCode}` : 'N/A'}</td>
                                  <td>{p.listingTitle || 'N/A'}</td>
                                  <td>{formatPrice(p.orderTotalAmount || 0)}</td>
                                  <td>{formatRate(p.commissionRate)}</td>
                                  <td>{formatPrice(p.commissionAmount || 0)}</td>
                                  <td>{p.status || 'N/A'}</td>
                                  <td>{formatDateTime(p.createdAt)}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '16px' }}>
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Showing {paymentItems.length === 0 ? 0 : paymentSkip + 1} - {Math.min(paymentSkip + paymentItems.length, paymentTotal)} of {paymentTotal}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="admin-action-btn"
                        disabled={paymentSkip <= 0 || paymentLoading}
                        onClick={() => fetchPayments(paymentType, Math.max(paymentSkip - paymentTake, 0))}
                      >
                        Prev
                      </button>
                      <button
                        className="admin-action-btn"
                        disabled={paymentSkip + paymentTake >= paymentTotal || paymentLoading}
                        onClick={() => fetchPayments(paymentType, paymentSkip + paymentTake)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
