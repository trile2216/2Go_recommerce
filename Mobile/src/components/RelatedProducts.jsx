import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fetchProducts } from "../service/home/api.product";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4;

const RelatedProducts = ({ categoryId, currentListingId }) => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const loadRelated = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts({
          categoryId: categoryId,
          status: "Active",
          take: 8,
        });
        
        // Filter out current product
        const filtered = (data.items || []).filter(
          (item) => item.listingId !== currentListingId && item.id !== currentListingId
        );
        setProducts(filtered.slice(0, 4));
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRelated();
  }, [categoryId, currentListingId]);

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (!categoryId || (!loading && products.length === 0)) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sản phẩm liên quan</Text>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#359EFF" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.map((item) => (
            <Pressable
              key={item.listingId || item.id}
              style={styles.card}
              onPress={() => {
                navigation.push("Detail", { product: item });
              }}
            >
              <Image
                source={{ uri: item.primaryImageUrl || "https://via.placeholder.com/300?text=No+Image" }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.title || item.name}
                </Text>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loaderContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: CARD_WIDTH,
    resizeMode: "cover",
    backgroundColor: "#f5f7f8",
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
    height: 34, 
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#359EFF",
  },
});

export default RelatedProducts;
