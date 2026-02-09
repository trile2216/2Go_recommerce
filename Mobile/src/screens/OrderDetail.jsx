import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getOrderById, cancelOrder, completeOrder } from "../service/home/api.order";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS = {
  Pending: { bg: "#fef3c7", text: "#d97706", icon: "clock-outline" },
  Paid: { bg: "#dbeafe", text: "#2563eb", icon: "check-circle-outline" },
  Confirmed: { bg: "#dbeafe", text: "#2563eb", icon: "check-circle" },
  Shipping: { bg: "#dbeafe", text: "#2563eb", icon: "truck-delivery" },
  Completed: { bg: "#dcfce7", text: "#16a34a", icon: "check-decagram" },
  Cancelled: { bg: "#fee2e2", text: "#dc2626", icon: "close-circle" },
};

const OrderDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Hủy đơn hàng",
      "Bạn có chắc chắn muốn hủy đơn hàng này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await cancelOrder(orderId);
              Alert.alert("Thành công", "Đã hủy đơn hàng");
              fetchOrder();
            } catch (error) {
              Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể hủy đơn hàng"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteOrder = () => {
    Alert.alert(
      "Xác nhận nhận hàng",
      "Bạn đã nhận được hàng và hài lòng với sản phẩm?",
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Đã nhận hàng",
          onPress: async () => {
            setActionLoading(true);
            try {
              await completeOrder(orderId);
              Alert.alert("Thành công", "Đơn hàng đã hoàn thành");
              fetchOrder();
            } catch (error) {
              Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể hoàn thành đơn hàng"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    return STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle" };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(order.status);
  const canCancel = ["Pending"].includes(order.status);
  const canComplete = ["Shipping"].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#359EFF"]} />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusStyle.bg }]}>
          <View style={styles.statusIconContainer}>
            <MaterialCommunityIcons name={statusStyle.icon} size={40} color={statusStyle.text} />
          </View>
          <View>
            <Text style={[styles.statusTitle, { color: statusStyle.text }]}>
              {STATUS_MAP[order.status] || order.status}
            </Text>
            <Text style={styles.statusDate}>Cập nhật: {formatDate(order.updatedAt || order.createdAt)}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="receipt" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng</Text>
            <Text style={styles.infoValue}>#{order.orderCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày đặt</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === "PayOS" ? "Thanh toán online" : "Thanh toán khi nhận hàng"}
            </Text>
          </View>
        </View>

        {/* Product */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Sản phẩm</Text>
          </View>

          <Pressable
            style={styles.productItem}
            onPress={() =>
              navigation.navigate("Detail", { listingId: order.listingId })
            }
          >
            <Image
              source={{
                uri: order.listingPrimaryImageUrl || "https://via.placeholder.com/80",
              }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {order.listingTitle || `Sản phẩm #${order.listingId}`}
              </Text>
              {order.sellerName && (
                <Text style={styles.sellerName}>Bán bởi: {order.sellerName}</Text>
              )}
              <Text style={styles.productPrice}>{formatPrice(order.listingPrice)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#359EFF" />
              <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            </View>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá sản phẩm</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.listingPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>Miễn phí</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount || order.listingPrice)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {(canCancel || canComplete) && (
          <View style={styles.actionContainer}>
            {canCancel && (
              <Pressable
                style={[styles.actionButton, styles.cancelButton, actionLoading && styles.buttonDisabled]}
                onPress={handleCancelOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#ef4444" />
                    <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                  </>
                )}
              </Pressable>
            )}
            {canComplete && (
              <Pressable
                style={[styles.actionButton, styles.completeButton, actionLoading && styles.buttonDisabled]}
                onPress={handleCompleteOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                    <Text style={styles.completeButtonText}>Đã nhận hàng</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}

        {/* Contact Seller */}
        <Pressable
          style={styles.contactButton}
          onPress={() => navigation.navigate("Chat")}
        >
          <MaterialCommunityIcons name="chat-outline" size={20} color="#359EFF" />
          <Text style={styles.contactButtonText}>Liên hệ người bán</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#359EFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#359EFF",
  },
  addressText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#359EFF",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  completeButton: {
    backgroundColor: "#22c55e",
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#359EFF",
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#359EFF",
  },
});

export default OrderDetail;
