import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { createOrder } from "../../service/home/api.order";
import {
  Banknote,
  QrCode,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  Trash2,
  Loader2,
} from "lucide-react";
import "./Checkout.css";
import { createPayment } from "../../service/home/api.payment";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, removeFromCart, getTotalPrice, clearCart, fetchCartData } = useCart();
  const toast = useToast();

  // Support single-item checkout via location state (from "Mua ngay" button)
  const singleItem = location.state?.item || null;
  const displayItems = singleItem ? [singleItem] : cartItems;

  // Auto-fill buyer info from localStorage (stored after login)
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [buyerInfo, setBuyerInfo] = useState({
    fullName: storedUser?.profile?.fullName || storedUser?.fullName || "",
    phone: storedUser?.phone || "",
    address: storedUser?.profile?.address || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const subtotal = displayItems.reduce(
    (sum, item) => sum + (Number(item.priceSnapshot || item.price) || 0) * (item.quantity || 1),
    0
  );
  const total = subtotal;

  const handleRemoveItem = async (cartItemId) => {
    if (singleItem) return; // can't remove single-item checkout
    await removeFromCart(cartItemId);
  };

  const handleSubmit = async () => {
    if (
      !buyerInfo.fullName ||
      !buyerInfo.phone ||
      !buyerInfo.address
    ) {
      toast.warning("Vui lòng điền đầy đủ thông tin người mua");
      return;
    }

    if (displayItems.length === 0) {
      toast.warning("Không có sản phẩm nào để thanh toán");
      return;
    }

    setSubmitting(true);

    try {
      // Use the free-text address as delivery address
      const deliveryAddress = buyerInfo.address;

      // Create an order for each listing
      const orderResults = [];
      for (const item of displayItems) {
        const listingId = item.listingId || item.id;
        const result = await createOrder(listingId, paymentMethod, deliveryAddress);
        const paymentRequest = await createPayment(result.orderId, result.paymentMethod);
        orderResults.push({
          ...result,
          paymentRequest,
        });
      }

      // If PayOS, redirect to checkout URL from the first order (or last) that has one
      if (paymentMethod === "PayOS") {
        const payosOrder = orderResults.find((r) => r.paymentRequest?.payUrl);
        if (payosOrder?.paymentRequest?.payUrl) {
          // Clear cart after successful order creation
          if (!singleItem) await clearCart();
          window.location.href = payosOrder.paymentRequest.payUrl;
          return;
        }
      }

      // COD flow — orders created, clear cart and go to orders page
      if (!singleItem) await clearCart();
      toast.success("Đặt hàng thành công!");
      navigate("/orders");
    } catch (error) {
      console.error("Checkout error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Đặt hàng thất bại. Vui lòng thử lại.";
      toast.error(typeof message === "string" ? message : "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="checkout-container">
        <div className="checkout-grid">
          {/* Left Column - Buyer Info & Payment Method */}
          <div className="checkout-left">
            {/* Buyer Information */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h2 className="checkout-card-title">
                  <User size={20} />
                  Thông tin người mua
                </h2>
              </div>
              <div className="checkout-card-body">
                <div className="checkout-form-row">
                  <div className="checkout-form-group">
                    <label htmlFor="fullName" className="checkout-form-label">
                      Họ và tên <span className="required">*</span>
                    </label>
                    <div className="input-group">
                      <User size={16} className="input-icon" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Nhập họ và tên"
                        className="checkout-form-input"
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

                  <div className="checkout-form-group">
                    <label htmlFor="phone" className="checkout-form-label">
                      Số điện thoại <span className="required">*</span>
                    </label>
                    <div className="input-group">
                      <Phone size={16} className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        className="checkout-form-input"
                        value={buyerInfo.phone}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="address-section">
                  <div className="address-title">
                    <MapPin size={16} />
                    Địa chỉ nhận hàng
                  </div>

                  <div className="checkout-form-group">
                    <label htmlFor="address" className="checkout-form-label">
                      Địa chỉ <span className="required">*</span>
                    </label>
                    <div className="input-group">
                      <MapPin size={16} className="input-icon" />
                      <input
                        id="address"
                        type="text"
                        placeholder="Số nhà, đường, phường, quận, thành phố..."
                        className="checkout-form-input"
                        value={buyerInfo.address}
                        onChange={(e) =>
                          setBuyerInfo({
                            ...buyerInfo,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h2 className="checkout-card-title">
                  <Banknote size={20} />
                  Phương thức thanh toán
                </h2>
              </div>
              <div className="checkout-card-body">
                <div className="payment-options">
                  <div
                    className={`payment-option ${
                      paymentMethod === "COD" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <input
                      type="radio"
                      id="cash"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
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
                      paymentMethod === "PayOS" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("PayOS")}
                  >
                    <input
                      type="radio"
                      id="qr"
                      name="payment"
                      value="PayOS"
                      checked={paymentMethod === "PayOS"}
                      onChange={() => setPaymentMethod("PayOS")}
                      className="radio-input"
                    />
                    <label htmlFor="qr" className="payment-label">
                      <div className="payment-icon qr">
                        <QrCode size={20} />
                      </div>
                      <div className="payment-text">
                        <p className="payment-method">Thanh toán online (PayOS)</p>
                        <p className="payment-desc">
                          Thanh toán qua QR / ngân hàng trực tuyến
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentMethod === "PayOS" && (
                  <div className="qr-section">
                    <p className="qr-text">
                      Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán PayOS để hoàn tất.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-right">
            <div className="checkout-card sticky">
              <div className="checkout-card-header">
                <h2 className="checkout-card-title">
                  <ShoppingBag size={20} />
                  Thông tin đơn hàng
                </h2>
              </div>
              <div className="checkout-card-body">
                {displayItems.length === 0 ? (
                  <div className="empty-cart">
                    <ShoppingBag size={48} />
                    <p>Giỏ hàng trống</p>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {displayItems.map((item) => (
                        <div key={item.cartItemId || item.listingId || item.id} className="cart-item">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title || "Sản phẩm"}
                              className="item-image"
                            />
                          ) : (
                            <div className="item-image item-image-placeholder">
                              <ShoppingBag size={20} />
                            </div>
                          )}
                          <div className="item-details">
                            <h4 className="item-title">{item.title || `Sản phẩm #${item.listingId}`}</h4>
                            <p className="item-price">
                              {formatPrice(item.priceSnapshot || item.price || 0)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="item-quantity">x{item.quantity}</p>
                            )}
                          </div>
                          {!singleItem && (
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveItem(item.cartItemId)}
                              title="Xóa sản phẩm"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="checkout-separator" />

                    <div className="price-summary">
                      <div className="price-row">
                        <span>Tạm tính</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="checkout-separator" />
                      <div className="price-row total">
                        <span>Tổng cộng</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>

                    <button
                      className="btn-checkout"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="spin" /> Đang xử lý...
                        </>
                      ) : paymentMethod === "PayOS" ? (
                        "Thanh toán với PayOS"
                      ) : (
                        "Đặt hàng"
                      )}
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
    </UserLayout>
  );
}
