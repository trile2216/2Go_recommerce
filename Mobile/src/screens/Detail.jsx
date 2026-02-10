import { useRoute, useNavigation } from "@react-navigation/native";
import {
  Text,
  Image,
  ScrollView,
  View,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchProductById } from "../service/home/api.product";

const Detail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params;
  const product = params?.product;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(!product);
  const [productDetail, setProductDetail] = useState(product || null);

  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch product details if not passed as param
  useEffect(() => {
    const listingId = params?.listingId || params?.id || product?.listingId || product?.id;
    if (!product && listingId) {
      const getProductDetail = async () => {
        try {
          setLoading(true);
          const data = await fetchProductById(listingId);
          setProductDetail(data);
        } catch (err) {
          console.error("Error fetching product detail:", err);
        } finally {
          setLoading(false);
        }
      };
      getProductDetail();
    } else if (product) {
      setProductDetail(product);
      setLoading(false);
    }
  }, [product, params?.id, params?.listingId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f7f8" }}>
        <ActivityIndicator size="large" color="#359EFF" />
        <Text style={{ marginTop: 12, color: "#999" }}>Đang tải...</Text>
      </View>
    );
  }

  if (!productDetail) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f7f8" }}>
        <Text style={{ color: "#666" }}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  // Get listing ID
  const listingId = productDetail.listingId || productDetail.id;
  const isFavorite = isFavorited(listingId);

  const toggleFavorite = async () => {
    if (isFavorite) {
      await removeFromFavorites(listingId);
    } else {
      await addToFavorites({ ...productDetail, id: listingId });
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "gần đây";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "hôm nay";
    if (diffDays === 1) return "hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Get condition label
  const getConditionLabel = (condition) => {
    const conditions = {
      NEW: "Mới",
      LIKE_NEW: "Như mới",
      USED: "Đã sử dụng",
      FAIR: "Tạm ổn",
    };
    return conditions[condition] || condition;
  };

  // Build images array from media or primaryImageUrl
  const buildImages = () => {
    const imgs = [];
    
    // Add primary image first
    if (productDetail.primaryImageUrl) {
      imgs.push(productDetail.primaryImageUrl);
    }
    
    // Add from media array
    if (productDetail.media && productDetail.media.length > 0) {
      productDetail.media.forEach((m) => {
        if (m.mediaUrl && !imgs.includes(m.mediaUrl)) {
          imgs.push(m.mediaUrl);
        }
      });
    }
    
    // Fallback
    if (imgs.length === 0) {
      imgs.push("https://via.placeholder.com/500x500?text=No+Image");
    }
    
    return imgs;
  };

  const images = buildImages();

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
      {/* Fixed Top Navigation */}
      <SafeAreaView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#222" />
        </Pressable>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={toggleFavorite}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF4444" : "#222"}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {/* Hero Carousel */}
        <View
          style={{
            width: "100%",
            height: Dimensions.get("window").height * 0.45,
            backgroundColor: "#e0e0e0",
            overflow: "hidden",
          }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const slide = Math.round(
                event.nativeEvent.contentOffset.x /
                  event.nativeEvent.layoutMeasurement.width
              );
              setCurrentSlide(slide);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{
                  width: Dimensions.get("window").width,
                  height: Dimensions.get("window").height * 0.45,
                  resizeMode: "cover",
                }}
              />
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === currentSlide
                      ? "#359EFF"
                      : "rgba(255, 255, 255, 0.8)",
                  width: index === currentSlide ? 24 : 8,
                }}
              />
            ))}
          </View>
        </View>

        {/* Content Container */}
        <View
          style={{
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: "#f5f7f8",
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 120,
          }}
        >
          {/* Category Badge & Title & Price */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {productDetail.categoryName && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "#e8e8e8",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}
                    >
                      <MaterialCommunityIcons name="tag" size={12} color="#666" />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#666" }}>
                        {productDetail.categoryName}
                      </Text>
                    </View>
                  )}
                  {productDetail.subCategoryName && (
                    <View
                      style={{
                        backgroundColor: "#dbeafe",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#2563eb" }}>
                        {productDetail.subCategoryName}
                      </Text>
                    </View>
                  )}
                  {productDetail.status === "Active" && (
                    <View
                      style={{
                        backgroundColor: "#dcfce7",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#16a34a" }}>
                        Đang bán
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#111",
                    lineHeight: 32,
                  }}
                  numberOfLines={3}
                >
                  {productDetail.title || productDetail.name}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#359EFF",
                  }}
                >
                  {formatPrice(productDetail.price)}
                </Text>
                {productDetail.hasNegotiation && (
                  <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600", marginTop: 4 }}>
                    Có thể thương lượng
                  </Text>
                )}
              </View>
            </View>

            {/* Posted Time */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#999"
              />
              <Text style={{ fontSize: 12, color: "#999" }}>
                Đăng bán {formatDate(productDetail.createdAt)}
              </Text>
            </View>
          </View>

          {/* Seller Card */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              borderWidth: 1,
              borderColor: "#f0f0f0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{
                    uri: productDetail.sellerAvatarUrl || "https://via.placeholder.com/100?text=User",
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: "#fff",
                    backgroundColor: "#f3f4f6",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#22c55e",
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#111",
                  }}
                >
                  {productDetail.sellerName || `Người bán #${productDetail.sellerId}`}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={14}
                    color="#359EFF"
                  />
                  <Text style={{ fontSize: 11, color: "#999" }}>
                    Thành viên xác thực
                  </Text>
                </View>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#999"
            />
          </View>

          {/* Specifications */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#111",
                marginBottom: 12,
              }}
            >
              Thông tin chi tiết
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* Brand */}
              {productDetail.brand && (
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "#fff",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "#999",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Thương hiệu
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111",
                    }}
                  >
                    {productDetail.brand}
                  </Text>
                </View>
              )}

              {/* Condition */}
              {productDetail.condition && (
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "#fff",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "#999",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Tình trạng
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111",
                    }}
                  >
                    {getConditionLabel(productDetail.condition)}
                  </Text>
                </View>
              )}

              {/* Available Quantity */}
              {productDetail.availableQuantity && (
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "#fff",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "#999",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Số lượng
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111",
                    }}
                  >
                    {productDetail.availableQuantity}
                  </Text>
                </View>
              )}

              {/* Listing Type */}
              {productDetail.listingType && (
                <View
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: "#fff",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "#999",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Loại tin
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111",
                    }}
                  >
                    {productDetail.listingType === "SINGLE" ? "Bán lẻ" : productDetail.listingType}
                  </Text>
                </View>
              )}

              {/* Negotiation */}
              <View
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: "#fff",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#f0f0f0",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#999",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Thương lượng
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: productDetail.hasNegotiation ? "#16a34a" : "#111",
                  }}
                >
                  {productDetail.hasNegotiation ? "Có thể" : "Không"}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {productDetail.description && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#111",
                  marginBottom: 12,
                }}
              >
                Mô tả
              </Text>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 22,
                    color: "#666",
                    marginBottom: 8,
                  }}
                  numberOfLines={showFullDescription ? undefined : 3}
                >
                  {productDetail.description}
                </Text>
                <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#359EFF",
                    }}
                  >
                    {showFullDescription ? "Thu gọn" : "Xem thêm"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Safety Verification */}
          <View
            style={{
              backgroundColor: "rgba(51, 158, 255, 0.1)",
              borderWidth: 1,
              borderColor: "rgba(51, 158, 255, 0.2)",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(51, 158, 255, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={20}
                color="#359EFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#0066CC",
                  marginBottom: 4,
                }}
              >
                Đã xác minh
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#0066CC",
                  lineHeight: 16,
                }}
              >
                Người bán đã xác minh danh tính và sản phẩm đã được kiểm tra.
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#111",
                marginBottom: 12,
              }}
            >
              Thông tin người bán
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#f0f0f0",
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <MaterialCommunityIcons name="account" size={18} color="#999" />
                <Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
                  {productDetail.sellerName || `Người bán #${productDetail.sellerId}`}
                </Text>
              </View>
              {productDetail.sellerEmail && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <MaterialCommunityIcons name="email" size={18} color="#999" />
                  <Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
                    {productDetail.sellerEmail}
                  </Text>
                </View>
              )}
              {productDetail.sellerPhone && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <MaterialCommunityIcons name="phone" size={18} color="#999" />
                  <Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
                    {productDetail.sellerPhone}
                  </Text>
                </View>
              )}
              {!productDetail.sellerEmail && !productDetail.sellerPhone && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <MaterialCommunityIcons name="information" size={18} color="#999" />
                  <Text style={{ fontSize: 13, color: "#999", flex: 1, fontStyle: "italic" }}>
                    Liên hệ qua tin nhắn để biết thêm thông tin
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: 20,
          flexDirection: "row",
          gap: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Chat Button */}
        <Pressable
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e0e0e0",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => navigation.navigate("Chat")}
        >
          <MaterialCommunityIcons name="chat-outline" size={22} color="#111" />
        </Pressable>

        {/* Add to Cart Button */}
        <Pressable
          style={{
            flex: 1,
            height: 50,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#359EFF",
            backgroundColor: "rgba(53, 158, 255, 0.1)",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 6,
            opacity: addingToCart ? 0.7 : 1,
          }}
          onPress={async () => {
            if (addingToCart) return;
            setAddingToCart(true);
            try {
              const result = await addToCart(listingId, 1);
              if (result.success) {
                Alert.alert("Thành công", "Đã thêm vào giỏ hàng", [
                  { text: "Tiếp tục", style: "cancel" },
                  { text: "Xem giỏ hàng", onPress: () => navigation.navigate("Cart") },
                ]);
              } else {
                Alert.alert("Lỗi", result.error?.response?.data?.message || "Không thể thêm vào giỏ hàng");
              }
            } catch (err) {
              Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng");
            } finally {
              setAddingToCart(false);
            }
          }}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#359EFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="cart-plus" size={20} color="#359EFF" />
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#359EFF" }}>
                Thêm vào giỏ
              </Text>
            </>
          )}
        </Pressable>

        {/* Buy Now Button */}
        <Pressable
          style={{
            flex: 1,
            height: 50,
            borderRadius: 12,
            backgroundColor: "#359EFF",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 6,
            shadowColor: "#359EFF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
          onPress={() => {
            // Navigate to checkout with single item
            navigation.navigate("Checkout", {
              singleItem: {
                listingId: listingId,
                id: listingId,
                title: productDetail.title,
                price: productDetail.price,
                priceSnapshot: productDetail.price,
                imageUrl: productDetail.primaryImageUrl || images[0],
                quantity: 1,
              },
            });
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#fff" }}>
            Mua ngay
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
};

export default Detail;
