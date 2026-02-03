import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import {
  Banknote,
  QrCode,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  Trash2,
  Check,
} from "lucide-react";
import "./Checkout.css";

const DISTRICTS = [
  "Phường Linh Xuân",
  "Phường Bình Chiểu",
  "Phường Hiệp Bình Phước",
  "Phường Linh Trung",
  "Phường Tam Bình",
  "Phường Tam Phú",
  "Phường Linh Đông",
  "Phường Hiệp Bình Chánh",
];

// Mock cart items
const MOCK_CART_ITEMS = [
  {
    id: 1,
    title: "iPhone 14 Pro Max 256GB",
    price: 25000000,
    image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=100",
    seller: "Nguyễn Văn B",
    quantity: 1,
  },
  {
    id: 2,
    title: "MacBook Air M2 2022",
    price: 28000000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100",
    seller: "Trần Thị C",
    quantity: 1,
  },
];

export default function Checkout() {
  const navigate = useNavigate();

  const [buyerInfo, setBuyerInfo] = useState({
    fullName: "",
    phone: "",
    ward: "",
    detailedAddress: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cartItems, setCartItems] = useState(MOCK_CART_ITEMS);
  const [toastMessage, setToastMessage] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSubmit = () => {
    if (
      !buyerInfo.fullName ||
      !buyerInfo.phone ||
      !buyerInfo.ward ||
      !buyerInfo.detailedAddress
    ) {
      showToast("Vui lòng điền đầy đủ thông tin người mua");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Vui lòng thêm sản phẩm vào giỏ hàng");
      return;
    }

    showToast("Đặt hàng thành công!");
    setTimeout(() => navigate("/orders"), 1500);
  };

  return (
    <UserLayout>
      <div className="checkout-container">
        <h1 className="checkout-title">Thanh toán</h1>

        <div className="checkout-grid">
          {/* Left Column - Buyer Info & Payment Method */}
          <div className="checkout-left">
            {/* Buyer Information */}
            <div className="checkout-card">
              <div className="card-header">
                <h2 className="card-title">
                  <User size={20} />
                  Thông tin người mua
                </h2>
              </div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      Họ và tên <span className="required">*</span>
                    </label>
                    <div className="input-group">
                      <User size={16} className="input-icon" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Nhập họ và tên"
                        className="form-input"
                        value={buyerInfo.fullName}
                        onChange={(e) =>
                          setBuyerInfo({
                            ...buyerInfo,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Số điện thoại <span className="required">*</span>
                    </label>
                    <div className="input-group">
                      <Phone size={16} className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        className="form-input"
                        value={buyerInfo.phone}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="separator" />

                <div className="address-section">
                  <div className="address-title">
                    <MapPin size={16} />
                    Địa chỉ nhận hàng
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ward" className="form-label">
                        Phường/Xã <span className="required">*</span>
                      </label>
                      <select
                        id="ward"
                        className="form-select"
                        value={buyerInfo.ward}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, ward: e.target.value })
                        }
                      >
                        <option value="">Chọn phường/xã</option>
                        {DISTRICTS.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="city" className="form-label">
                        Thành phố
                      </label>
                      <input
                        id="city"
                        type="text"
                        value="Thành phố Thủ Đức, TP. Hồ Chí Minh"
                        disabled
                        className="form-input disabled"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="detailedAddress" className="form-label">
                      Địa chỉ chi tiết <span className="required">*</span>
                    </label>
                    <input
                      id="detailedAddress"
                      type="text"
                      placeholder="Số nhà, tên đường, tòa nhà..."
                      className="form-input"
                      value={buyerInfo.detailedAddress}
                      onChange={(e) =>
                        setBuyerInfo({
                          ...buyerInfo,
                          detailedAddress: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-card">
              <div className="card-header">
                <h2 className="card-title">
                  <Banknote size={20} />
                  Phương thức thanh toán
                </h2>
              </div>
              <div className="card-body">
                <div className="payment-options">
                  <div
                    className={`payment-option ${
                      paymentMethod === "cash" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <input
                      type="radio"
                      id="cash"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="radio-input"
                    />
                    <label htmlFor="cash" className="payment-label">
                      <div className="payment-icon cash">
                        <Banknote size={20} />
                      </div>
                      <div className="payment-text">
                        <p className="payment-method">Thanh toán tiền mặt</p>
                        <p className="payment-desc">
                          Thanh toán khi nhận hàng (COD)
                        </p>
                      </div>
                    </label>
                  </div>

                  <div
                    className={`payment-option ${
                      paymentMethod === "qr" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("qr")}
                  >
                    <input
                      type="radio"
                      id="qr"
                      name="payment"
                      value="qr"
                      checked={paymentMethod === "qr"}
                      onChange={() => setPaymentMethod("qr")}
                      className="radio-input"
                    />
                    <label htmlFor="qr" className="payment-label">
                      <div className="payment-icon qr">
                        <QrCode size={20} />
                      </div>
                      <div className="payment-text">
                        <p className="payment-method">Quét mã QR</p>
                        <p className="payment-desc">
                          Thanh toán qua ứng dụng ngân hàng
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentMethod === "qr" && (
                  <div className="qr-section">
                    <div className="qr-container">
                      <QrCode size={80} />
                    </div>
                    <p className="qr-text">
                      Quét mã QR bằng ứng dụng ngân hàng để thanh toán
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-right">
            <div className="checkout-card sticky">
              <div className="card-header">
                <h2 className="card-title">
                  <ShoppingBag size={20} />
                  Thông tin đơn hàng
                </h2>
              </div>
              <div className="card-body">
                {cartItems.length === 0 ? (
                  <div className="empty-cart">
                    <ShoppingBag size={48} />
                    <p>Giỏ hàng trống</p>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cartItems.map((item) => (
                        <div key={item.id} className="cart-item">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="item-image"
                          />
                          <div className="item-details">
                            <h4 className="item-title">{item.title}</h4>
                            <p className="item-seller">
                              Người bán: {item.seller}
                            </p>
                            <p className="item-price">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="separator" />

                    <div className="price-summary">
                      <div className="price-row">
                        <span>Tạm tính</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="price-row">
                        <span>Phí vận chuyển</span>
                        <span>{formatPrice(shippingFee)}</span>
                      </div>
                      <div className="separator" />
                      <div className="price-row total">
                        <span>Tổng cộng</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>

                    <button
                      className="btn-checkout"
                      onClick={handleSubmit}
                    >
                      Đặt hàng
                    </button>

                    <p className="terms">
                      Bằng việc đặt hàng, bạn đồng ý với{" "}
                      <a href="#" className="terms-link">
                        Điều khoản dịch vụ
                      </a>{" "}
                      của chúng tôi
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="toast">
          <div className="toast-content">
            <Check size={20} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
