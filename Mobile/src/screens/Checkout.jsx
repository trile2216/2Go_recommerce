import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { createOrder } from "../service/home/api.order";
import { createPayment } from "../service/home/api.payment";

const DEPOSIT_THRESHOLD = 2_000_000;
const DEPOSIT_RATE = 0.1;

const PAYMENT_METHODS = [
  {
    id: "COD",
    name: "Thanh toán khi nhận hàng",
    description: "Thanh toán bằng tiền mặt khi nhận hàng",
    icon: "cash",
  },
  {
    id: "PayOS",
    name: "Thanh toán online",
    description: "Thanh toán qua ngân hàng, ví điện tử",
    icon: "credit-card",
  },
];

const Checkout = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { clearCartData } = useCart();

  // Items to checkout (from cart or single item "Mua ngay")
  const items = route.params?.items || [];
  const singleItem = route.params?.singleItem || null;
  const displayItems = singleItem ? [singleItem] : items;

  const [buyerInfo, setBuyerInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setBuyerInfo({
            fullName: user?.profile?.fullName || user?.fullName || "",
            phone: user?.phone || "",
            address: user?.profile?.address || "",
          });
        }
      } catch (err) {
        console.error("Error loading user info:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getTotalPrice = () => {
    return displayItems.reduce((total, item) => {
      const price = item.priceSnapshot || item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  // Escrow logic
  const total = getTotalPrice();
  const requiresDeposit = total >= DEPOSIT_THRESHOLD;
  const depositAmount = requiresDeposit ? Math.round(total * DEPOSIT_RATE) : 0;
  const remainingAmount = requiresDeposit ? total - depositAmount : 0;

  // Auto-switch to PayOS when deposit is required (COD not allowed)
  useEffect(() => {
    if (requiresDeposit && paymentMethod === "COD") {
      setPaymentMethod("PayOS");
    }
  }, [requiresDeposit, paymentMethod]);

  const handleSubmit = async () => {
    if (!buyerInfo.fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên");
      return;
    }
    if (!buyerInfo.phone.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập số điện thoại");
      return;
    }
    if (!buyerInfo.address.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    if (displayItems.length === 0) {
      Alert.alert("Thông báo", "Không có sản phẩm nào để thanh toán");
      return;
    }

    setSubmitting(true);

    try {
      const deliveryAddress = buyerInfo.address;
      const deliveryPhone = buyerInfo.phone;
      const orderResults = [];

      // Create order for each item
      for (const item of displayItems) {
        const listingId = item.listingId || item.id;
        const result = await createOrder(listingId, paymentMethod, deliveryAddress, deliveryPhone);
        const itemTotal = result.totalAmount || (item.priceSnapshot || item.price || 0);
        const itemRequiresDeposit = itemTotal >= DEPOSIT_THRESHOLD;
        const paymentStage = itemRequiresDeposit ? "DEPOSIT" : null;
        
        // Create payment
        const paymentRequest = await createPayment(result.orderId, result.paymentMethod, paymentStage);
        orderResults.push({
          ...result,
          paymentRequest,
          itemRequiresDeposit,
        });
      }

      // If PayOS, open payment URL
      if (paymentMethod === "PayOS") {
        const payosOrder = orderResults.find((r) => r.paymentRequest?.payUrl);
        if (payosOrder?.paymentRequest?.payUrl) {
          if (!singleItem) await clearCartData();
          
          // Open payment URL in browser
          const canOpen = await Linking.canOpenURL(payosOrder.paymentRequest.payUrl);
          if (canOpen) {
            await Linking.openURL(payosOrder.paymentRequest.payUrl);
          }
          
          // Navigate to orders (they can check status later)
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }, { name: "Orders" }],
          });
          return;
        }
      }

      // COD flow
      if (!singleItem) await clearCartData();
      if (orderResults.some((r) => r.itemRequiresDeposit)) {
        Alert.alert("Thành công", "Đặt hàng thành công! Vui lòng thanh toán cọc để xác nhận đơn hàng.", [
          {
            text: "Xem đơn hàng",
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [{ name: "Main" }, { name: "Orders" }],
              });
            },
          },
        ]);
      } else {
        Alert.alert("Thành công", "Đặt hàng thành công!", [
          {
            text: "Xem đơn hàng",
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [{ name: "Main" }, { name: "Orders" }],
              });
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Đặt hàng thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", typeof message === "string" ? message : "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Deposit Warning Banner */}
        {requiresDeposit && (
          <View style={styles.depositBanner}>
            <MaterialCommunityIcons name="shield-alert" size={20} color="#F97316" />
            <View style={{ flex: 1 }}>
              <Text style={styles.depositBannerTitle}>Đơn hàng có giá trị cao</Text>
              <Text style={styles.depositBannerText}>
                Đơn hàng trên {formatPrice(DEPOSIT_THRESHOLD)} cần đặt cọc {Math.round(DEPOSIT_RATE * 100)}% để bảo vệ quyền lợi của cả hai bên.
              </Text>
            </View>
          </View>
        )}

        {/* Buyer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Thông tin người mua</Text>
          </View>

          <Text style={styles.label}>Họ và tên *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#9ca3af"
              value={buyerInfo.fullName}
              onChangeText={(text) => setBuyerInfo((prev) => ({ ...prev, fullName: text }))}
            />
          </View>

          <Text style={styles.label}>Số điện thoại *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={buyerInfo.phone}
              onChangeText={(text) => setBuyerInfo((prev) => ({ ...prev, phone: text }))}
            />
          </View>

          <Text style={styles.label}>Địa chỉ giao hàng *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#9ca3af" />
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              placeholder="Nhập địa chỉ giao hàng đầy đủ"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={buyerInfo.address}
              onChangeText={(text) => setBuyerInfo((prev) => ({ ...prev, address: text }))}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
          </View>

          {PAYMENT_METHODS.map((method) => {
            const isDisabled = method.id === "COD" && requiresDeposit;
            return (
              <Pressable
                key={method.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === method.id && styles.paymentOptionSelected,
                  isDisabled && styles.paymentOptionDisabled,
                ]}
                onPress={() => !isDisabled && setPaymentMethod(method.id)}
                disabled={isDisabled}
              >
                <View style={styles.paymentOptionLeft}>
                  <View
                    style={[
                      styles.paymentIcon,
                      paymentMethod === method.id && styles.paymentIconSelected,
                      isDisabled && styles.paymentIconDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={method.icon}
                      size={20}
                      color={
                        isDisabled 
                          ? "#9ca3af" 
                          : paymentMethod === method.id 
                          ? "#359EFF" 
                          : "#6b7280"
                      }
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.paymentName,
                        paymentMethod === method.id && styles.paymentNameSelected,
                        isDisabled && styles.paymentNameDisabled,
                      ]}
                    >
                      {method.name}
                      {isDisabled && " (Không khả dụng)"}
                    </Text>
                    <Text style={[styles.paymentDescription, isDisabled && { color: "#9ca3af" }]}>
                      {isDisabled 
                        ? "Đơn hàng cần đặt cọc phải thanh toán online" 
                        : method.description
                      }
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    paymentMethod === method.id && styles.radioOuterSelected,
                    isDisabled && styles.radioOuterDisabled,
                  ]}
                >
                  {paymentMethod === method.id && !isDisabled && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shopping" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Đơn hàng ({displayItems.length} sản phẩm)</Text>
          </View>

          {displayItems.map((item, index) => (
            <View
              key={item.cartItemId || item.listingId || index}
              style={[
                styles.orderItem,
                index < displayItems.length - 1 && styles.orderItemBorder,
              ]}
            >
              <Image
                source={{
                  uri: item.imageUrl || item.primaryImageUrl || "https://via.placeholder.com/60",
                }}
                style={styles.orderItemImage}
              />
              <View style={styles.orderItemDetails}>
                <Text style={styles.orderItemTitle} numberOfLines={2}>
                  {item.title || `Sản phẩm #${item.listingId || item.id}`}
                </Text>
                <Text style={styles.orderItemQuantity}>x{item.quantity || 1}</Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.priceSnapshot || item.price)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(getTotalPrice())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>Miễn phí</Text>
          </View>
          
          {/* Deposit Information */}
          {requiresDeposit && (
            <>
              <View style={styles.divider} />
              <View style={styles.depositInfo}>
                <View style={styles.depositHeader}>
                  <MaterialCommunityIcons name="shield-check" size={16} color="#F97316" />
                  <Text style={styles.depositTitle}>Thanh toán ký quỹ</Text>
                </View>
                <Text style={styles.depositDescription}>
                  Đơn hàng trên {formatPrice(DEPOSIT_THRESHOLD)} cần đặt cọc {Math.round(DEPOSIT_RATE * 100)}% để bảo vệ cả hai bên.
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Số tiền đặt cọc</Text>
                  <Text style={[styles.summaryValue, { color: "#F97316" }]}>{formatPrice(depositAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Thanh toán còn lại</Text>
                  <Text style={styles.summaryValue}>{formatPrice(remainingAmount)}</Text>
                </View>
              </View>
            </>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{requiresDeposit ? "Cần thanh toán ngay" : "Tổng cộng"}</Text>
            <Text style={styles.totalValue}>{formatPrice(requiresDeposit ? depositAmount : getTotalPrice())}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.bottomLabel}>{requiresDeposit ? "Cần thanh toán ngay" : "Tổng thanh toán"}</Text>
            <Text style={styles.bottomPrice}>{formatPrice(requiresDeposit ? depositAmount : getTotalPrice())}</Text>
          </View>
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {requiresDeposit ? "Đặt cọc" : "Đặt hàng"}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </View>
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
    paddingBottom: 140,
  },
  depositBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  depositBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F97316",
    marginBottom: 2,
  },
  depositBannerText: {
    fontSize: 12,
    color: "#9A3412",
    lineHeight: 16,
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f5f7f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111",
    padding: 0,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  paymentOptionSelected: {
    borderColor: "#359EFF",
    backgroundColor: "rgba(53, 158, 255, 0.05)",
  },
  paymentOptionDisabled: {
    backgroundColor: "#f9fafb",
    opacity: 0.7,
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentIconSelected: {
    backgroundColor: "rgba(53, 158, 255, 0.1)",
  },
  paymentIconDisabled: {
    backgroundColor: "#f3f4f6",
  },
  paymentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  paymentNameSelected: {
    color: "#359EFF",
  },
  paymentNameDisabled: {
    color: "#9ca3af",
  },
  paymentDescription: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#359EFF",
  },
  radioOuterDisabled: {
    borderColor: "#d1d5db",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#359EFF",
  },
  depositInfo: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  depositHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  depositTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F97316",
  },
  depositDescription: {
    fontSize: 12,
    color: "#9A3412",
    marginBottom: 8,
    lineHeight: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  orderItemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  orderItemQuantity: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#359EFF",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
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
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
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
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#359EFF",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#359EFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default Checkout;
