import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const Favorites = () => {
  const navigation = useNavigation();
  const { favorites, removeFromFavorites, isFavorited } = useFavorites();
  const [loading, setLoading] = useState(false);

  const handleRemoveFavorite = (productId) => {
    Alert.alert(
      "Xóa khỏi yêu thích",
      "Bạn có muốn xóa sản phẩm này khỏi danh sách yêu thích?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            removeFromFavorites(productId);
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const FavoriteCard = ({ product }) => {
    const productImage = product.primaryImageUrl || 
      product.image || 
      product.images?.[0]?.imageUrl || 
      "https://via.placeholder.com/120x120?text=No+Image";
    
    const productId = product.listingId || product.id;

    return (
      <Pressable
        style={{
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
        onPress={() => navigation.navigate("Detail", { product: { ...product, id: productId } })}
      >
        <View style={{ flexDirection: "row", gap: 16, padding: 16 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 8,
              backgroundColor: "#f0f0f0",
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: productImage }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
              }}
            />
          </View>

          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111",
                  marginBottom: 6,
                }}
                numberOfLines={2}
              >
                {product.title || product.name}
              </Text>
              
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#359EFF",
                  marginBottom: 8,
                }}
              >
                {formatPrice(product.price)}
              </Text>
              
              {product.categoryName && (
                <View
                  style={{
                    backgroundColor: "#f0f4ff",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: "#359EFF",
                    }}
                  >
                    {product.categoryName}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              <Pressable
                onPress={() => handleRemoveFavorite(productId)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#fff2f2",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ffe0e0",
                }}
              >
                <MaterialCommunityIcons
                  name="heart"
                  size={20}
                  color="#f56565"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7f8" }}>
      <SafeAreaView
        style={{
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <MaterialCommunityIcons name="heart" size={28} color="#f56565" />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#111",
              }}
            >
              Yêu thích
            </Text>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#f0f4ff",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#359EFF",
                }}
              >
                {favorites?.length || 0} sản phẩm
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={{ marginTop: 12, color: "#666", fontSize: 14 }}>
            Đang tải...
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites || []}
          keyExtractor={(item) => (item.listingId || item.id)?.toString() || Math.random().toString()}
          renderItem={({ item }) => <FavoriteCard product={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          scrollIndicatorInsets={{ right: 1 }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 80,
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#f0f4ff",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={50}
                  color="#ccc"
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Chưa có sản phẩm yêu thích
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  textAlign: "center",
                  maxWidth: 250,
                  lineHeight: 20,
                }}
              >
                Hãy khám phá và thêm những sản phẩm bạn yêu thích để dễ dàng theo dõi!
              </Text>
              
              <Pressable
                style={{
                  marginTop: 24,
                  backgroundColor: "#359EFF",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 25,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => navigation.navigate("Home")}
              >
                <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Khám phá ngay
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Favorites;
