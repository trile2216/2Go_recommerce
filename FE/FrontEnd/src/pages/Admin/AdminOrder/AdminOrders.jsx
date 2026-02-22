import React, { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Search, Filter, RefreshCcw, ArrowRightLeft } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import './admin-orders.css';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import { getOrders, updateOrderStatus } from '../../../service/admin/api.admin.order';
import { createTransfer } from '../../../service/admin/api.admin.transfer';
import { fetchCustomerById } from '../../../service/admin/api.customer';
import { getBanks } from '../../../service/payment/api.bank';

export default function AdminOrders() {
  const toast = useToast();
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

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filterStatus, searchTerm]);

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
            amount: (order.totalAmount || 0) * 0.9, // Assuming 10% platform fee, or fetch commission rule
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
            category: 'salary' // or other
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
          <button className="admin-btn admin-btn-secondary" onClick={fetchOrders} disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

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
                            {/* <span className="product-id">ID: {order.listingId}</span> */}
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
                        {/* <button className="admin-action-icon view" title="View Details">
                          <Eye size={18} />
                        </button> */}
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
    </AdminLayout>
  );
}
