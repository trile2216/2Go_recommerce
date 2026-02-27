import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyOrders, cancelOrder } from "../service/home/api.order";

const PaymentResult = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Params come from deep link: twogo://payment-result?code=00&status=PAID&orderCode=123&cancel=false
  const { code, status, orderCode, cancel } = route.params || {};

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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigation.reset({
            index: 0,
            routes: [{ name: "Orders" }], // Auto redirect to Orders
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {isSuccess ? (
          <>
            <View style={[styles.iconContainer, styles.iconSuccess]}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#16a34a" />
            </View>
            <Text style={[styles.title, styles.textSuccess]}>Thanh toán thành công!</Text>
            <Text style={styles.description}>
              Đơn hàng <Text style={styles.bold}>#{orderCode}</Text> đã được thanh toán thành công.
              Bạn có thể theo dõi đơn hàng trong trang quản lý đơn hàng.
            </Text>
          </>
        ) : isCancelled ? (
          <>
            <View style={[styles.iconContainer, styles.iconCancelled]}>
              <MaterialCommunityIcons name="close-circle" size={64} color="#dc2626" />
            </View>
            <Text style={[styles.title, styles.textCancelled]}>Thanh toán bị hủy</Text>
            <Text style={styles.description}>
              Thanh toán cho đơn hàng <Text style={styles.bold}>#{orderCode}</Text> đã bị hủy.
            </Text>

            {cancellingOrder && (
              <View style={styles.cancelStatusRow}>
                <ActivityIndicator size="small" color="#6b7280" />
                <Text style={styles.cancelStatusText}>Đang hủy đơn hàng...</Text>
              </View>
            )}
            {cancelResult === "success" && (
              <Text style={[styles.cancelStatusText, styles.textSuccess, { marginTop: 8 }]}>
                Đơn hàng đã được hủy tự động.
              </Text>
            )}
            {cancelResult === "error" && (
              <Text style={[styles.cancelStatusText, styles.textCancelled, { marginTop: 8 }]}>
                Không thể tự động hủy đơn hàng. Vui lòng hủy thủ công trong trang đơn hàng.
              </Text>
            )}
          </>
        ) : (
          <>
            <View style={[styles.iconContainer, styles.iconPending]}>
              <ActivityIndicator size={64} color="#359EFF" />
            </View>
            <Text style={[styles.title, styles.textPending]}>Đang xử lý thanh toán</Text>
            <Text style={styles.description}>
              Đơn hàng <Text style={styles.bold}>#{orderCode}</Text> đang được xử lý.
              Vui lòng chờ trong giây lát.
            </Text>
          </>
        )}

        <Text style={styles.redirectText}>
          Tự động chuyển hướng sau {countdown} giây...
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate("Orders")}
          >
            <MaterialCommunityIcons name="shopping" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconSuccess: { backgroundColor: "#dcfce7" },
  iconCancelled: { backgroundColor: "#fee2e2" },
  iconPending: { backgroundColor: "#eff6ff" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  textSuccess: { color: "#16a34a" },
  textCancelled: { color: "#dc2626" },
  textPending: { color: "#359EFF" },
  description: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: { fontWeight: "700", color: "#111827" },
  cancelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  cancelStatusText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  redirectText: {
    fontSize: 14,
    color: "#9ca3af",
    marginVertical: 24,
    fontStyle: "italic",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#359EFF",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
  },
  secondaryButtonText: {
    color: "#4b5563",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentResult;
