import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getMyReports, replyReport } from "../../service/home/api.report";
import { formatDate } from "../../utils/utils";
import useAuth from "../../context/UseAuth";
import { Loader2, ShoppingBag, FileWarning, Send, Image, ChevronDown, ChevronUp } from "lucide-react";
import "./MyReports.css";

const STATUS_MAP = {
  Pending: { label: "Chờ xử lý", className: "status-pending" },
  WaitingForReply: { label: "Chờ phản hồi", className: "status-waiting" },
  InProgress: { label: "Đang xử lý", className: "status-progress" },
  Resolved: { label: "Đã giải quyết", className: "status-resolved" },
  Rejected: { label: "Từ chối", className: "status-rejected" },
};

const PAGE_SIZE = 10;

export default function MyReports() {
  const toast = useToast();
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reply state
  const [replyingId, setReplyingId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Evidence expand state
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const fetchReports = useCallback(async (skip = 0, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const data = await getMyReports(skip, PAGE_SIZE);
      setTotal(data.total);
      setReports((prev) => (append ? [...prev, ...data.items] : data.items));
    } catch {
      toast.error("Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReply = async (reportId) => {
    if (!replyMessage.trim()) return;
    try {
      setReplySending(true);
      await replyReport(reportId, replyMessage.trim());
      toast.success("Đã gửi phản hồi thành công!");
      setReplyingId(null);
      setReplyMessage("");
      // Refresh to update status
      fetchReports();
    } catch {
      toast.error("Không thể gửi phản hồi");
    } finally {
      setReplySending(false);
    }
  };

  const toggleEvidence = (reportId) => {
    setExpandedEvidence((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const getStatusInfo = (status) => {
    return STATUS_MAP[status] || { label: status || "Không rõ", className: "status-default" };
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="reports-page">
          <div className="reports-header">
            <h1>Phiếu báo cáo của tôi</h1>
          </div>
          <div className="reports-loading">
            <Loader2 size={36} />
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="reports-page">
        <div className="reports-header">
          <h1>Phiếu báo cáo của tôi</h1>
          <p>Theo dõi tình trạng các phiếu báo cáo bạn đã gửi</p>
        </div>

        {reports.length === 0 ? (
          <div className="reports-empty">
            <FileWarning size={48} className="reports-empty-icon" />
            <h3>Chưa có báo cáo nào</h3>
            <p>Bạn có thể báo cáo người bán từ chi tiết đơn hàng nếu gặp vấn đề.</p>
          </div>
        ) : (
          <>
            <div className="reports-summary">
              Tổng cộng <strong>{total}</strong> phiếu báo cáo
            </div>

            <div className="reports-list">
              {reports.map((report) => {
                const statusInfo = getStatusInfo(report.status);
                const hasEvidence = report.evidenceUrls && report.evidenceUrls.length > 0;
                const isExpanded = expandedEvidence[report.reportId];
                const needsReply = report.waitingForUserId === user?.userId;

                return (
                  <div key={report.reportId} className={`report-card ${needsReply ? "report-card-needs-reply" : ""}`}>
                    {/* Header */}
                    <div className="report-card-header">
                      <div className="report-card-id">
                        <span className="report-id-label">Phiếu #</span>
                        <span className="report-id-value">{report.reportId}</span>
                      </div>
                      <span className={`report-status-badge ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="report-reason">
                      <span className="report-reason-label">Lý do:</span>
                      <p className="report-reason-text">{report.reason || "Không có lý do"}</p>
                    </div>

                    {/* Evidence */}
                    {hasEvidence && (
                      <div className="report-evidence">
                        <button
                          className="report-evidence-toggle"
                          onClick={() => toggleEvidence(report.reportId)}
                        >
                          <Image size={14} />
                          Bằng chứng ({report.evidenceUrls.length})
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="report-evidence-gallery">
                            {report.evidenceUrls.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="report-evidence-item">
                                <img src={url} alt={`Bằng chứng ${idx + 1}`} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reply prompt */}
                    {needsReply && (
                      <div className="report-reply-prompt">
                        <div className="report-reply-notice">
                          ⚠️ Phiếu này đang chờ phản hồi từ bạn
                        </div>
                        {replyingId === report.reportId ? (
                          <div className="report-reply-form">
                            <textarea
                              className="report-reply-input"
                              placeholder="Nhập nội dung phản hồi..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={3}
                            />
                            <div className="report-reply-actions">
                              <button
                                className="report-reply-cancel"
                                onClick={() => { setReplyingId(null); setReplyMessage(""); }}
                                disabled={replySending}
                              >
                                Hủy
                              </button>
                              <button
                                className="report-reply-submit"
                                onClick={() => handleReply(report.reportId)}
                                disabled={replySending || !replyMessage.trim()}
                              >
                                {replySending ? "Đang gửi..." : <><Send size={14} /> Gửi phản hồi</>}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="report-reply-btn"
                            onClick={() => { setReplyingId(report.reportId); setReplyMessage(""); }}
                          >
                            <Send size={14} /> Phản hồi ngay
                          </button>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="report-card-footer">
                      <Link to={`/orders/${report.orderId}`} className="report-order-link">
                        <ShoppingBag size={14} />
                        Đơn hàng #{report.orderId}
                      </Link>
                      <span className="report-date">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {reports.length < total && (
              <div className="reports-load-more">
                <button
                  className="reports-load-more-btn"
                  onClick={() => fetchReports(reports.length, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
