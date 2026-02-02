import { useRoute, useNavigation } from "@react-navigation/native";
import {
  Text,
  Image,
  ScrollView,
  View,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStorageContext } from "../provider/StorageProvider";
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

  const {
    addStorageData: addToFavorites,
    removeStorageData: removeFromFavorites,
    storageData: favorites,
  } = useStorageContext();

  // Fetch product details if not passed as param
  useEffect(() => {
    if (!product && params?.id) {
      const getProductDetail = async () => {
        try {
          setLoading(true);
          const data = await fetchProductById(params.id);
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
  }, [product, params?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#359EFF" />
        <Text style={{ marginTop: 12, color: "#999" }}>Đang tải...</Text>
      </View>
    );
  }

  if (!productDetail) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#666" }}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  const isFavorite = favorites?.some((fav) => fav.id === productDetail.id);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(productDetail.id);
    } else {
      addToFavorites(productDetail);
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

  // Images carousel - use productDetail.image or fallback
  const images = Array.isArray(productDetail.image)
    ? productDetail.image
    : productDetail.images || 
      (productDetail.image ? [productDetail.image] : [
        "https://via.placeholder.com/500x500?text=No+Image",
      ]);

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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#e8e8e8",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    alignSelf: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="tag"
                    size={14}
                    color="#666"
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#666",
                    }}
                  >
                    {productDetail.categoryName || productDetail.category || "Khác"}
                  </Text>
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
                Đăng bán {productDetail.createdAt || "gần đây"} • 145 lượt xem
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
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-b9u-W_zh-zRNoZOdiM91AFkt1s5jVzg1Iymv1VdCzXL2Iqj787Nv4S07RpjkkGCu5HGYPYjZwSp-AgOzz519FtYLHLoXc1zPB3iYbdTpz1XAbIWdY-aDneiK-CQJqCIMnNgLKxWAqoQLyh-RqB8e09AYIs76_87IimroaUEmepiDz2WYFs6MsA0F23psnv1fFZZBouFSbCp4Wjzmddr-trxFWbtmvPvoKO80cM3sXSTUiSjYWRyAk5FRrhAqZgrn_nTbJohIdYg",
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: "#fff",
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
                    backgroundColor: "#359EFF",
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
                  {productDetail.sellerName || "Người bán"}
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
                    name="star"
                    size={12}
                    color="#FFA500"
                  />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#111" }}>
                    4.8
                  </Text>
                  <Text style={{ fontSize: 10, color: "#999" }}>
                    (24 đánh giá)
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
                    Hãng sản xuất
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111",
                      }}
                    >
                      {productDetail.condition}
                    </Text>
                  </View>
                </View>
              )}

              {/* Negotiation */}
              {productDetail.hasNegotiation !== undefined && (
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
                      color: "#111",
                    }}
                  >
                    {productDetail.hasNegotiation ? "Có" : "Không"}
                  </Text>
                </View>
              )}
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
              {productDetail.sellerEmail && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <MaterialCommunityIcons
                    name="email"
                    size={18}
                    color="#999"
                  />
                  <Text style={{ fontSize: 12, color: "#666", flex: 1 }}>
                    {productDetail.sellerEmail}
                  </Text>
                </View>
              )}
              {productDetail.sellerPhone && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={18}
                    color="#999"
                  />
                  <Text style={{ fontSize: 12, color: "#666", flex: 1 }}>
                    {productDetail.sellerPhone}
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
          gap: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            height: 56,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#e0e0e0",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 8,
          }}
          onPress={() => navigation.navigate("Chat")}
        >
          <MaterialCommunityIcons
            name="chat-outline"
            size={20}
            color="#111"
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#111",
            }}
          >
            Chat
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 2,
            height: 56,
            borderRadius: 12,
            backgroundColor: "#359EFF",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 8,
            shadowColor: "#359EFF",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            Liên hệ người bán
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Detail;
