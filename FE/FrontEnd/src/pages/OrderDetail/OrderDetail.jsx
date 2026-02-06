import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  XCircle
} from "lucide-react";
import "./OrderDetail.css";

// Mock data - sẽ thay thế bằng dữ liệu thật từ database
const MOCK_ORDERS = {
  "1": {
    id: "1",
    title: "iPhone 13 Pro 128GB Vàng",
    price: 15500000,
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400",
    date: "2 ngày trước",
    createdAt: "25/10/2025",
    currentStatus: 3,
    buyer: {
      name: "Trần Văn B",
      address: "Phường Linh Trung, Thủ Đức, TP.HCM"
    }
  },
  "2": {
    id: "2",
    title: "Tủ lạnh Panasonic 180L",
    price: 2490000,
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400",
    date: "1 tuần trước",
    createdAt: "20/10/2025",
    currentStatus: 2,
    buyer: {
      name: "Lê Thị C",
      address: "Phường Bình Chiểu, Thủ Đức, TP.HCM"
    }
  },
  "3": {
    id: "3",
    title: "Laptop Dell Inspiron 15",
    price: 8900000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
    date: "3 ngày trước",
    createdAt: "23/10/2025",
    currentStatus: 3,
    seller: {
      name: "Nguyễn Văn D",
      address: "Phường Tam Bình, Thủ Đức, TP.HCM"
    }
  },
  "4": {
    id: "4",
    title: "Máy giặt Electrolux 8kg",
    price: 3800000,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400",
    date: "5 ngày trước",
    createdAt: "21/10/2025",
    currentStatus: 2,
    seller: {
      name: "Phạm Thị E",
      address: "Phường Hiệp Bình Phước, Thủ Đức, TP.HCM"
    }
  }
};

const BUY_ORDER_STATUSES = [
  { id: 0, label: "Đã đặt hàng", icon: Package },
  { id: 1, label: "Chờ lấy hàng", icon: Package },
  { id: 2, label: "Đang giao hàng", icon: Package },
  { id: 3, label: "Đánh giá", icon: CheckCircle2 }
];

const SELL_ORDER_STATUSES = [
  { id: 0, label: "Đã được cọc", icon: Package },
  { id: 1, label: "Chờ giao hàng", icon: Package },
  { id: 2, label: "Đang giao hàng", icon: Package },
  { id: 3, label: "Đánh giá", icon: CheckCircle2 }
];

function OrderStatusStepper({ currentStatus, type }) {
  const statuses = type === "buy" ? BUY_ORDER_STATUSES : SELL_ORDER_STATUSES;

  return (
    <div className="order-status-stepper">
      {/* Progress Line */}
      <div className="progress-line-container">
        <div className="progress-line-background">
          <div
            className="progress-line-fill"
            style={{ width: `${(currentStatus / (statuses.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Steps */}
      <div className="status-steps">
        {statuses.map((status, index) => {
          const isCompleted = index <= currentStatus;
          const isCurrent = index === currentStatus;

          return (
            <div key={status.id} className="status-step">
              <div
                className={`status-icon ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </div>
              <p className={`status-label ${isCompleted ? "active" : ""}`}>
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
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "sell";

  const order = orderId ? MOCK_ORDERS[orderId] : null;

  if (!order) {
    return (
      <UserLayout>
        <div className="order-detail-error">
          <div className="error-content">
            <h2 className="error-title">Không tìm thấy đơn hàng</h2>
            <button
              className="error-button"
              onClick={() => navigate("/orders")}
            >
              Quay lại
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const otherParty = type === "sell" 
    ? ("buyer" in order ? order.buyer : null)
    : ("seller" in order ? order.seller : null);

  return (
    <UserLayout>
      <div className="order-detail-container">
        {/* Back Button */}
        <button
          className="back-button"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="order-detail-content">
          {/* Order Information */}
          <div className="order-card">
            <div className="card-header">
              <h2 className="card-title">
                <Package size={20} />
                Thông tin đơn hàng
              </h2>
            </div>
            <div className="card-body">
              {/* Product Info */}
              <div className="product-info">
                <img
                  src={order.image}
                  alt={order.title}
                  className="product-image"
                />
                <div className="product-details">
                  <h3 className="product-title">{order.title}</h3>
                  <p className="product-price">
                    {order.price.toLocaleString("vi-VN")} đ
                  </p>
                  <div className="product-date">
                    <Calendar size={16} />
                    <span>Thời gian đăng: {order.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="separator" />

              {/* Other Party Info */}
              {otherParty && (
                <div className="party-info">
                  <h4 className="party-title">
                    <User size={16} />
                    Thông tin {type === "sell" ? "người mua" : "người bán"}
                  </h4>
                  <div className="party-details">
                    <div className="party-item">
                      <User size={16} className="party-icon" />
                      <div>
                        <p className="party-label">Tên</p>
                        <p className="party-value">{otherParty.name}</p>
                      </div>
                    </div>
                    <div className="party-item">
                      <MapPin size={16} className="party-icon" />
                      <div>
                        <p className="party-label">Địa chỉ</p>
                        <p className="party-value">{otherParty.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Status */}
          <div className="order-card">
            <div className="card-header">
              <h2 className="card-title">Trạng thái giao hàng</h2>
            </div>
            <div className="card-body">
              <OrderStatusStepper currentStatus={order.currentStatus} type={type} />

              {/* Cancel Order Button (only for buy orders and not completed) */}
              {type === "buy" && order.currentStatus < 3 && (
                <div className="action-button-container">
                  <button className="action-button cancel-button">
                    <XCircle size={16} />
                    Hủy đơn
                  </button>
                </div>
              )}

              {/* Review Button (if status is completed) */}
              {order.currentStatus === 3 && (
                <div className="action-button-container">
                  <button className="action-button review-button">
                    Viết đánh giá
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
