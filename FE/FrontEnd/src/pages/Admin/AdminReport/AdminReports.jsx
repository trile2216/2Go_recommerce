import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, CheckCircle, XCircle, AlertTriangle, FileText, Bell } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { getReports, getReportById, resolveReport } from '../../../service/admin/api.admin.report';
import { useToast } from '../../../context/ToastContext';
import SendNotificationModal from '../../../components/Admin/SendNotificationModal';
import './admin-reports.css'; 


export default function AdminReports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveFormData, setResolveFormData] = useState({
    status: 'Resolved',
    decision: '',
    note: ''
  });

  // Notification Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState({ userId: null, userName: '', defaultTitle: '', defaultMessage: '' });

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
      
      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }

      const data = await getReports(params);
      setReports(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      const data = await getReportById(id);
      setSelectedReport(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Failed to load report details');
    }
  };

  const openResolveModal = (report) => {
    // Check if report is already processed to maybe show existing resolution or block re-resolution if needed
    // For now, allow resolving pending reports
    setSelectedReport(report);
    setResolveFormData({
      status: 'Resolved',
      decision: '', // e.g., "Ban User", "Delete Listing"
      note: ''
    });
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async () => {
    if (!selectedReport) return;

    try {
      await resolveReport(selectedReport.reportId, resolveFormData);
      toast.success('Report resolved successfully');
      setShowResolveModal(false);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'Resolved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'TicketClosed': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="admin-products-page"> {/* Reuse existing class for layout */}
        {/* Filters */}
        <div className="admin-filters-section">
          <div className="admin-search-wrapper">
            <Search size={20} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search reports..."
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
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="TicketClosed">Ticket Closed</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>All Reports</h4>
            <span className="admin-results-count">
              Total: {pagination.total}
            </span>
          </div>

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading reports...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Reporter</th>
                    <th>Target Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <tr key={report.reportId}>
                        <td>#{report.reportId}</td>
                        <td>
                          <div className="admin-user-info">
                            <span className="admin-user-name">{report.reporterName || 'Unknown'}</span>
                            <span className="admin-user-email" style={{fontSize: '0.8rem', color: '#9ca3af'}}>{report.reporterEmail}</span>
                          </div>
                        </td>
                        <td>
                          {report.targetId ? (
                             <span className="admin-badge badge-info">
                               Listing #{report.targetId}
                             </span>
                          ) : (
                              <span className="admin-badge badge-secondary">User</span>
                          )}
                        </td>
                        <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {report.reason}
                        </td>
                        <td>
                          <span className={`admin-badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                        <td>{formatDate(report.createdAt)}</td>
                        <td className="admin-actions">
                          <button 
                            className="admin-action-icon view"
                            onClick={() => handleViewReport(report.reportId)}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {report.status === 'Pending' && (
                             <button 
                                className="admin-action-icon edit"
                                onClick={() => openResolveModal(report)}
                                title="Resolve Report"
                              >
                                <CheckCircle size={18} />
                              </button>
                          )}
                          <button 
                            className="admin-action-icon view"
                            title="Notify Reporter"
                            onClick={() => {
                              setNotifyTarget({
                                userId: report.reporterId || report.userId,
                                userName: report.reporterName || `User`,
                                defaultTitle: `Report #${report.reportId} Update`,
                                defaultMessage: `Regarding your report #${report.reportId}`
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
                        <p>No reports found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                disabled={reports.length < pagination.limit} 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
                Next
            </button>
          </div>
        </div>

        {/* View Detail Modal */}
        {showDetailModal && selectedReport && (
          <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Report Details #{selectedReport.reportId}</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-modal-info">
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Status:</span>
                      <span className={`admin-badge ${getStatusBadgeClass(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Created At:</span>
                      <span className="admin-modal-value">{formatDate(selectedReport.createdAt)}</span>
                    </div>
                    
                    <h4 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: '#374151'}}>Reporter Info</h4>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Name:</span>
                      <span className="admin-modal-value">{selectedReport.reporterName}</span>
                    </div>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Email:</span>
                      <span className="admin-modal-value">{selectedReport.reporterEmail}</span>
                    </div>

                    <h4 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: '#374151'}}>Report Content</h4>
                    <div className="admin-modal-row">
                      <span className="admin-modal-label">Target ID:</span>
                      <span className="admin-modal-value">{selectedReport.targetId || 'N/A'}</span>
                    </div>
                    <div className="admin-modal-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                      <span className="admin-modal-label">Reason:</span>
                      <p className="admin-modal-value" style={{marginTop: '0.5rem', textAlign: 'left'}}>{selectedReport.reason}</p>
                    </div>

                    {selectedReport.details && (
                        <div className="admin-modal-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                            <span className="admin-modal-label">Additional Details:</span>
                            <p className="admin-modal-value" style={{marginTop: '0.5rem', textAlign: 'left'}}>{selectedReport.details}</p>
                        </div>
                    )}
                    
                    {selectedReport.resolvedAt && (
                        <>
                            <h4 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: '#374151'}}>Resolution</h4>
                            <div className="admin-modal-row">
                                <span className="admin-modal-label">Resolved At:</span>
                                <span className="admin-modal-value">{formatDate(selectedReport.resolvedAt)}</span>
                            </div>
                            <div className="admin-modal-row">
                                <span className="admin-modal-label">Decision:</span>
                                <span className="admin-modal-value">{selectedReport.decision}</span>
                            </div>
                            <div className="admin-modal-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                                <span className="admin-modal-label">Admin Note:</span>
                                <p className="admin-modal-value" style={{marginTop: '0.5rem', textAlign: 'left'}}>{selectedReport.note || 'No note provided'}</p>
                            </div>
                        </>
                    )}
                </div>
              </div>
              <div className="admin-modal-footer">
                {selectedReport.status === 'Pending' && (
                     <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => {
                            setShowDetailModal(false);
                            openResolveModal(selectedReport);
                        }}
                     >
                        Resolve This Report
                     </button>
                )}
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="admin-modal-overlay" onClick={() => setShowResolveModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Resolve Report #{selectedReport?.reportId}</h3>
                <button 
                  className="admin-modal-close"
                  onClick={() => setShowResolveModal(false)}
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Resolution Status</label>
                  <select
                    className="admin-input"
                    value={resolveFormData.status}
                    onChange={(e) => setResolveFormData({...resolveFormData, status: e.target.value})}
                  >
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="TicketClosed">Ticket Closed</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Decision (Action Taken)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Warning sent, Listing removed, Ban user..."
                    value={resolveFormData.decision}
                    onChange={(e) => setResolveFormData({...resolveFormData, decision: e.target.value})}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Internal Note</label>
                  <textarea
                    className="admin-input"
                    rows={4}
                    placeholder="Add an internal note about this resolution..."
                    value={resolveFormData.note}
                    onChange={(e) => setResolveFormData({...resolveFormData, note: e.target.value})}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={handleResolveSubmit}
                  disabled={!resolveFormData.decision}
                >
                  Submit Resolution
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        userId={notifyTarget.userId}
        userName={notifyTarget.userName}
        defaultTitle={notifyTarget.defaultTitle}
        defaultMessage={notifyTarget.defaultMessage}
        defaultType="report"
      />
    </AdminLayout>
  );
}
