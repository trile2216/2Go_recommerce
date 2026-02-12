import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getOrderById, cancelOrder, confirmOrder, completeOrder } from "../../service/home/api.order";
import { createReport } from "../../service/home/api.report";
import { createRating } from "../../service/home/api.rating";
import { uploadImageAndGetUrl, uploadVideoAndGetUrl } from "../../service/upload/api.upload";
import CreateShippingModal from "../../components/CreateShippingModal";
import OrderStatusStepper, { getStatusLabel } from "../../components/OrderStatusStepper";
import useAuth from "../../context/UseAuth";
import { formatPrice, formatDate, getOrderStatusColor } from "../../utils/utils";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Loader2,
  Truck,
  XCircle,
  CreditCard,
  ExternalLink,
  Info,
  Store,
  ShoppingBag,
  Package,
  Flag,
  X,
  ImagePlus,
  Trash2,
  Star
} from "lucide-react";
import "./OrderDetail.css";
import PageEmptyState from "../../components/PageEmptyState";



export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportFiles, setReportFiles] = useState([]);
  const [reportUploading, setReportUploading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingHover, setRatingHover] = useState(0);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      setActionLoading(true);
      const result = await cancelOrder(order.orderId);
      toast.success(result.message || "Đã hủy đơn hàng");
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Hủy đơn hàng thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const result = await confirmOrder(order.orderId);
      toast.success(result.message || "Đã xác nhận đơn hàng");
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xác nhận đơn hàng thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      const result = await completeOrder(order.orderId);
      toast.success(result.message || "Đã hoàn thành đơn hàng");
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Hoàn thành đơn hàng thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = () => {
    setReportReason("");
    setReportFiles([]);
    setShowReportModal(true);
  };

  const handleReportFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    }));
    setReportFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeReportFile = (index) => {
    setReportFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do báo cáo");
      return;
    }
    try {
      setActionLoading(true);

      // Upload evidence files
      let evidenceUrls = [];
      if (reportFiles.length > 0) {
        setReportUploading(true);
        const imageFiles = reportFiles.filter((f) => f.type === "image").map((f) => f.file);
        const videoFiles = reportFiles.filter((f) => f.type === "video").map((f) => f.file);

        if (imageFiles.length > 0) {
          const urls = await uploadImageAndGetUrl(imageFiles);
          evidenceUrls.push(...(Array.isArray(urls) ? urls : [urls]));
        }
        if (videoFiles.length > 0) {
          const urls = await uploadVideoAndGetUrl(videoFiles);
          evidenceUrls.push(...(Array.isArray(urls) ? urls : [urls]));
        }
        setReportUploading(false);
      }

      await createReport({
        orderId: order.orderId,
        targetUserId: order.sellerId,
        reason: reportReason,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : null,
      });
      toast.success("Đã gửi báo cáo thành công!");
      setShowReportModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi báo cáo thất bại");
    } finally {
      setActionLoading(false);
      setReportUploading(false);
    }
  };

  const handleRating = () => {
    setRatingScore(0);
    setRatingComment("");
    setRatingHover(0);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (ratingScore < 1 || ratingScore > 5) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }
    try {
      setActionLoading(true);
      await createRating({
        orderId: order.orderId,
        score: ratingScore,
        comment: ratingComment || null,
      });
      toast.success("Đánh giá thành công!");
      setShowRatingModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || "Đánh giá thất bại");
    } finally {
      setActionLoading(false);
    }
  };



  if (loading) {
    return (
      <UserLayout>
        <PageEmptyState 
          icon={<Loader2 size={48} className="spin text-blue-500" />}
          title="Đang tải thông tin đơn hàng..."
          description="Vui lòng đợi trong giây lát"
        />
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout>
        <PageEmptyState 
          icon={<Package size={48} className="text-gray-400" />}
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa"
          actionLabel="Quay lại danh sách"
          actionTo="/orders"
        />
      </UserLayout>
    );
  }

  const isBuyer = user?.userId === order.buyerId;
  const isSeller = user?.userId === order.sellerId;

  const buyerCanCancel = isBuyer && (order.status === "Pending" || order.status === "Paid");
  const sellerCanCancel = isSeller && (order.status === "Pending" || order.status === "Paid");

  const sellerCanConfirm = isSeller && (order.status === "Pending" || order.status === "Paid");
  const buyerCanComplete = isBuyer && (order.status === "Confirmed" || order.status === "Shipping");

  const hasCheckoutUrl = isBuyer && order.status === "Pending" && order.checkoutUrl;
  const sellerCanCreateShipping = isSeller && order.status === "Confirmed" && order.paymentMethod === "PAYOS";

  return (
    <UserLayout>
      <div className="order-detail-container">
        <button className="od-back-button" onClick={() => navigate("/orders")}>
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>

        <div className="order-detail-content">
          {/* Order Header / Title */}
          <div className="order-card">
            <div className="od-card-header">
              <h2 className="od-card-title">
                {isBuyer ? <ShoppingBag size={20} /> : <Store size={20} />}
                {isBuyer ? "Chi tiết đơn mua" : "Chi tiết đơn bán"} #{order.orderCode}
              </h2>
              <span className={`order-status ${getOrderStatusColor(order.status)}`}>
                {getStatusLabel(order.status, order.paymentMethod)}
              </span>
            </div>
          </div>

          <div className="order-layout-split">
            {/* Left Column: Product & Payment Info */}
            <div className="order-left-col">
              <div className="order-card">
                <div className="od-card-header">
                   <h3 className="od-card-subtitle">Thông tin sản phẩm</h3>
                </div>
                <div className="od-card-body">
                  <div className="detail-product-info">
                    <div className="detail-product-details">
                      <h3 className="detail-product-title">
                        {order.listingTitle || `Đơn hàng #${order.orderCode}`}
                      </h3>
                      <p className="detail-product-price">
                        {formatPrice(order.totalAmount || order.listingPrice)}
                      </p>
                      <div className="detail-row">
                        <Calendar size={16} className="text-gray-400" />
                        <span>Ngày đặt: {formatDate(order.createdAt)}</span>
                      </div>
                      <div className="detail-row">
                        <CreditCard size={16} className="text-gray-400" />
                        <span>
                          Phương thức: {order.paymentMethod === "PAYOS" ? "Thanh toán Online" : "COD"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

               {/* Partner Info */}
               <div className="order-card">
                 <div className="od-card-header">
                   <h3 className="od-card-subtitle">
                     {isBuyer ? "Thông tin người bán" : "Thông tin người mua"}
                   </h3>
                 </div>
                 <div className="od-card-body">
                    {isBuyer && (
                      <div className="party-details">
                         <div className="party-item">
                           <Store size={18} className="party-icon" />
                           <div className="party-info-text">
                              <p className="party-label">Người bán</p>
                              {/* Displaying name if available or email */}
                              <p className="party-value">{order.sellerEmail || `User #${order.sellerId}`}</p> 
                           </div>
                         </div>
                         {order.sellerPhone && (
                           <div className="party-item">
                             <MapPin size={18} className="party-icon" />
                             <div className="party-info-text">
                                <p className="party-label">Liên hệ</p>
                                <p className="party-value">{order.sellerPhone}</p>
                             </div>
                           </div>
                         )}
                      </div>
                    )}

                    {isSeller && (
                      <div className="party-details">
                         <div className="party-item">
                           <User size={18} className="party-icon" />
                           <div className="party-info-text">
                              <p className="party-label">Người mua</p>
                              <p className="party-value">{order.buyerEmail || `User #${order.buyerId}`}</p>
                           </div>
                         </div>
                         <div className="party-item">
                             <MapPin size={18} className="party-icon" />
                             <div className="party-info-text">
                                <p className="party-label">Địa chỉ giao hàng</p>
                                <p className="party-value">{order.deliveryAddress || "Chưa cung cấp"}</p>
                             </div>
                         </div>
                         {order.buyerPhone && (
                           <div className="party-item">
                             <MapPin size={18} className="party-icon" />
                             <div className="party-info-text">
                                <p className="party-label">Điện thoại</p>
                                <p className="party-value">{order.buyerPhone}</p>
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
               </div>
            </div>

            {/* Right Column: Status & Actions */}
            <div className="order-right-col">
              <div className="order-card">
                 <div className="od-card-header">
                   <h3 className="od-card-subtitle">Trạng thái & Thao tác</h3>
                 </div>
                 <div className="od-card-body">
                    <OrderStatusStepper currentStatus={order.status} paymentMethod={order.paymentMethod} />

                    {isSeller && order.paymentMethod === "PAYOS" && ["Confirmed", "Shipping", "Completed"].includes(order.status) && (
                      <div className="od-info-banner">
                        <Info size={16} />
                        <span>Tiền sẽ được chuyển vào tài khoản của bạn trong 3-5 ngày làm việc sau khi đơn hàng hoàn thành.</span>
                      </div>
                    )}

                    <div className="od-actions-wrapper">
                        {/* PAY BUTTON for Buyer */}
                        {hasCheckoutUrl && (
                          <div className="action-group">
                            <a
                              href={order.checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="od-action-button primary-button"
                            >
                              <ExternalLink size={16} />
                              Thanh toán ngay
                            </a>
                            {order.paymentExpiredAt && (
                              <p className="payment-expiry">
                                Hết hạn: {formatDate(order.paymentExpiredAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* CONFIRM for Seller */}
                        {sellerCanConfirm && (
                           <button
                             className="od-action-button primary-button"
                             onClick={handleConfirm}
                             disabled={actionLoading}
                           >
                             <CheckCircle2 size={16} />
                             {actionLoading ? "Đang xử lý..." : "Xác nhận đơn hàng"}
                           </button>
                        )}

                        {/* CREATE SHIPPING for Seller (Confirmed + PayOS) */}
                        {sellerCanCreateShipping && (
                           <button
                             className="od-action-button primary-button"
                             onClick={() => setShowShippingModal(true)}
                             disabled={actionLoading}
                           >
                             <Truck size={16} />
                             Tạo đơn vận chuyển
                           </button>
                        )}

                        {/* COMPLETE for Buyer */}
                        {buyerCanComplete && (
                           <button
                             className="od-action-button success-button"
                             onClick={handleComplete}
                             disabled={actionLoading}
                           >
                             <CheckCircle2 size={16} />
                             {actionLoading ? "Đang xử lý..." : "Đã nhận được hàng"}
                           </button>
                        )}

                        {/* CANCEL for Buyer */}
                        {buyerCanCancel && (
                           <button
                             className="od-action-button danger-button"
                             onClick={handleCancel}
                             disabled={actionLoading}
                           >
                             <XCircle size={16} />
                             {actionLoading ? "Đang xử lý..." : "Hủy đơn hàng"}
                           </button>
                        )}

                        {/* CANCEL for Seller */}
                        {sellerCanCancel && (
                           <button
                             className="od-action-button danger-button"
                             onClick={handleCancel}
                             disabled={actionLoading}
                           >
                             <XCircle size={16} />
                             {actionLoading ? "Đang xử lý..." : "Hủy đơn hàng này"}
                           </button>
                        )}
                        
                        {/* RATING for Buyer (Completed orders) */}
                        {isBuyer && order.status === "Completed" && (
                           <button
                             className="od-action-button primary-button"
                             onClick={handleRating}
                             disabled={actionLoading}
                           >
                             <Star size={16} />
                             Đánh giá người bán
                           </button>
                        )}

                        {/* REPORT for Buyer (Completed orders) */}
                        {isBuyer && order.status === "Completed" && (
                           <button
                             className="od-action-button warning-button"
                             onClick={handleReport}
                             disabled={actionLoading}
                           >
                             <Flag size={16} />
                             {actionLoading ? "Đang xử lý..." : "Báo cáo sản phẩm"}
                           </button>
                        )}

                       
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShippingModal && (
        <CreateShippingModal
          order={order}
          user={user}
          toast={toast}
          onClose={() => setShowShippingModal(false)}
          onSuccess={fetchOrder}
        />
      )}

      {showReportModal && (
        <div className="shipping-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="shipping-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="sm-header">
              <h3><Flag size={20} /> Báo cáo sản phẩm</h3>
              <button className="sm-close-btn" onClick={() => setShowReportModal(false)}><X size={20} /></button>
            </div>
            <div className="sm-body">
              <div className="sm-section">
                <h4 className="sm-section-title">Lý do báo cáo</h4>
                <textarea
                  className="sm-input"
                  rows={4}
                  placeholder="Mô tả lý do báo cáo sản phẩm của bạn..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="sm-section">
                <h4 className="sm-section-title"><ImagePlus size={16} /> Bằng chứng (ảnh/video)</h4>
                <label className="sm-btn sm-btn-outline" style={{ width: "100%", cursor: "pointer" }}>
                  <ImagePlus size={16} /> Chọn ảnh hoặc video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleReportFileChange}
                    style={{ display: "none" }}
                  />
                </label>
                {reportFiles.length > 0 && (
                  <div className="report-evidence-preview">
                    {reportFiles.map((f, i) => (
                      <div key={i} className="evidence-item">
                        {f.type === "image" ? (
                          <img src={f.preview} alt={`Evidence ${i + 1}`} />
                        ) : (
                          <video src={f.preview} />
                        )}
                        <button className="evidence-remove" onClick={() => removeReportFile(i)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sm-footer">
              <button className="sm-btn sm-btn-secondary" onClick={() => setShowReportModal(false)} disabled={actionLoading}>
                Hủy
              </button>
              <button className="sm-btn sm-btn-primary" style={{ backgroundColor: "#b45309" }} onClick={submitReport} disabled={actionLoading || !reportReason.trim()}>
                <Flag size={16} />
                {reportUploading ? "Đang tải file..." : actionLoading ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className="shipping-modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="shipping-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="sm-header">
              <h3><Star size={20} /> Đánh giá người bán</h3>
              <button className="sm-close-btn" onClick={() => setShowRatingModal(false)}><X size={20} /></button>
            </div>
            <div className="sm-body">
              <div className="sm-section">
                <h4 className="sm-section-title">Chấm điểm</h4>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${star <= (ratingHover || ratingScore) ? "active" : ""}`}
                      onClick={() => setRatingScore(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                    >
                      <Star size={32} fill={star <= (ratingHover || ratingScore) ? "#f59e0b" : "none"} />
                    </button>
                  ))}
                </div>
                <p className="rating-label">
                  {ratingScore === 1 && "Rất tệ"}
                  {ratingScore === 2 && "Tệ"}
                  {ratingScore === 3 && "Bình thường"}
                  {ratingScore === 4 && "Tốt"}
                  {ratingScore === 5 && "Rất tốt"}
                </p>
              </div>
              <div className="sm-section">
                <h4 className="sm-section-title">Nhận xét (tuỳ chọn)</h4>
                <textarea
                  className="sm-input"
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm của bạn với người bán..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="sm-footer">
              <button className="sm-btn sm-btn-secondary" onClick={() => setShowRatingModal(false)} disabled={actionLoading}>
                Hủy
              </button>
              <button className="sm-btn sm-btn-primary" onClick={submitRating} disabled={actionLoading || ratingScore === 0}>
                <Star size={16} />
                {actionLoading ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
