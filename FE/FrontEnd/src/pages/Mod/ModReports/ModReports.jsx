import React, { useState, useEffect } from 'react';
import { Filter, RefreshCcw, Eye, Bell, X, ChevronRight } from 'lucide-react';
import ModLayout from '../../../layouts/ModLayout';
import { useToast } from '../../../context/ToastContext';
import { getModReports, getModReportById, resolveModReport } from '../../../service/mod/api.mod.report';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import '../../Admin/AdminReport/admin-reports.css';

const REPORT_STATUSES = ['Open', 'InReview', 'WaitingOtherParty', 'Resolved', 'Rejected'];

export default function ModReports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Detail Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Resolve Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveReport, setResolveReport] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: '', waitingForRole: '', decision: '', note: '' });

  // Notification Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '' });

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      };
      if (filterStatus !== 'All') params.status = filterStatus;

      const data = await getModReports(params);
      setReports(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (report) => {
    try {
      const detail = await getModReportById(report.reportId);
      setSelectedReport(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching report detail:', error);
      toast.error('Failed to load report details');
    }
  };

  const openResolveModal = (report) => {
    setResolveReport(report);
    // Pre-select the next expected status
    const currentStatus = report.status || 'Open';
    let nextStatus = '';
    if (currentStatus === 'Open') nextStatus = 'InReview';
    else if (currentStatus === 'InReview') nextStatus = 'Resolved';
    
    setResolveForm({ status: nextStatus, waitingForRole: '', decision: '', note: '' });
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async () => {
    if (!resolveForm.status) {
      toast.warning('Please select a target status.');
      return;
    }
    if (resolveForm.status === 'WaitingOtherParty' && !resolveForm.waitingForRole) {
      toast.warning('Please select who to wait for (Buyer or Seller).');
      return;
    }
    if (resolveForm.status === 'Resolved' && !resolveForm.decision) {
      toast.warning('Please select a decision (RefundBuyer or ReleaseSeller).');
      return;
    }

    try {
      const payload = { status: resolveForm.status };
      if (resolveForm.waitingForRole) payload.waitingForRole = resolveForm.waitingForRole;
      if (resolveForm.decision) payload.decision = resolveForm.decision;
      if (resolveForm.note) payload.note = resolveForm.note;

      await resolveModReport(resolveReport.reportId, payload);
      toast.success(`Report updated to ${resolveForm.status}.`);
      setShowResolveModal(false);
      setShowDetailModal(false);
      fetchReports();
    } catch (error) {
      console.error('Resolve failed:', error);
      const msg = error?.response?.data || 'Failed to update report.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'badge-warning';
      case 'InReview': return 'badge-info';
      case 'WaitingOtherParty': return 'badge-secondary';
      case 'Resolved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  // Which transitions are allowed from a given status
  const getAllowedTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'Open': return ['InReview'];
      case 'InReview': return ['WaitingOtherParty', 'Resolved', 'Rejected'];
      case 'WaitingOtherParty': return ['Resolved', 'Rejected'];
      default: return [];
    }
  };

  return (
    <ModLayout>
      <div className="admin-orders-page">
        <div className="admin-page-header">
          <div>
            <h1>Report Management</h1>
            <p>Review and resolve user reports</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={fetchReports} disabled={loading}>
            <RefreshCcw size={18} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters-section">
          <div className="admin-filter-group">
            <Filter size={20} />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
              className="admin-filter-select"
            >
              <option value="All">All Status</option>
              {REPORT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>Reports</h4>
            <span className="admin-results-count">Total: {pagination.total}</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Order ID</th>
                  <th>Reporter ID</th>
                  <th>Target ID</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.reportId}>
                      <td><strong>#{report.reportId}</strong></td>
                      <td>{report.orderId ? `#${report.orderId}` : '-'}</td>
                      <td>{report.reporterId || '-'}</td>
                      <td>{report.targetUserId || '-'}</td>
                      <td style={{maxWidth: 180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {report.reason || '-'}
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="admin-actions">
                        <button className="admin-action-icon view" title="View Details"
                          onClick={() => handleViewDetail(report)}>
                          <Eye size={18} />
                        </button>
                        {getAllowedTransitions(report.status).length > 0 && (
                          <button className="admin-action-icon edit" title="Update Status"
                            onClick={() => openResolveModal(report)}>
                            <ChevronRight size={18} />
                          </button>
                        )}
                        {report.reporterId && (
                          <button className="admin-action-icon view" title="Notify Reporter"
                            onClick={() => {
                              setNotifyTarget({ userId: report.reporterId, userName: `User #${report.reporterId}` });
                              setNotifyModalOpen(true);
                            }}>
                            <Bell size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="admin-empty-state"><p>No reports found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-pagination-btn" disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</button>
            <span className="admin-pagination-info">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button className="admin-pagination-btn" disabled={reports.length < pagination.limit}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="admin-modal-header">
              <h3>Report #{selectedReport.reportId}</h3>
              <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}><X size={24} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                <div><strong>Order ID:</strong> {selectedReport.orderId || '-'}</div>
                <div><strong>Listing ID:</strong> {selectedReport.listingId || '-'}</div>
                <div><strong>Reporter:</strong> #{selectedReport.reporterId}</div>
                <div><strong>Target User:</strong> #{selectedReport.targetUserId}</div>
                <div><strong>Status:</strong> <span className={`admin-badge ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></div>
                <div><strong>Waiting For:</strong> {selectedReport.waitingForUserId ? `User #${selectedReport.waitingForUserId}` : '-'}</div>
                <div style={{gridColumn: '1 / -1'}}><strong>Created:</strong> {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : '-'}</div>
              </div>

              <div style={{marginTop:'1rem'}}>
                <strong>Reason:</strong>
                <p style={{marginTop:'0.25rem', color:'#475569', whiteSpace:'pre-wrap'}}>{selectedReport.reason || '-'}</p>
              </div>

              {selectedReport.evidenceUrls && selectedReport.evidenceUrls.length > 0 && (
                <div style={{marginTop:'1rem'}}>
                  <strong>Evidence:</strong>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:'0.5rem'}}>
                    {selectedReport.evidenceUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`evidence-${i}`}
                          style={{width:80, height:80, objectFit:'cover', borderRadius:6, border:'1px solid #e2e8f0'}} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              {getAllowedTransitions(selectedReport.status).length > 0 && (
                <button className="admin-btn admin-btn-primary" onClick={() => openResolveModal(selectedReport)}>
                  Update Status
                </button>
              )}
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && resolveReport && (
        <div className="admin-modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <div className="admin-modal-header">
              <h3>Update Report #{resolveReport.reportId}</h3>
              <button className="admin-modal-close" onClick={() => setShowResolveModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{marginBottom: '1rem'}}>
                <div style={{marginBottom:'0.5rem', fontSize:'0.85rem', color:'#64748b'}}>
                  Current status: <span className={`admin-badge ${getStatusColor(resolveReport.status)}`}>{resolveReport.status}</span>
                </div>
              </div>

              <div style={{marginBottom: '1rem'}}>
                <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>New Status *</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, status: e.target.value, waitingForRole: '', decision: '' }))}
                  style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem'}}
                >
                  <option value="">-- Select --</option>
                  {getAllowedTransitions(resolveReport.status).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* WaitingOtherParty → select role */}
              {resolveForm.status === 'WaitingOtherParty' && (
                <div style={{marginBottom: '1rem'}}>
                  <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Waiting For *</label>
                  <select
                    value={resolveForm.waitingForRole}
                    onChange={(e) => setResolveForm(prev => ({ ...prev, waitingForRole: e.target.value }))}
                    style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem'}}
                  >
                    <option value="">-- Select --</option>
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>
              )}

              {/* Resolved → select decision */}
              {resolveForm.status === 'Resolved' && (
                <div style={{marginBottom: '1rem'}}>
                  <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Decision *</label>
                  <select
                    value={resolveForm.decision}
                    onChange={(e) => setResolveForm(prev => ({ ...prev, decision: e.target.value }))}
                    style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem'}}
                  >
                    <option value="">-- Select --</option>
                    <option value="RefundBuyer">Refund Buyer</option>
                    <option value="ReleaseSeller">Release to Seller</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{display:'block', fontWeight: 500, marginBottom: '0.35rem', fontSize: '0.875rem'}}>Note (optional)</label>
                <textarea
                  value={resolveForm.note}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note..."
                  rows={3}
                  style={{width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', fontFamily:'inherit', resize:'vertical'}}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleResolveSubmit} disabled={!resolveForm.status}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={notifyTarget.userId}
        userName={notifyTarget.userName}
        defaultType="report"
      />
    </ModLayout>
  );
}
