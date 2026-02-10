import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getMyOrders } from "../../service/home/api.order";
import { Package, Loader2 } from "lucide-react";
import "./Order.css";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const getStatusColor = (status) => {
  const colors = {
    Pending: "status-warning",
    Paid: "status-info",
    Confirmed: "status-info",
    Shipping: "status-info",
    Completed: "status-success",
    Cancelled: "status-danger",
  };
  return colors[status] || "status-default";
};

function OrderCard({ order }) {
  const navigate = useNavigate();

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="order-card">
      <div className="order-card-content">
        <div className="order-card-info">
          <h3 className="order-card-title">
            {order.listingTitle || `Đơn hàng #${order.orderCode}`}
          </h3>
          <p className="order-card-price">
            {formatPrice(order.totalAmount || order.listingPrice)}
          </p>
          <p className="order-card-date">{formatDate(order.createdAt)}</p>
          <p className="order-card-method">
            {order.paymentMethod === "PayOS" ? "Thanh toán online" : "COD"}
          </p>
        </div>
        <div className="order-card-actions">
          <span className={`order-status ${getStatusColor(order.status)}`}>
            {STATUS_MAP[order.status] || order.status}
          </span>
          <button
            className="order-detail-btn"
            onClick={() => navigate(`/order/${order.orderId}`)}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Package size={64} />
      </div>
      <h3 className="empty-state-title">Bạn chưa có đơn hàng nào</h3>
      <p className="empty-state-description">
        Hãy khám phá và mua sắm những sản phẩm yêu thích
      </p>
      <button className="empty-state-btn" onClick={() => navigate("/listings")}>
        Khám phá sản phẩm
      </button>
    </div>
  );
}

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const take = 20;

  const fetchOrders = async (currentSkip = 0) => {
    try {
      setLoading(true);
      const data = await getMyOrders(currentSkip, take);
      if (currentSkip === 0) {
        setOrders(data.items || []);
      } else {
        setOrders((prev) => [...prev, ...(data.items || [])]);
      }
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(0);
  }, []);

  const handleLoadMore = () => {
    const newSkip = skip + take;
    setSkip(newSkip);
    fetchOrders(newSkip);
  };

  return (
    <UserLayout>
      <div className="order-header">
        <h1 className="order-title">Đơn hàng của tôi</h1>
        <p className="order-subtitle">Quản lý các đơn hàng mua của bạn</p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="order-loading">
          <Loader2 size={32} className="spin" />
          <p>Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
          {orders.length < total && (
            <div className="load-more-container">
              <button
                className="order-load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </UserLayout>
  );
}
