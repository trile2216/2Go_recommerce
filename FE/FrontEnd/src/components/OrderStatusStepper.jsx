import {
  Package,
  CheckCircle2,
  Circle,
  XCircle,
  CreditCard,
  Truck,
} from "lucide-react";

// Labels vary by payment method for "Pending"
const STATUS_LABELS = {
  Pending: { PAYOS: "Chờ thanh toán", COD: "Chờ xác nhận" },
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const PAYOS_STATUSES = [
  { id: "Pending", label: "Chờ thanh toán", icon: CreditCard },
  { id: "Paid", label: "Đã thanh toán", icon: CheckCircle2 },
  { id: "Confirmed", label: "Đã xác nhận", icon: Package },
  { id: "Shipping", label: "Đang giao", icon: Truck },
  { id: "Completed", label: "Hoàn thành", icon: CheckCircle2 },
];

const COD_STATUSES = [
  { id: "Pending", label: "Chờ xác nhận", icon: CreditCard },
  { id: "Confirmed", label: "Đã xác nhận", icon: Package },
  { id: "Shipping", label: "Đang giao", icon: Truck },
  { id: "Paid", label: "Đã thanh toán", icon: CheckCircle2 },
  { id: "Completed", label: "Hoàn thành", icon: CheckCircle2 },
];

/**
 * Get display label for a status, considering payment method
 */
export function getStatusLabel(status, paymentMethod) {
  const label = STATUS_LABELS[status];
  if (typeof label === "object") {
    return label[paymentMethod] || label.PAYOS;
  }
  return label || status;
}

/**
 * OrderStatusStepper component
 * @param {{ currentStatus: string, paymentMethod?: string }} props
 * - paymentMethod: "PAYOS" | "COD"
 */
export default function OrderStatusStepper({ currentStatus, paymentMethod = "PAYOS" }) {
  const isCOD = paymentMethod !== "PAYOS";
  const statuses = isCOD ? COD_STATUSES : PAYOS_STATUSES;
  const statusOrder = statuses.map((s) => s.id);
  const currentIdx = statusOrder.indexOf(currentStatus);
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
            style={{ width: `${(currentIdx / (statuses.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="status-steps">
        {statuses.map((status, index) => {
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
