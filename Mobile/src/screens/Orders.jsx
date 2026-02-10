import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyOrders } from "../service/home/api.order";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS = {
  Pending: { bg: "#fef3c7", text: "#d97706" },
  Paid: { bg: "#dbeafe", text: "#2563eb" },
  Confirmed: { bg: "#dbeafe", text: "#2563eb" },
  Shipping: { bg: "#dbeafe", text: "#2563eb" },
  Completed: { bg: "#dcfce7", text: "#16a34a" },
  Cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

const Orders = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const take = 20;

  const fetchOrders = async (currentSkip = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (currentSkip === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getMyOrders(currentSkip, take);
      
      if (currentSkip === 0) {
        setOrders(data.items || []);
      } else {
        setOrders((prev) => [...prev, ...(data.items || [])]);
      }
      setTotal(data.total || 0);
      setSkip(currentSkip);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(0);
    }, [])
  );

  const handleRefresh = () => {
    fetchOrders(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && orders.length < total) {
      fetchOrders(skip + take);
    }
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
    });
  };

  const getStatusStyle = (status) => {
    return STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  const renderOrderCard = ({ item: order }) => {
    const statusStyle = getStatusStyle(order.status);

    return (
      <Pressable
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { orderId: order.orderId })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>#{order.orderCode}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {STATUS_MAP[order.status] || order.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <Text style={styles.orderTitle} numberOfLines={2}>
            {order.listingTitle || `Đơn hàng #${order.orderCode}`}
          </Text>
          <View style={styles.orderMeta}>
            <View style={styles.orderMetaItem}>
              <MaterialCommunityIcons name="credit-card-outline" size={14} color="#9ca3af" />
              <Text style={styles.orderMetaText}>
                {order.paymentMethod === "PayOS" ? "Online" : "COD"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalPrice}>
              {formatPrice(order.totalAmount || order.listingPrice)}
            </Text>
          </View>
          <View style={styles.viewDetailButton}>
            <Text style={styles.viewDetailText}>Chi tiết</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#359EFF" />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="package-variant" size={64} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
      <Text style={styles.emptySubtitle}>
        Hãy khám phá và mua sắm những sản phẩm yêu thích
      </Text>
      <Pressable style={styles.shopButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.shopButtonText}>Khám phá ngay</Text>
      </Pressable>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#359EFF" />
      </View>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
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
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId?.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#359EFF"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  orderDate: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  orderContent: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 16,
  },
  orderMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderMetaText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#359EFF",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#359EFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#359EFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default Orders;
