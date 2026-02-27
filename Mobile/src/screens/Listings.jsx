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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../service/home/api.product";
import { fetchAllCategories } from "../service/home/api.category";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { addToCompare, removeFromCompare } from "../store/compareSlice";

const Listings = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialSearchText = route.params?.initialSearchText || "";

  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const dispatch = useDispatch();
  const compareItems = useSelector(state => state.compare?.items || []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and Filter states
  const [searchText, setSearchText] = useState(initialSearchText);
  const [filteredProducts, setFilteredProducts] = useState([]); // Client-side filter for fetched results
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Pagination states
  const [skip, setSkip] = useState(0);
  const TAKE = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false, searchOverride = null) => {
    try {
      if (!isRefresh && initialLoadDone && searchOverride === null) return;
      
      let currentSkip = 0;
      if (isRefresh || searchOverride !== null) {
        setSkip(0);
        setHasMore(true);
      } else {
        currentSkip = skip;
      }
      
      const currentSearch = searchOverride !== null ? searchOverride : searchText;

      setError(null);
      const data = await fetchProducts({ 
        skip: currentSkip, 
        take: TAKE, 
        search: currentSearch.trim() || undefined 
      });
      const items = Array.isArray(data) ? data : data.items || [];
      
      setProducts(items);
      setSkip(currentSkip + TAKE);
      setInitialLoadDone(true);
      
      if (items.length < TAKE) {
         setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [skip, initialLoadDone, searchText]);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    try {
      setLoadingMore(true);
      const data = await fetchProducts({ 
        skip, 
        take: TAKE,
        search: searchText.trim() || undefined 
      });
      const items = Array.isArray(data) ? data : data.items || [];
      
      if (items.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.listingId || p.id));
          const newItems = items.filter(p => !existingIds.has(p.listingId || p.id));
          return [...prev, ...newItems];
        });
        setSkip((prev) => prev + TAKE);
      }
      
      if (items.length < TAKE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more products:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, skip, searchText]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAllCategories();
      const items = Array.isArray(data) ? data : data.items || [];
      setCategories(items);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, []);

  // Client-side filtering for category and immediate visual search update (backend handles pagination search)
  useEffect(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (p) => p.categoryId === selectedCategory || p.categoryName === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    loadProducts(true, searchText);
  }, [searchText]); // Reload from API when search text changes

  useEffect(() => {
    if (!initialLoadDone && loading) {
      loadProducts();
    }
    loadCategories();
  }, [loadProducts, loadCategories, initialLoadDone, loading]);


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts(true);
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

  const handleAddToCart = async (product) => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    
    const productId = product.listingId || product.id;
    if (!productId) return;
    
    try {
      await addToCart(Number(productId), 1, product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleToggleCompare = (product) => {
    const id = product.listingId || product.id;
    const isExist = compareItems.find(item => item.id === id);
    if (isExist) {
        dispatch(removeFromCompare(id));
    } else {
        if (compareItems.length >= 5) return;
        dispatch(addToCompare({ ...product, id }));
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
    const inCart = isInCart(id);
    const inCompare = compareItems.some(item => item.id === id);

    const image =
      product.primaryImageUrl ||
      product.images?.[0]?.imageUrl ||
      "https://via.placeholder.com/300x300.png?text=No+Image";

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => navigation.navigate("Detail", { product: { ...product, id } })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.productImage} />
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
          <Pressable
            style={[styles.favoriteButton, styles.cartButton]}
            onPress={() => inCart ? navigation.navigate("Cart") : handleAddToCart(product)}
          >
            <MaterialCommunityIcons
              name={inCart ? "cart-check" : "cart-outline"}
              size={18}
              color={inCart ? "#359EFF" : "#9ca3af"}
            />
          </Pressable>
          <Pressable
            style={[styles.favoriteButton, styles.compareButton]}
            onPress={() => handleToggleCompare(product)}
          >
            <MaterialCommunityIcons
              name="scale-balance"
              size={18}
              color={inCompare ? "#10b981" : "#9ca3af"}
            />
          </Pressable>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
          </View>
        </View>

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

  const renderListHeader = () => (
    <>
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
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
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
            <Text style={[styles.categoryChipText, selectedCategory === (cat.categoryId || cat.id) && styles.categoryChipTextActive]}>
              {cat.name || cat.categoryName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
           <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
        </Pressable>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setSearchText("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
          <Pressable style={styles.filterBtn}>
            <MaterialCommunityIcons name="tune-variant" size={20} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => `product-${item.listingId || item.id || index}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListHeaderComponent={renderListHeader}
        scrollIndicatorInsets={{ right: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#359EFF"]}
            tintColor="#359EFF"
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footerLoader}>
            {loadingMore && (
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="small" color="#359EFF" />
              </View>
            )}
            {!hasMore && products.length > 0 && (
              <Text style={{ textAlign: 'center', marginVertical: 16, color: '#9ca3af', fontSize: 13 }}>Đã tải hết sản phẩm</Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  backButton: { padding: 4 },
  searchInputWrapper: {
    flex: 1,
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
  clearBtn: { padding: 4, marginHorizontal: 4 },
  filterBtn: { padding: 4 },
  categoriesScrollView: { maxHeight: 50, marginTop: 12 },
  categoriesContainer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: "#359EFF", borderColor: "#359EFF" },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  categoryChipTextActive: { color: "#fff" },
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
  errorText: { color: "#991b1b", fontSize: 12, flex: 1 },
  columnWrapper: { paddingHorizontal: 12, gap: 12 },
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
  productImage: { width: "100%", height: "100%", backgroundColor: "#f3f4f6", borderRadius: 10 },
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
  cartButton: { top: 48, backgroundColor: "rgba(255,255,255,0.95)" },
  compareButton: { top: 88, backgroundColor: "rgba(255,255,255,0.95)" },
  priceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  productInfo: { padding: 10 },
  productTitle: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 6 },
  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, flexWrap: "wrap" },
  categoryPill: { backgroundColor: "#f3f4f6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryPillText: { fontSize: 10, fontWeight: "500", color: "#6b7280" },
  dotSeparator: { marginHorizontal: 6, color: "#9ca3af", fontSize: 10 },
  categoryText: { fontSize: 11, color: "#9ca3af" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 11, color: "#9ca3af" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: "#6b7280" },
  footerLoader: { paddingVertical: 16 },
  spinnerContainer: { alignItems: "center" },
});

export default Listings;
