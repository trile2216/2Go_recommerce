import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStorageContext } from "../provider/StorageProvider";
import { useState, useEffect } from "react";
import { TextInput } from "react-native-gesture-handler";
import { fetchProducts, fetchCategories } from "../service/home/api.product";

const Home = () => {
  const navigation = useNavigation();
  const {
    addStorageData: addToFavorites,
    removeStorageData: removeFromFavorites,
    storageData: favorites,
  } = useStorageContext();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([{ name: "All", id: "all", key: "all" }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Fetch products and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const productsData = await fetchProducts();
        // Handle both array and object responses
        const products = Array.isArray(productsData) 
          ? productsData 
          : (productsData.items || productsData.data || []);
        setAllProducts(products);
        setFilteredProducts(products);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter products based on category and search text
  useEffect(() => {
    let filtered = allProducts;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (product) =>
          product.categoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
          product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchText.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          product.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchText, allProducts]);

  const navigateToDetail = (product) => {
    navigation.navigate("Detail", { product });
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const ProductCard = ({ product }) => {
    const isFavorite = favorites?.some((fav) => fav.id === product.id);

    const productImage = product.image || product.images?.[0] || 
      "https://via.placeholder.com/300x300?text=No+Image";

    return (
      <Pressable
        onPress={() => navigateToDetail(product)}
        style={{
          flex: 1,
          backgroundColor: "#fff",
          borderRadius: 12,
          marginBottom: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#f0f0f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Favorite Button */}
        <Pressable
          onPress={() => {
            if (isFavorite) {
              removeFromFavorites(product.id);
            } else {
              addToFavorites(product);
            }
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: 20,
            padding: 8,
            backdropFilter: "blur(4px)",
          }}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#FF4444" : "#999"}
          />
        </Pressable>

        {/* Image */}
        <View
          style={{
            width: "100%",
            aspectRatio: 4 / 5,
            backgroundColor: "#f0f0f0",
            overflow: "hidden",
          }}
        >
          <Image
            source={{
              uri: productImage,
            }}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "cover",
            }}
          />

          {/* Price Badge */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {formatPrice(product.price)}
            </Text>
          </View>

          {/* Condition Badge */}
          {product.condition && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "#359EFF",
                paddingVertical: 2,
                paddingHorizontal: 6,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {product.condition}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#222",
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {product.title || product.name}
          </Text>

          {/* Category and Brand */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
            {product.brand && (
              <View
                style={{
                  backgroundColor: "#f0f0f0",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#666" }}>
                  {product.brand}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 10, color: "#999" }}>•</Text>
            <Text style={{ fontSize: 10, color: "#999" }}>
              {product.categoryName || product.category || "Khác"}
            </Text>
          </View>

          {/* Location */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MaterialCommunityIcons name="map-marker" size={12} color="#999" />
            <Text style={{ fontSize: 10, color: "#999" }} numberOfLines={1}>
              {product.location || "Hồ Chí Minh"}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        }}
      >
        {/* Header Title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("../../assets/logo.jpg")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                resizeMode: "contain",
              }}
            />
            <View>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111" }}>
                Thanh lí nhanh - Mua đồ lành
              </Text>
              <Text style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
                Thu Duc, HCM City
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="bell" size={24} color="#666" />
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#FF4444",
                }}
              />
            </Pressable>
            
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 40,
            }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#999" />
            <Pressable
              style={{
                flex: 1,
                paddingHorizontal: 8,
                height: 40,
                justifyContent: "center",
              }}
            >
              <TextInput
                style={{ fontSize: 14, color: "#999" }}
                placeholder="Tìm kiếm sản phẩm..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </Pressable>
            <MaterialCommunityIcons name="tune" size={20} color="#999" />
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id || cat.name}
              onPress={() => setSelectedCategory(cat.name)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  selectedCategory === cat.name ? "#359EFF" : "#fff",
                borderWidth: selectedCategory === cat.name ? 0 : 1,
                borderColor: "#ddd",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color:
                    selectedCategory === cat.name ? "#000" : "#666",
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Hot Picks Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#222" }}>
            Hot Picks for You
          </Text>
          <Pressable>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#359EFF" }}>
              View all
            </Text>
          </Pressable>
        </View>

        {/* Product Grid */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 40,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="large" color="#359EFF" />
                  <Text style={{ marginTop: 12, color: "#999" }}>
                    Đang tải sản phẩm...
                  </Text>
                </>
              ) : (
                <Text style={{ color: "#999", textAlign: "center" }}>
                  {error || "Không tìm thấy sản phẩm"}
                </Text>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
};

export default Home;
