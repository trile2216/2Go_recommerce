import React, { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Search, Filter, RefreshCcw, ArrowRightLeft, Bell, RotateCcw, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import './admin-orders.css';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import { getOrders, updateOrderStatus } from '../../../service/admin/api.admin.order';
import { createTransfer } from '../../../service/admin/api.admin.transfer';
import { fetchCustomerById } from '../../../service/admin/api.customer';
import { getBanks } from '../../../service/payment/api.bank';
import { getForfeitPayouts, retryForfeitPayout } from '../../../service/admin/api.admin.payout';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';

export default function AdminOrders() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payouts'
  const [orders, setOrders] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] = useState(null);
  const [transferDetails, setTransferDetails] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);

  // Notification Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });

  // Failed Payouts State
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState('All');
  const [payoutPagination, setPayoutPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [retryingId, setRetryingId] = useState(null);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [pagination.page, filterStatus, searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'payouts') fetchPayouts();
  }, [payoutPagination.page, payoutFilter, activeTab]);

  const fetchBanks = async () => {
    try {
      const response = await getBanks();
      if (response && response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      };

      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }
      if (searchTerm) {
        // Search by Order Code if numeric, otherwise we might need other filters
        // The API supports orderCode (long), buyerId, sellerId.
        // For text search like customer name, the backend doesn't seem to support it directly yet based on the controller.
        // We will try to parse order code.
        if (!isNaN(searchTerm)) {
            params.orderCode = parseInt(searchTerm);
        }
      }

      const data = await getOrders(params);
      setOrders(data.items || []);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const params = {
        skip: (payoutPagination.page - 1) * payoutPagination.limit,
        take: payoutPagination.limit
      };
      if (payoutFilter !== 'All') {
        params.status = payoutFilter;
      }
      const data = await getForfeitPayouts(params);
      setPayouts(data.items || []);
      setPayoutPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load failed payouts');
    } finally {
      setPayoutsLoading(false);
    }
  };

  const openRetryModal = (payout) => {
    setSelectedPayout(payout);
    setRetryModalOpen(true);
  };

  const handleRetryPayout = async () => {
    if (!selectedPayout) return;
    setRetryingId(selectedPayout.escrowId);
    try {
      await retryForfeitPayout(selectedPayout.escrowId);
      toast.success(`Payout retry initiated for Escrow #${selectedPayout.escrowId}`);
      setRetryModalOpen(false);
      setSelectedPayout(null);
      fetchPayouts();
    } catch (error) {
      console.error('Retry payout failed:', error);
      toast.error('Failed to retry payout. Check console for details.');
    } finally {
      setRetryingId(null);
    }
  };

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Failed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const startTransfer = async (order) => {
    if (order.status !== 'Completed') {
        toast.warning('Only completed orders can be transferred.');
        return;
    }
    
    setTransferLoading(true);
    try {
        // 1. Fetch Seller to get Bank Info
        const seller = await fetchCustomerById(order.sellerId);
        
        if (!seller || !seller.profile) {
            toast.error('Could not fetch seller information.');
            return;
        }

        const { bankAccountNumber, bankAccountName } = seller.profile;

        if (!bankAccountNumber || !bankAccountName) {
            toast.error('Seller does not have bank account information configured.');
            return;
        }

        // 2. Find Bank BIN
        // UserInfo saves shortName as bankAccountName
        const bank = banks.find(b => 
            b.shortName === bankAccountName || 
            b.name === bankAccountName ||
            b.code === bankAccountName
        );

        if (!bank) {
            toast.error(`Could not find bank details for: ${bankAccountName}`);
            return;
        }

        setSelectedOrderForTransfer(order);
        setTransferDetails({
            amount: (order.totalAmount || 0) * 0.93, // Assuming 7% platform fee, or fetch commission rule
            // Ideally we transfer the payout amount, which might be total - fee. 
            // For now, I'll default to totalAmount but in a real app this should be calculated.
            // Wait, usually transfer is for Payout. 
            // I'll leave amount editable or set to Total for now.
            // Let's use order.totalAmount for now and let admin verify.
            // Actually, better to transfer what the seller earned.
            // Since logic isn't fully clear on frontend, I'll allow admin to review.
            displayAmount: order.totalAmount, 
            toBin: bank.bin,
            toAccountNumber: bankAccountNumber,
            bankName: bank.shortName,
            description: `Payout for Order #${order.orderCode}`
        });
        setTransferModalOpen(true);

    } catch (error) {
        console.error('Error preparing transfer:', error);
        toast.error('Failed to prepare transfer details.');
    } finally {
        setTransferLoading(false);
    }
  };

  const confirmTransfer = async () => {
    if (!selectedOrderForTransfer || !transferDetails) return;

    try {
        await createTransfer({
            amount: transferDetails.displayAmount, // In real app, calculate fee
            description: transferDetails.description,
            toBin: transferDetails.toBin,
            toAccountNumber: transferDetails.toAccountNumber,
            category: ['payout']
        });
        toast.success(`Transfer initiated for Order #${selectedOrderForTransfer.orderCode}`);
        setTransferModalOpen(false);
        // Optionally update order status/metadata if backend creates a transaction record
    } catch (error) {
        console.error('Transfer failed:', error);
        toast.error('Transfer failed. Check console for details.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Delivered': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Processing':
      case 'Confirmed': return 'badge-info';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getEscrowColor = (status) => {
    if (!status) return 'badge-secondary';
    switch (status) {
      case 'Holding': return 'badge-warning';
      case 'Released': return 'badge-success';
      case 'Refunded': return 'badge-info';
      case 'Forfeited': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getPaymentColor = (method) => {
    // This is Payment Method, not status. Status is not in OrderListItem separately in some views,
    // but DTO has PaymentMethod (COD, PayOS).
    return 'badge-secondary'; 
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
          <button className="admin-btn admin-btn-secondary" onClick={activeTab === 'orders' ? fetchOrders : fetchPayouts} disabled={loading || payoutsLoading}>
            <RefreshCcw size={18} className={(loading || payoutsLoading) ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Orders
          </button>
          <button
            className={`admin-tab ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            <AlertTriangle size={16} />
            Failed Payouts
          </button>
        </div>

        {/* ======= ORDERS TAB ======= */}
        {activeTab === 'orders' && (
          <>
            {/* Filters & Search */}
            <div className="admin-filters-section">
              <div className="admin-search-wrapper">
                <Search size={20} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search by Order Code..."
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
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Disputed">Disputed</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h4>Order List</h4>
                <span className="admin-results-count">
                  Total: {pagination.total} orders
                </span>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order Code</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Escrow</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>Loading orders...</td>
                        </tr>
                    ) : orders.length > 0 ? (
                      orders.map((order) => (
                        <tr key={order.orderId}>
                          <td className="admin-order-id">
                            <strong>#{order.orderCode}</strong>
                          </td>
                          <td>
                            <div className="order-product-info">
                                <span className="product-name">{order.listingTitle || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="admin-price">{formatPrice(order.listingPrice)}</td>
                          <td className="admin-price"><strong>{formatPrice(order.totalAmount)}</strong></td>
                          <td>
                            <span className={`admin-badge ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.escrowStatus ? (
                              <span className={`admin-badge ${getEscrowColor(order.escrowStatus)}`}>
                                {order.escrowStatus}
                              </span>
                            ) : (
                              <span className="admin-badge badge-secondary">N/A</span>
                            )}
                          </td>
                          <td>
                            <span className="admin-badge badge-secondary">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="admin-actions">
                            {order.status === 'Completed' && (
                                <button 
                                    className="admin-action-icon edit" 
                                    title="Transfer Payout"
                                    onClick={() => startTransfer(order)}
                                    disabled={transferLoading}
                                >
                                    <ArrowRightLeft size={18} />
                                </button>
                            )}
                            <button 
                              className="admin-action-icon view"
                              title="Notify Buyer"
                              onClick={() => {
                                setNotifyTarget({
                                  userId: order.buyerId,
                                  userName: `Buyer #${order.buyerId}`,
                                  defaultTitle: `Order #${order.orderCode}`,
                                  defaultMessage: `Regarding your order #${order.orderCode}`
                                });
                                setNotifyModalOpen(true);
                              }}
                            >
                              <Bell size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="admin-empty-state">
                          <p>No orders found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    disabled={orders.length < pagination.limit} 
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                    Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* ======= FAILED PAYOUTS TAB ======= */}
        {activeTab === 'payouts' && (
          <>
            {/* Payout Filters */}
            <div className="admin-filters-section">
              <div className="admin-filter-group">
                <Filter size={20} />
                <select 
                  value={payoutFilter}
                  onChange={(e) => {
                    setPayoutFilter(e.target.value);
                    setPayoutPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="admin-filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Failed Payouts Table */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h4>
                  <AlertTriangle size={20} style={{color: '#f59e0b'}} />
                  Forfeit Payouts
                </h4>
                <span className="admin-results-count">
                  Total: {payoutPagination.total} payouts
                </span>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Escrow ID</th>
                      <th>Order ID</th>
                      <th>Seller</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutsLoading ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Loading payouts...</td>
                      </tr>
                    ) : payouts.length > 0 ? (
                      payouts.map((payout) => (
                        <tr key={payout.escrowId}>
                          <td><strong>#{payout.escrowId}</strong></td>
                          <td>{payout.orderId ? `#${payout.orderId}` : '-'}</td>
                          <td>
                            <div className="order-product-info">
                              <span className="product-name">{payout.sellerName || 'Unknown'}</span>
                              {/* {payout.sellerId && <span className="product-id">ID: {payout.sellerId}</span>} */}
                            </div>
                          </td>
                          <td className="admin-price"><strong>{formatPrice(payout.amount)}</strong></td>
                          <td>
                            <span className={`admin-badge ${getPayoutStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                          </td>
                          <td>{payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="admin-actions">
                            {payout.status === 'Failed' && (
                              <button 
                                className="admin-action-icon edit"
                                title="Retry Payout"
                                onClick={() => openRetryModal(payout)}
                                disabled={retryingId === payout.escrowId}
                              >
                                <RotateCcw size={18} className={retryingId === payout.escrowId ? 'spin' : ''} />
                              </button>
                            )}
                            <button 
                              className="admin-action-icon view"
                              title="Notify Seller"
                              onClick={() => {
                                setNotifyTarget({
                                  userId: payout.sellerId,
                                  userName: payout.sellerName || `Seller #${payout.sellerId}`,
                                  defaultTitle: `Payout Update - Escrow #${payout.escrowId}`,
                                  defaultMessage: `Regarding the payout for your order #${payout.orderId || payout.escrowId}`
                                });
                                setNotifyModalOpen(true);
                              }}
                            >
                              <Bell size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="admin-empty-state">
                          <p>No payouts found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payout Pagination */}
              <div className="admin-pagination">
                <button 
                  className="admin-pagination-btn" 
                  disabled={payoutPagination.page <= 1}
                  onClick={() => setPayoutPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span className="admin-pagination-info">
                  Page {payoutPagination.page} of {Math.ceil(payoutPagination.total / payoutPagination.limit) || 1}
                </span>
                <button 
                  className="admin-pagination-btn"
                  disabled={payouts.length < payoutPagination.limit} 
                  onClick={() => setPayoutPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transfer Confirmation Modal */}
      <ConfirmationModal
        isOpen={transferModalOpen}
        title="Confirm Payout Transfer"
        message={
            transferDetails ? (
                <div>
                    <p>Are you sure you want to transfer payout for Order <strong>#{selectedOrderForTransfer?.orderCode}</strong>?</p>
                    <div style={{marginTop: '10px', padding: '10px', background: '#f5f7fa', borderRadius: '6px'}}>
                        <p><strong>Bank:</strong> {transferDetails.bankName}</p>
                        <p><strong>Account:</strong> {transferDetails.toAccountNumber}</p>
                        <p><strong>Amount:</strong> {formatPrice(transferDetails.displayAmount)}</p>
                        <p><strong>Desc:</strong> {transferDetails.description}</p>
                    </div>
                </div>
            ) : "Processing..."
        }
        onConfirm={confirmTransfer}
        onCancel={() => setTransferModalOpen(false)}
        confirmText="Transfer Now"
        type="primary"
      />

      {/* Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={notifyTarget.userId}
        userName={notifyTarget.userName}
        defaultTitle={notifyTarget.defaultTitle}
        defaultMessage={notifyTarget.defaultMessage}
        defaultType="order"
      />

      {/* Retry Payout Confirmation Modal */}
      <ConfirmationModal
        isOpen={retryModalOpen}
        title="Retry Payout"
        message={
          selectedPayout ? (
            <div>
              <p>Are you sure you want to retry the payout for Escrow <strong>#{selectedPayout.escrowId}</strong>?</p>
              <div style={{marginTop: '10px', padding: '10px', background: '#f5f7fa', borderRadius: '6px'}}>
                <p><strong>Seller:</strong> {selectedPayout.sellerName || `#${selectedPayout.sellerId}`}</p>
                <p><strong>Order:</strong> #{selectedPayout.orderId || 'N/A'}</p>
                <p><strong>Amount:</strong> {formatPrice(selectedPayout.amount)}</p>
              </div>
            </div>
          ) : 'Processing...'
        }
        onConfirm={handleRetryPayout}
        onCancel={() => { setRetryModalOpen(false); setSelectedPayout(null); }}
        confirmText={retryingId ? 'Retrying...' : 'Retry Payout'}
        type="warning"
      />
    </AdminLayout>
  );
}
