import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, Database, RotateCcw, TrendingUp } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/Admin/ConfirmationModal';
import { getAllMarketPrices, seedMarketPrices, backfillMarketPrices } from '../../../service/admin/api.admin.marketPrice';
import './AdminMarketPrice.css';

export default function AdminMarketPrice() {
  const toast = useToast();
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState('All');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Backfill Modal
  const [backfillModalOpen, setBackfillModalOpen] = useState(false);
  const [backfillParams, setBackfillParams] = useState({
    monthsBack: 6,
    minPrice: 100000,
    dryRun: false
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.page, filterCondition, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = (pagination.page - 1) * pagination.limit;
      const condition = filterCondition !== 'All' ? filterCondition : '';
      const data = await getAllMarketPrices(searchTerm, null, condition, skip, pagination.limit);
      setMarketPrices(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching market prices:', error);
      toast.error('Failed to load market prices');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setActionLoading(true);
    try {
      const result = await seedMarketPrices();
      toast.success(result.message || 'Seeded successfully');
      fetchData();
    } catch (error) {
      console.error('Seed failed:', error);
      toast.error('Seed failed. Data may already exist.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackfill = async () => {
    setActionLoading(true);
    try {
      const result = await backfillMarketPrices(
        backfillParams.monthsBack,
        backfillParams.minPrice,
        backfillParams.dryRun
      );
      if (backfillParams.dryRun) {
        toast.info(`Dry run: ${result.orders} orders → ${result.groups} groups`);
      } else {
        toast.success(`Backfill done: ${result.inserted} inserted, ${result.updated} updated`);
      }
      setBackfillModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Backfill failed:', error);
      toast.error('Backfill failed. Check console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'HIGH': return 'badge-success';
      case 'MEDIUM': return 'badge-warning';
      case 'LOW': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'NEW': return 'badge-success';
      case 'GOOD': return 'badge-info';
      case 'FAIR': return 'badge-warning';
      case 'POOR': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="admin-market-price-page">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Market Prices</h1>
            <p>View and manage market price references for products</p>
          </div>
          <div className="admin-header-actions">
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={handleSeed} 
              disabled={actionLoading}
            >
              <Database size={18} />
              Seed Data
            </button>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => setBackfillModalOpen(true)} 
              disabled={actionLoading}
            >
              <RotateCcw size={18} />
              Backfill
            </button>
            <button className="admin-btn admin-btn-secondary" onClick={fetchData} disabled={loading}>
              <RefreshCcw size={18} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by product key..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterCondition}
              onChange={(e) => {
                setFilterCondition(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="admin-filter-select"
            >
              <option value="All">All Conditions</option>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        {/* Market Prices Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>
              <TrendingUp size={20} />
              Price Data
            </h4>
            <span className="admin-results-count">
              Total: {pagination.total} records
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Key</th>
                  <th>Condition</th>
                  <th>Avg Price</th>
                  <th>Min Price</th>
                  <th>Max Price</th>
                  <th>Samples</th>
                  <th>Source</th>
                  <th>Confidence</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{textAlign: 'center', padding: '20px'}}>Loading market prices...</td>
                  </tr>
                ) : marketPrices.length > 0 ? (
                  marketPrices.map((item) => (
                    <tr key={item.marketPriceId}>
                      <td><strong>#{item.marketPriceId}</strong></td>
                      <td className="mp-product-key">{item.productKey}</td>
                      <td>
                        <span className={`admin-badge ${getConditionColor(item.condition)}`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="admin-price"><strong>{formatPrice(item.avgPrice)}</strong></td>
                      <td className="admin-price">{formatPrice(item.minPrice)}</td>
                      <td className="admin-price">{formatPrice(item.maxPrice)}</td>
                      <td className="mp-samples">{item.sampleCount}</td>
                      <td>
                        <span className="admin-badge badge-secondary">{item.source}</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${getConfidenceColor(item.confidence)}`}>
                          {item.confidence}
                        </span>
                      </td>
                      <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="admin-empty-state">
                      <p>No market price data found</p>
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
              disabled={marketPrices.length < pagination.limit} 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Backfill Modal */}
      <ConfirmationModal
        isOpen={backfillModalOpen}
        title="Backfill Market Prices"
        message={
          <div className="backfill-form">
            <p>Generate market price data from completed orders.</p>
            <div className="backfill-field">
              <label>Months Back</label>
              <input 
                type="number" 
                value={backfillParams.monthsBack}
                onChange={(e) => setBackfillParams(prev => ({ ...prev, monthsBack: parseInt(e.target.value) || 6 }))}
                min="1" max="24"
              />
            </div>
            <div className="backfill-field">
              <label>Min Price (VND)</label>
              <input 
                type="number" 
                value={backfillParams.minPrice}
                onChange={(e) => setBackfillParams(prev => ({ ...prev, minPrice: parseInt(e.target.value) || 100000 }))}
                min="0"
              />
            </div>
            <div className="backfill-field">
              <label className="backfill-checkbox">
                <input 
                  type="checkbox" 
                  checked={backfillParams.dryRun}
                  onChange={(e) => setBackfillParams(prev => ({ ...prev, dryRun: e.target.checked }))}
                />
                Dry Run (preview only)
              </label>
            </div>
          </div>
        }
        onConfirm={handleBackfill}
        onCancel={() => setBackfillModalOpen(false)}
        confirmText={actionLoading ? 'Processing...' : (backfillParams.dryRun ? 'Preview' : 'Run Backfill')}
        type="primary"
      />
    </AdminLayout>
  );
}
