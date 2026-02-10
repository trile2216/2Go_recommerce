import React, { useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const navigation = useNavigation();
  const {
    cartItems,
    cartCount,
    loading,
    fetchCartData,
    removeFromCart,
    updateCart,
    clearCartData,
  } = useCart();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCartData();
    }, [fetchCartData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCartData();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.priceSnapshot || item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const handleRemoveItem = (cartItemId) => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc muốn xóa sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const result = await removeFromCart(cartItemId);
          if (!result.success) {
            Alert.alert("Lỗi", "Không thể xóa sản phẩm");
          }
        },
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: async () => {
          const result = await clearCartData();
          if (!result.success) {
            Alert.alert("Lỗi", "Không thể xóa giỏ hàng");
          }
        },
      },
    ]);
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }
    await updateCart(cartItemId, { quantity: newQuantity });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Thông báo", "Giỏ hàng trống");
      return;
    }
    navigation.navigate("Checkout", { items: cartItems });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Pressable
        onPress={() =>
          navigation.navigate("Detail", {
            listingId: item.listingId,
          })
        }
      >
        <Image
          source={{
            uri: item.imageUrl || "https://via.placeholder.com/100?text=No+Image",
          }}
          style={styles.itemImage}
        />
      </Pressable>

      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || `Sản phẩm #${item.listingId}`}
        </Text>

        {item.sellerName && (
          <Text style={styles.sellerName}>Bán bởi: {item.sellerName}</Text>
        )}

        <Text style={styles.itemPrice}>
          {formatPrice(item.priceSnapshot || item.price)}
        </Text>

        <View style={styles.quantityContainer}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.cartItemId, (item.quantity || 1) - 1)}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#374151" />
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity || 1}</Text>
          <Pressable
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.cartItemId, (item.quantity || 1) + 1)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#374151" />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.cartItemId)}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
      </Pressable>
    </View>
  );

  if (loading && cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
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
        <Text style={styles.headerTitle}>Giỏ hàng ({cartCount})</Text>
        {cartItems.length > 0 && (
          <Pressable style={styles.clearButton} onPress={handleClearCart}>
            <MaterialCommunityIcons name="delete-sweep" size={24} color="#ef4444" />
          </Pressable>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="cart-outline" size={64} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtitle}>
            Hãy khám phá và thêm sản phẩm yêu thích vào giỏ hàng
          </Text>
          <Pressable style={styles.shopButton} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.shopButtonText}>Khám phá ngay</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.cartItemId?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#359EFF"]}
              />
            }
          />

          {/* Bottom Summary */}
          <View style={styles.bottomContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng cộng ({cartCount} sản phẩm)</Text>
              <Text style={styles.summaryPrice}>{formatPrice(getTotalPrice())}</Text>
            </View>
            <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Thanh toán</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </Pressable>
          </View>
        </>
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
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 180,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 11,
    color: "#9ca3af",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#359EFF",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginHorizontal: 16,
  },
  removeButton: {
    padding: 8,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#359EFF",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#359EFF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default Cart;
