import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  RefreshControl,
  ScrollView,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../service/home/api.product";
import { fetchAllCategories } from "../service/home/api.category";
import { fetchNotifications } from "../service/home/api.notification";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const navigation = useNavigation();
  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();
  const { user } = useAuth();
  const { cartCount, fetchCartData } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      // Just fetch first page to get count of unread
      const data = await fetchNotifications(0, 50);
      const unread = (data?.items || []).filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
       console.error("Error loading notifications count:", error);
    }
  }, [user]);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProducts({ take: 50 });
      const items = Array.isArray(data) ? data : data.items || [];
      setProducts(items);
      setFilteredProducts(items);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAllCategories();
      const items = Array.isArray(data) ? data : data.items || [];
      setCategories(items);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loading) loadProducts();
      fetchCartData();
      if (user) {
        loadNotifications();
      }
    }, [loadProducts, loading, fetchCartData, loadNotifications, user])
  );

  useEffect(() => {
    loadProducts();
    loadCategories();
    
    let interval;
    if (user) {
      loadNotifications();
      interval = setInterval(() => {
        loadNotifications();
      }, 10000); // Poll every 10s for unread count
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadProducts, loadCategories, loadNotifications, user]);

  useEffect(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (p) => p.categoryId === selectedCategory || p.categoryName === selectedCategory
      );
    }

    if (searchText.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.categoryName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchText, products, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    await loadCategories();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleToggleFavorite = async (product) => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    const id = product.listingId || product.id;
    if (isFavorited(id)) {
      await removeFromFavorites(id);
    } else {
      await addToFavorites({ ...product, id });
    }
  };

  const handleCategoryPress = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const ProductCard = ({ product }) => {
    const id = product.listingId || product.id;
    const isFav = isFavorited(id);
    const image =
      product.primaryImageUrl ||
      product.images?.[0]?.imageUrl ||
      "https://via.placeholder.com/300x300.png?text=No+Image";

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => navigation.navigate("Detail", { product: { ...product, id } })}
      >
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.productImage} />

          {/* Favorite Button */}
          <Pressable
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(product)}
          >
            <MaterialCommunityIcons
              name={isFav ? "heart" : "heart-outline"}
              size={18}
              color={isFav ? "#ef4444" : "#9ca3af"}
            />
          </Pressable>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {product.title || product.name}
          </Text>

          <View style={styles.categoryRow}>
            {product.subCategoryName && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{product.subCategoryName}</Text>
              </View>
            )}
            {product.categoryName && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.categoryText}>{product.categoryName}</Text>
              </>
            )}
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color="#9ca3af" />
            <Text style={styles.locationText}>Việt Nam</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shopping" size={24} color="#359EFF" />
          </View>
          <View>
            <Text style={styles.appTitle}>2Go ReCommerce</Text>
            <Text style={styles.locationLabel}>Việt Nam</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.cartBtn} onPress={() => {
            if (!user) {
              navigation.navigate("Login");
              return;
            }
            navigation.navigate("Cart");
          }}>
            <MaterialCommunityIcons name="cart-outline" size={24} color="#374151" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable 
            style={styles.notificationBtn}
            onPress={() => {
              if (!user) {
                navigation.navigate("Login");
                return;
              }
              navigation.navigate("Notifications");
            }}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#374151" />
            {unreadCount > 0 && (
               <View style={styles.cartBadge}>
                 <Text style={styles.cartBadgeText}>
                   {unreadCount > 9 ? "9+" : unreadCount}
                 </Text>
               </View>
            )}
          </Pressable>

          <Pressable
            style={styles.addBtn}
            onPress={() => {
              if (!user) {
                navigation.navigate("Login");
                return;
              }
              navigation.navigate("AddListing");
            }}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Pressable style={styles.filterBtn}>
            <MaterialCommunityIcons name="tune-variant" size={20} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScrollView}
        contentContainerStyle={styles.categoriesContainer}
      >
        <Pressable
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            Tất cả
          </Text>
        </Pressable>

        {categories.map((cat) => (
          <Pressable
            key={cat.categoryId || cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === (cat.categoryId || cat.id) && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryPress(cat.categoryId || cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === (cat.categoryId || cat.id) && styles.categoryChipTextActive,
              ]}
            >
              {cat.name || cat.categoryName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Khám phá</Text>
        <Pressable>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );

  if (loading && !products.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#359EFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => (item.listingId || item.id)?.toString() || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListHeaderComponent={renderHeader}
        scrollIndicatorInsets={{ right: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#359EFF"]}
            tintColor="#359EFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerLoader}>
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="small" color="#359EFF" />
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(53, 158, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  locationLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#359EFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#359EFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  filterBtn: {
    padding: 4,
  },

  // Categories
  categoriesScrollView: {
    maxHeight: 50,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#359EFF",
    borderColor: "#359EFF",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  categoryChipTextActive: {
    color: "#fff",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#359EFF",
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 12,
    flex: 1,
  },

  // Grid
  columnWrapper: {
    paddingHorizontal: 12,
    gap: 12,
  },

  // Product Card
  productCard: {
    flex: 0.5,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 0.8,
    overflow: "hidden",
    borderRadius: 10,
    margin: 6,
    marginBottom: 0,
  },
  productImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Product Info
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  categoryPill: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6b7280",
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: "#9ca3af",
    fontSize: 10,
  },
  categoryText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  // States
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: "center",
  },
  spinnerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "rgba(53, 158, 255, 0.2)",
    borderTopColor: "#359EFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
