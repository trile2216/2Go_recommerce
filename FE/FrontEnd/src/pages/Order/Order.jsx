import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { Package } from "lucide-react";
import "./Order.css";

// Mock data
const SELL_ORDERS = [
  {
    id: "1",
    title: "iPhone 13 Pro 128GB Vàng",
    price: 15500000,
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=200",
    status: "Đã bán thành công",
    date: "2 ngày trước",
  },
  {
    id: "2",
    title: "Tủ lạnh Panasonic 180L",
    price: 2490000,
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=200",
    status: "Đang giao",
    date: "1 tuần trước",
  },
];

const BUY_ORDERS = [
  {
    id: "3",
    title: "Laptop Dell Inspiron 15",
    price: 8900000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200",
    status: "Đã giao",
    date: "3 ngày trước",
  },
  {
    id: "4",
    title: "Máy giặt Electrolux 8kg",
    price: 3800000,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200",
    status: "Đang giao hàng",
    date: "5 ngày trước",
  },
];

const getStatusColor = (status) => {
  const colors = {
    "Đã bán thành công": "status-success",
    "Đã giao": "status-success",
    "Đang giao": "status-info",
    "Đang giao hàng": "status-info",
    "Đã đặt cọc": "status-warning",
    "Đã đặt hàng": "status-warning",
    "Chờ lấy hàng": "status-accent",
  };
  return colors[status] || "status-default";
};

function OrderCard({ order }) {
  const navigate = useNavigate();

  return (
    <div className="order-card">
      <div className="order-card-content">
        <img 
          src={order.image} 
          alt={order.title} 
          className="order-card-image"
        />
        <div className="order-card-info">
          <h3 className="order-card-title">{order.title}</h3>
          <p className="order-card-price">
            {order.price.toLocaleString("vi-VN")} đ
          </p>
          <p className="order-card-date">{order.date}</p>
        </div>
        <div className="order-card-actions">
          <span className={`order-status ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <button
            className="order-detail-btn"
            onClick={() => navigate(`/order/${order.id}`)}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Package size={64} />
      </div>
      <h3 className="empty-state-title">
        Bạn chưa có đơn {type === "sell" ? "bán" : "mua"} nào
      </h3>
      <p className="empty-state-description">
        {type === "sell"
          ? "Hãy đăng tin để bán sản phẩm của bạn"
          : "Hãy khám phá và mua sắm những sản phẩm yêu thích"}
      </p>
      <button className="empty-state-btn">
        {type === "sell" ? "Đăng tin ngay" : "Khám phá sản phẩm"}
      </button>
    </div>
  );
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState("sell");
  const [showMoreSell, setShowMoreSell] = useState(false);
  const [showMoreBuy, setShowMoreBuy] = useState(false);

  const visibleSellOrders = showMoreSell ? SELL_ORDERS : SELL_ORDERS.slice(0, 8);
  const visibleBuyOrders = showMoreBuy ? BUY_ORDERS : BUY_ORDERS.slice(0, 8);

  return (
    <UserLayout>
      <div className="order-header">
        <h1 className="order-title">Đơn của tôi</h1>
        <p className="order-subtitle">Quản lý các đơn hàng mua và bán của bạn</p>
      </div>

      <div className="order-tabs">
          <div className="tabs-list">
            <button
              className={`tab-trigger ${activeTab === "sell" ? "active" : ""}`}
              onClick={() => setActiveTab("sell")}
            >
              Đơn bán
            </button>
            <button
              className={`tab-trigger ${activeTab === "buy" ? "active" : ""}`}
              onClick={() => setActiveTab("buy")}
            >
              Đơn mua
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === "sell" && (
              <div className="tab-pane">
                {SELL_ORDERS.length === 0 ? (
                  <EmptyState type="sell" />
                ) : (
                  <>
                    <div className="orders-list">
                      {visibleSellOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          type="sell"
                        />
                      ))}
                    </div>
                    {SELL_ORDERS.length > 8 && !showMoreSell && (
                      <div className="load-more-container">
                        <button
                          className="order-load-more-btn"
                          onClick={() => setShowMoreSell(true)}
                        >
                          Xem thêm
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "buy" && (
              <div className="tab-pane">
                {BUY_ORDERS.length === 0 ? (
                  <EmptyState type="buy" />
                ) : (
                  <>
                    <div className="orders-list">
                      {visibleBuyOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          type="buy"
                        />
                      ))}
                    </div>
                    {BUY_ORDERS.length > 8 && !showMoreBuy && (
                      <div className="load-more-container">
                        <button
                          className="order-load-more-btn"
                          onClick={() => setShowMoreBuy(true)}
                        >
                          Xem thêm
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
    </UserLayout>
  );
}
