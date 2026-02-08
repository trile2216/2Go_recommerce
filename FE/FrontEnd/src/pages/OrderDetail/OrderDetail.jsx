import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getOrderById, cancelOrder, confirmOrder, completeOrder } from "../../service/home/api.order";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import "./OrderDetail.css";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const ORDER_STATUSES = [
  { id: "Pending", label: "Chờ thanh toán", icon: CreditCard },
  { id: "Paid", label: "Đã thanh toán", icon: CheckCircle2 },
  { id: "Confirmed", label: "Đã xác nhận", icon: Package },
  { id: "Shipping", label: "Đang giao", icon: Package },
  { id: "Completed", label: "Hoàn thành", icon: CheckCircle2 },
];

const STATUS_ORDER = ["Pending", "Paid", "Confirmed", "Shipping", "Completed"];

function OrderStatusStepper({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === "Cancelled";

  if (isCancelled) {
    return (
      <div className="order-status-stepper">
        <div className="cancelled-status">
          <XCircle size={32} />
          <p>Đơn hàng đã bị hủy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-stepper">
      <div className="progress-line-container">
        <div className="progress-line-background">
          <div
            className="progress-line-fill"
            style={{ width: `${(currentIdx / (ORDER_STATUSES.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="status-steps">
        {ORDER_STATUSES.map((status, index) => {
          const isCompleted = index <= currentIdx;
          const isCurrent = index === currentIdx;
          return (
            <div key={status.id} className="status-step">
              <div className={`status-icon ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
              <p className={`od-status-label ${isCompleted ? "active" : ""}`}>
                {status.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (loading) {
    return (
      <UserLayout>
        <div className="order-detail-error">
          <div className="error-content">
            <Loader2 size={32} className="spin" />
            <p>Đang tải...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout>
        <div className="order-detail-error">
          <div className="error-content">
            <h2 className="error-title">Không tìm thấy đơn hàng</h2>
            <button className="error-button" onClick={() => navigate("/orders")}>
              Quay lại
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const canCancel = order.status === "Pending" || order.status === "Paid";
  const canConfirm = order.status === "Paid";
  const canComplete = order.status === "Confirmed" || order.status === "Shipping";
  const hasCheckoutUrl = order.status === "Pending" && order.checkoutUrl;

  return (
    <UserLayout>
      <div className="order-detail-container">
        <button className="od-back-button" onClick={() => navigate("/orders")}>
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="order-detail-content">
          {/* Order Information */}
          <div className="order-card">
            <div className="od-card-header">
              <h2 className="od-card-title">
                <Package size={20} />
                Thông tin đơn hàng #{order.orderCode}
              </h2>
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
                  <div className="detail-product-date">
                    <Calendar size={16} />
                    <span>Ngày đặt: {formatDate(order.createdAt)}</span>
                  </div>
                  <div className="detail-product-date">
                    <CreditCard size={16} />
                    <span>
                      Thanh toán: {order.paymentMethod === "PayOS" ? "Online (PayOS)" : "COD"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="od-separator" />

              {/* Buyer / Seller Info */}
              <div className="party-info">
                {order.buyerEmail && (
                  <div className="party-details">
                    <h4 className="party-title">
                      <User size={16} />
                      Người mua
                    </h4>
                    <div className="party-item">
                      <User size={16} className="party-icon" />
                      <div>
                        <p className="party-label">Email</p>
                        <p className="party-value">{order.buyerEmail}</p>
                      </div>
                    </div>
                    {order.buyerPhone && (
                      <div className="party-item">
                        <MapPin size={16} className="party-icon" />
                        <div>
                          <p className="party-label">SĐT</p>
                          <p className="party-value">{order.buyerPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {order.sellerEmail && (
                  <div className="party-details">
                    <h4 className="party-title">
                      <User size={16} />
                      Người bán
                    </h4>
                    <div className="party-item">
                      <User size={16} className="party-icon" />
                      <div>
                        <p className="party-label">Email</p>
                        <p className="party-value">{order.sellerEmail}</p>
                      </div>
                    </div>
                    {order.sellerPhone && (
                      <div className="party-item">
                        <MapPin size={16} className="party-icon" />
                        <div>
                          <p className="party-label">SĐT</p>
                          <p className="party-value">{order.sellerPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Status */}
          <div className="order-card">
            <div className="od-card-header">
              <h2 className="od-card-title">Trạng thái đơn hàng</h2>
            </div>
            <div className="od-card-body">
              <OrderStatusStepper currentStatus={order.status} />

              {/* PayOS checkout link for pending orders */}
              {hasCheckoutUrl && (
                <div className="action-button-container">
                  <a
                    href={order.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="od-action-button review-button"
                  >
                    <ExternalLink size={16} />
                    Thanh toán ngay
                  </a>
                  {order.paymentExpiredAt && (
                    <p className="payment-expiry">
                      Hết hạn thanh toán: {formatDate(order.paymentExpiredAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-button-container">
                {canCancel && (
                  <button
                    className="od-action-button cancel-button"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    {actionLoading ? "Đang xử lý..." : "Hủy đơn"}
                  </button>
                )}
                {canConfirm && (
                  <button
                    className="od-action-button review-button"
                    onClick={handleConfirm}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={16} />
                    {actionLoading ? "Đang xử lý..." : "Xác nhận đơn hàng"}
                  </button>
                )}
                {canComplete && (
                  <button
                    className="od-action-button review-button"
                    onClick={handleComplete}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={16} />
                    {actionLoading ? "Đang xử lý..." : "Đã nhận hàng"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
