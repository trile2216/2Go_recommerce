import {
  Package,
  CheckCircle2,
  Circle,
  XCircle,
  Truck,
  Box
} from "lucide-react";

// For delivery flow only
const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao",
  Delivered: "Đã giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  Disputed: "Đang tranh chấp"
};

// Only focus on physical delivery steps
const DELIVERY_STATUSES = [
  { id: "Pending", label: "Chờ xác nhận", icon: Package },
  { id: "Confirmed", label: "Đã xác nhận", icon: CheckCircle2 },
  { id: "Shipping", label: "Đang giao", icon: Truck },
  { id: "Delivered", label: "Đã giao", icon: Box },
  { id: "Completed", label: "Hoàn thành", icon: CheckCircle2 },
];

/**
 * Get display label for a delivery status
 */
export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/**
 * OrderStatusStepper component
 * @param {{ currentStatus: string }} props
 */
export default function OrderStatusStepper({ currentStatus }) {
  const statusOrder = DELIVERY_STATUSES.map((s) => s.id);
  // If the status is one of the final states, handle it specially
  const isCancelled = currentStatus === "Cancelled";
  const isDisputed = currentStatus === "Disputed";

  if (isCancelled || isDisputed) {
    return (
      <div className="order-status-stepper">
        <div className="cancelled-status">
          <XCircle size={32} />
          <p>{isCancelled ? "Đơn hàng đã bị hủy" : "Đơn hàng đang có tranh chấp"}</p>
        </div>
      </div>
    );
  }

  // Find index. If status is not in the array (e.g. some edge case), default to 0
  const currentIdx = Math.max(0, statusOrder.indexOf(currentStatus));

  return (
    <div className="order-status-stepper">
      <div className="progress-line-container">
        <div className="progress-line-background">
          <div
            className="progress-line-fill"
            style={{ width: `${(currentIdx / (DELIVERY_STATUSES.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="status-steps">
        {DELIVERY_STATUSES.map((status, index) => {
          const isCompleted = index <= currentIdx;
          const isCurrent = index === currentIdx;
          return (
            <div key={status.id} className="status-step">
              <div className={`status-icon ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                {isCompleted ? <status.icon size={20} /> : <Circle size={20} />}
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
