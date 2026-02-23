import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const getStatusLabel = (status, paymentMethod) => {
  switch (status) {
    case "Pending":
      return paymentMethod === "COD" ? "Chờ xác nhận" : "Chờ thanh toán";
    case "Paid":
      return "Đã thanh toán";
    case "Confirmed":
      return "Đã xác nhận";
    case "Shipping":
      return "Đang giao hàng";
    case "Delivered":
      return "Đã giao hàng";
    case "Completed":
      return "Hoàn thành";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status;
  }
};

const OrderStatusStepper = ({ currentStatus }) => {
  if (currentStatus === "Cancelled") {
    return (
      <View style={[styles.container, styles.cancelledContainer]}>
        <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
        <Text style={styles.cancelledText}>Đơn hàng đã bị hủy</Text>
      </View>
    );
  }

  // Define steps
  const defaultSteps = [
    { id: "Pending", label: "Chờ xác nhận", icon: "clock-outline" },
    { id: "Confirmed", label: "Đã xác nhận", icon: "check-circle-outline" },
    { id: "Shipping", label: "Đang giao", icon: "truck-delivery-outline" },
    { id: "Delivered", label: "Đã giao", icon: "package-variant-closed" },
    { id: "Completed", label: "Hoàn thành", icon: "star-outline" },
  ];

  const paidSteps = [
    { id: "Pending", label: "Chờ thanh toán", icon: "clock-outline" },
    { id: "Paid", label: "Đã thanh toán", icon: "credit-card-outline" },
    { id: "Confirmed", label: "Đã xác nhận", icon: "check-circle-outline" },
    { id: "Shipping", label: "Đang giao", icon: "truck-delivery-outline" },
    { id: "Delivered", label: "Đã giao", icon: "package-variant-closed" },
    { id: "Completed", label: "Hoàn thành", icon: "star-outline" },
  ];

  // Base progress based on Paid state being present
  let steps = currentStatus === "Paid" || ["Confirmed", "Shipping", "Delivered", "Completed"].includes(currentStatus) && currentStatus !== "Pending" 
                // We don't have enough info inside the component to know if it's COD or Online strictly without passing `paymentMethod`. 
                // Let's rely on standard sequence without explicitly passing paymentMethod for now. We will use the standard sequence similar to Web Frontend.
                ? defaultSteps : defaultSteps;

  const getStatusIndex = (status) => {
    switch(status) {
        case "Pending": return 0;
        case "Paid": return 0; // Paid is essentially step 1 before confirmed
        case "Confirmed": return 1;
        case "Shipping": return 2;
        case "Delivered": return 3;
        case "Completed": return 4;
        default: return -1;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <View style={styles.container}>
      {defaultSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <View key={step.id} style={styles.stepContainer}>
             <View style={styles.iconWrapper}>
               <View style={[
                  styles.iconCircle, 
                  isCompleted ? styles.iconCircleActive : styles.iconCircleInactive,
                  isCurrent && styles.iconCircleCurrent
               ]}>
                 <MaterialCommunityIcons 
                    name={step.icon} 
                    size={20} 
                    color={isCompleted ? "#fff" : "#9ca3af"} 
                 />
               </View>
             </View>
             
             <View style={styles.textWrapper}>
               <Text style={[
                  styles.stepLabel, 
                  isCompleted ? styles.stepLabelActive : styles.stepLabelInactive,
                  isCurrent && styles.stepLabelCurrent
               ]}>
                 {step.label}
               </Text>
             </View>

             {/* Connector Line */}
             {index < defaultSteps.length - 1 && (
                <View style={[
                    styles.connectorLabel,
                    index < currentIndex ? styles.connectorActive : styles.connectorInactive
                ]} />
             )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cancelledContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
  },
  cancelledText: {
    color: "#ef4444",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  iconWrapper: {
    zIndex: 2,
    backgroundColor: "#fff",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  iconCircleInactive: {
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  iconCircleActive: {
    borderColor: "#359EFF",
    backgroundColor: "#359EFF",
  },
  iconCircleCurrent: {
    shadowColor: "#359EFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  textWrapper: {
    marginTop: 8,
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  stepLabelInactive: {
    color: "#9ca3af",
  },
  stepLabelActive: {
    color: "#359EFF",
    fontWeight: "600",
  },
  stepLabelCurrent: {
    fontWeight: "700",
  },
  connectorLabel: {
    position: "absolute",
    top: 18,
    left: "50%",
    width: "100%",
    height: 2,
    zIndex: 1,
  },
  connectorInactive: {
    backgroundColor: "#e5e7eb",
  },
  connectorActive: {
    backgroundColor: "#359EFF",
  }
});

export default OrderStatusStepper;
