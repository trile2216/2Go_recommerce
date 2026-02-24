import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { getMyOrders, cancelOrder } from "../../service/home/api.order";
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from "lucide-react";
import "./PaymentResult.css";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // PayOS typically redirects with these query params:
  // ?code=00&id=xxx&cancel=false&status=PAID&orderCode=xxx
  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const cancel = searchParams.get("cancel");

  const isSuccess = code === "00" && status === "PAID" && cancel !== "true";
  const isCancelled = cancel === "true" || status === "CANCELLED";

  const [countdown, setCountdown] = useState(10);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelResult, setCancelResult] = useState(null); // "success" | "error" | null
  const hasCancelledRef = useRef(false);

  // Auto-cancel order when payment is cancelled
  useEffect(() => {
    if (!isCancelled || !orderCode || hasCancelledRef.current) return;
    hasCancelledRef.current = true;

    const autoCancelOrder = async () => {
      setCancellingOrder(true);
      try {
        // Find the order by orderCode from user's orders
        const ordersData = await getMyOrders(0, 100);
        const matchedOrder = (ordersData.items || []).find(
          (o) => String(o.orderCode) === String(orderCode)
        );

        if (matchedOrder) {
          await cancelOrder(matchedOrder.orderId);
          setCancelResult("success");
        } else {
          console.warn("Could not find order with orderCode:", orderCode);
          setCancelResult("error");
        }
      } catch (error) {
        console.error("Auto-cancel order failed:", error);
        setCancelResult("error");
      } finally {
        setCancellingOrder(false);
      }
    };

    autoCancelOrder();
  }, [isCancelled, orderCode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <UserLayout>
      <div className="payment-result-container">
        <div className="payment-result-card">
          {isSuccess ? (
            <>
              <div className="result-icon success">
                <CheckCircle2 size={64} />
              </div>
              <h1 className="result-title success">Thanh toán thành công!</h1>
              <p className="result-description">
                Đơn hàng <strong>#{orderCode}</strong> đã được thanh toán thành công.
                Bạn có thể theo dõi đơn hàng trong trang quản lý đơn hàng.
              </p>
            </>
          ) : isCancelled ? (
            <>
              <div className="result-icon cancelled">
                <XCircle size={64} />
              </div>
              <h1 className="result-title cancelled">Thanh toán bị hủy</h1>
              <p className="result-description">
                Thanh toán cho đơn hàng <strong>#{orderCode}</strong> đã bị hủy.
              </p>
              {cancellingOrder && (
                <p className="result-cancel-status">
                  <Loader2 size={16} className="spin" /> Đang hủy đơn hàng...
                </p>
              )}
              {cancelResult === "success" && (
                <p className="result-cancel-status success">
                  Đơn hàng đã được hủy tự động.
                </p>
              )}
              {cancelResult === "error" && (
                <p className="result-cancel-status error">
                  Không thể tự động hủy đơn hàng. Vui lòng hủy thủ công trong trang đơn hàng.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="result-icon pending">
                <Loader2 size={64} className="spin" />
              </div>
              <h1 className="result-title pending">Đang xử lý thanh toán</h1>
              <p className="result-description">
                Đơn hàng <strong>#{orderCode}</strong> đang được xử lý.
                Vui lòng chờ trong giây lát.
              </p>
            </>
          )}

          <p className="result-redirect">
            Tự động chuyển hướng sau {countdown} giây...
          </p>

          <div className="result-actions">
            <button
              className="result-btn primary"
              onClick={() => navigate("/orders")}
            >
              <ShoppingBag size={18} />
              Xem đơn hàng
            </button>
            <button
              className="result-btn secondary"
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
