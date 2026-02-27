import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Platform,
  Alert,
  Linking,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { repairShops } from "../data/repairShopsData";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const DEFAULT_CENTER = {
  latitude: 10.762622,
  longitude: 106.660172,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Haversine formula to calculate distance (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const RepairShopMap = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const flatListRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [shopsData, setShopsData] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        let currentUserLocation = null;
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          currentUserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setUserLocation(currentUserLocation);
        }

        // Calculate distance and sort
        const lat = currentUserLocation ? currentUserLocation.latitude : DEFAULT_CENTER.latitude;
        const lon = currentUserLocation ? currentUserLocation.longitude : DEFAULT_CENTER.longitude;

        const sortedShops = repairShops
          .map((shop) => ({
            ...shop,
            distance: calculateDistance(lat, lon, shop.latitude, shop.longitude),
          }))
          .sort((a, b) => a.distance - b.distance);

        setShopsData(sortedShops);

        // Zoom to closest location or user
        if (mapRef.current) {
          const regionToUse = currentUserLocation || DEFAULT_CENTER;
          mapRef.current.animateToRegion(regionToUse, 1000);
        }
      } catch (error) {
        console.error("Error getting location:", error);
        // Fallback to default
        setShopsData(
          repairShops.map((shop) => ({
            ...shop,
            distance: calculateDistance(
              DEFAULT_CENTER.latitude,
              DEFAULT_CENTER.longitude,
              shop.latitude,
              shop.longitude
            ),
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkerPress = (shop, index) => {
    setSelectedShopId(shop.id);
    // Center map on marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: shop.latitude,
        longitude: shop.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
    // Scroll list to card
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  const handleCardPress = (shop) => {
    setSelectedShopId(shop.id);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: shop.latitude - 0.005, // Offset slightly so card doesn't cover marker
        longitude: shop.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const openDirections = (shop) => {
    const latLng = `${shop.latitude},${shop.longitude}`;
    const label = encodeURI(shop.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${latLng}`,
      android: `google.navigation:q=${latLng}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ.");
      }
    });
  };

  const renderCard = ({ item, index }) => (
    <Pressable
      style={[
        styles.card,
        selectedShopId === item.id && styles.activeCard,
      ]}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      
      <View style={styles.cardInfoRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6b7280" />
        <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
      </View>
      
      <View style={styles.cardInfoWrapper}>
         <View style={styles.cardInfoRow}>
           <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
           <Text style={styles.infoText}>{item.openHours}</Text>
         </View>
         <Text style={styles.distanceText}>
           Cách {item.distance.toFixed(1)} km
         </Text>
      </View>

      {selectedShopId === item.id && (
         <View style={styles.servicesContainer}>
            {item.services.slice(0, 3).map((service, idx) => (
               <View key={idx} style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>{service}</Text>
               </View>
            ))}
         </View>
       )}

      <View style={styles.cardActions}>
        <Pressable 
          style={styles.actionBtnOutline}
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
        >
          <MaterialCommunityIcons name="phone-outline" size={16} color="#359EFF" />
          <Text style={styles.actionBtnOutlineText}>Gọi điện</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionBtnSolid}
          onPress={() => openDirections(item)}
        >
          <MaterialCommunityIcons name="navigation-variant-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnSolidText}>Chỉ đường</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Tìm điểm sửa chữa</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#359EFF" />
            <Text style={styles.loaderText}>Đang tải bản đồ...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={userLocation || DEFAULT_CENTER}
            showsUserLocation={true}
            showsMyLocationButton={true}
            toolbarEnabled={false}
          >
            {shopsData.map((shop, index) => (
              <Marker
                key={`marker-${shop.id}`}
                coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
                onPress={() => handleMarkerPress(shop, index)}
              >
                  <View style={[styles.markerBody, selectedShopId === shop.id && styles.markerBodyActive]}>
                      <MaterialCommunityIcons 
                          name="wrench" 
                          size={18} 
                          color={selectedShopId === shop.id ? "#fff" : "#dc2626"} 
                      />
                  </View>
              </Marker>
            ))}
          </MapView>
        )}

        {!loading && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={shopsData}
              keyExtractor={(item) => `shop-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.flatListContent}
              renderItem={renderCard}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
                if (shopsData[index]) {
                  handleCardPress(shopsData[index]);
                }
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  placeholder: { width: 32 },
  mapContainer: { flex: 1 },
  map: { width: "100%", height: "100%" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#6b7280", fontSize: 14 },
  markerBody: {
      backgroundColor: "#fee2e2",
      borderRadius: 20,
      padding: 6,
      borderWidth: 2,
      borderColor: "#dc2626",
  },
  markerBodyActive: {
      backgroundColor: "#dc2626",
      borderColor: "#fff",
  },
  carouselContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
  },
  flatListContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeCard: {
    borderColor: "#359EFF",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400e",
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 6,
    flex: 1,
  },
  cardInfoWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#4b5563",
    flexShrink: 1,
    lineHeight: 18,
  },
  distanceText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#359EFF',
  },
  servicesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f3f4f6',
  },
  serviceBadge: {
      backgroundColor: '#f3f4f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  serviceBadgeText: {
      fontSize: 11,
      color: '#4b5563',
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#359EFF",
    gap: 6,
  },
  actionBtnOutlineText: {
    color: "#359EFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtnSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#359EFF",
    gap: 6,
  },
  actionBtnSolidText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default RepairShopMap;
