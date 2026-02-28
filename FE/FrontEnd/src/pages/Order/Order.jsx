import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getMyOrders } from "../../service/home/api.order";
import { Package, Loader2, ShoppingBag, Store } from "lucide-react";
import useAuth from "../../context/UseAuth";
import { useTitle } from "../../hooks/useTitle";
import "./Order.css";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Delivering: "Đang giao hàng",
  Delivered: "Đã giao hàng",  
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  Reserved: "Đang giữ hàng",
};

// Lấy label đúng cho Reserved dựa trên paymentMethod và depositPaid
const getOrderStatusLabel = (order) => {
  if (order.status === 'Reserved') {
    if (order.paymentMethod === 'PAYOS' && order.depositPaid === true) {
      return 'Đã đặt cọc';
    }
    return 'Đang giữ hàng'; 
  }
  return STATUS_MAP[order.status] || order.status;
};

const getStatusColor = (status) => {
  const colors = {
    Pending: "status-warning",
    Paid: "status-info",
    Confirmed: "status-info",
    Delivering: "status-info",
    Delivered: "status-info",
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
            {order.paymentMethod === "PAYOS" ? "Thanh toán online" : "COD"}
          </p>
        </div>
        <div className="order-card-actions">
          <span className={`order-status ${getStatusColor(order.status)}`}>
            {getOrderStatusLabel(order)}
          </span>
          <button
            className="order-detail-btn"
            onClick={() => navigate(`/orders/${order.orderId}`)}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }) {
  const navigate = useNavigate();
  const isBuying = activeTab === "buy";
  
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Package size={64} />
      </div>
      <h3 className="empty-state-title">
        {isBuying ? "Bạn chưa có đơn mua nào" : "Bạn chưa có đơn bán nào"}
      </h3>
      <p className="empty-state-description">
        {isBuying 
          ? "Hãy khám phá và mua sắm những sản phẩm yêu thích"
          : "Đăng bán sản phẩm để tiếp cận người mua ngay hôm nay"}
      </p>
      {isBuying && (
        <button className="empty-state-btn" onClick={() => navigate("/listings")}>
          Khám phá sản phẩm
        </button>
      )}
    </div>
  );
}

export default function Orders() {
  useTitle('My Orders');
  const toast = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("buy"); // 'buy' or 'sell'

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Currently fetching all orders. In a real app with pagination, 
      // we might need to filter on server side or fetch more pages.
      // For now, fetching first 100 to ensure we get a mix.
      const data = await getMyOrders(0, 100); 
      setOrders(data.items || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "buy") {
      return order.buyerId === user?.userId;
    } else {
      return order.sellerId === user?.userId;
    }
  });

  return (
    <UserLayout>
      <div className="order-tabs">
        <div className="tabs-list">
          <button 
            className={`tab-trigger ${activeTab === "buy" ? "active" : ""}`}
            onClick={() => setActiveTab("buy")}
          >
            <ShoppingBag size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Đơn mua
          </button>
          <button 
            className={`tab-trigger ${activeTab === "sell" ? "active" : ""}`}
            onClick={() => setActiveTab("sell")}
          >
            <Store size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Đơn bán
          </button>
        </div>
      </div>

      {loading ? (
        <div className="order-loading">
          <Loader2 size={32} className="spin" />
          <p>Đang tải đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </UserLayout>
  );
}
