import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMyListingById, deleteListing, publishListing, archiveListing } from "../service/home/api.sellerListing";

const { width } = Dimensions.get("window");

const STATUS_MAP = {
  Draft: { label: "Nháp", color: "#6b7280", bgColor: "#f3f4f6" },
  PendingReview: { label: "Chờ duyệt", color: "#d97706", bgColor: "#fef3c7" },
  Active: { label: "Đang bán", color: "#16a34a", bgColor: "#dcfce7" },
  Reserved: { label: "Đã đặt cọc", color: "#ea580c", bgColor: "#ffedd5" },
  Sold: { label: "Đã bán", color: "#0891b2", bgColor: "#cffafe" },
  Rejected: { label: "Bị từ chối", color: "#dc2626", bgColor: "#fee2e2" },
  Archived: { label: "Đã ẩn", color: "#4b5563", bgColor: "#e5e7eb" },
  Flagged: { label: "Bị báo cáo", color: "#dc2626", bgColor: "#fee2e2" },
  Deleted: { label: "Đã xóa", color: "#dc2626", bgColor: "#fee2e2" },
};

const SellerListingDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId } = route.params || {};

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchListingDetail = async () => {
    try {
      setLoading(true);
      const data = await getMyListingById(listingId);
      setListing(data);
    } catch (error) {
      console.error("Error fetching listing detail:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin bài đăng");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (listingId) {
        fetchListingDetail();
      }
    }, [listingId])
  );

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      await publishListing(listingId);
      Alert.alert("Thành công", "Đăng bài thành công!");
      fetchListingDetail();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || "Đăng bài thất bại";
      Alert.alert("Lỗi", typeof msg === 'string' ? msg : "Đăng bài thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading(true);
      await archiveListing(listingId);
      Alert.alert("Thành công", "Đã ẩn bài đăng");
      fetchListingDetail();
    } catch (err) {
      Alert.alert("Lỗi", err?.response?.data || "Ẩn bài đăng thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xóa bài đăng?",
      "Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await deleteListing(listingId);
              Alert.alert("Thành công", "Đã xóa bài đăng");
              navigation.goBack();
            } catch (err) {
              Alert.alert("Lỗi", err?.response?.data || "Xóa bài đăng thất bại");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    if (!price || price <= 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#359EFF" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!listing) return null;

  const statusInfo = STATUS_MAP[listing.status] || { label: listing.status, color: "#4b5563", bgColor: "#e5e7eb" };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết bài đăng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusRow}>
            <Text style={styles.listingIdText}>#{listing.listingId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            <MaterialCommunityIcons name="clock-outline" size={12} /> Cập nhật: {formatDate(listing.updatedAt || listing.createdAt)}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {(listing.status === "Draft" || listing.status === "Rejected") && (
              <>
                <Pressable 
                  style={[styles.btn, styles.btnOutline]} 
                  onPress={() => navigation.navigate("PostListing", { edit: listing.listingId })}
                  disabled={actionLoading}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#359EFF" />
                  <Text style={styles.btnOutlineText}>Chỉnh sửa</Text>
                </Pressable>
                <Pressable 
                  style={[styles.btn, styles.btnPrimary]} 
                  onPress={handlePublish}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="send" size={16} color="#fff" />}
                  <Text style={styles.btnPrimaryText}>Đăng ngay</Text>
                </Pressable>
              </>
            )}

            {listing.status === "Active" && (
              <Pressable 
                style={[styles.btn, styles.btnOutline]} 
                onPress={handleArchive}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator size="small" color="#359EFF" /> : <MaterialCommunityIcons name="archive-outline" size={16} color="#359EFF" />}
                <Text style={styles.btnOutlineText}>Ẩn bài đăng</Text>
              </Pressable>
            )}

            {listing.status !== "Deleted" && (
              <Pressable 
                style={[styles.btn, styles.btnDanger]} 
                onPress={handleDelete}
                disabled={actionLoading}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#dc2626" />
                <Text style={styles.btnDangerText}>Xóa</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Media Carousel */}
        {listing.media && listing.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
            >
              {listing.media.map((item, idx) => (
                <View key={`media-${idx}`} style={styles.imageWrapper}>
                  {item.mediaType === "VIDEO" ? (
                    <View style={styles.videoPlaceholder}>
                      <MaterialCommunityIcons name="play-circle-outline" size={48} color="#9ca3af" />
                      <Text style={styles.videoText}>Video format (Chỉ xem trên nền tảng hỗ trợ)</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
                  )}
                  {item.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Ảnh bìa</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            {/* Pagination Dots */}
            {listing.media.length > 1 && (
              <View style={styles.pagination}>
                {listing.media.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      currentImageIndex === idx ? styles.activeDot : {}
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.divider} />

          {/* Attributes */}
          <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          <View style={styles.attributesGrid}>
            <View style={styles.attrRow}>
              <Text style={styles.attrLabel}>Danh mục</Text>
              <Text style={styles.attrValue}>{listing.categoryName} {'>'} {listing.subCategoryName}</Text>
            </View>
            <View style={styles.attrRow}>
              <Text style={styles.attrLabel}>Tình trạng</Text>
              <Text style={styles.attrValue}>{listing.condition === "new" ? "Mới" : "Đã sử dụng"}</Text>
            </View>
            <View style={styles.attrRow}>
              <Text style={styles.attrLabel}>Thương hiệu</Text>
              <Text style={styles.attrValue}>{listing.brand || "Không có"}</Text>
            </View>
            
            {listing.attributes?.map((attr, idx) => (
              <View key={`attr-${idx}`} style={styles.attrRow}>
                <Text style={styles.attrLabel}>{attr.name}</Text>
                <Text style={styles.attrValue}>{attr.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Location */}
          <Text style={styles.sectionTitle}>Địa điểm</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#6b7280" />
            <Text style={styles.locationText}>{listing.sellerAddress || "Chưa cập nhật địa chỉ"}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827", flex: 1, textAlign: "center" },
  statusBar: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  listingIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnOutline: {
    borderColor: "#359EFF",
    backgroundColor: "#eff6ff",
  },
  btnOutlineText: { color: "#359EFF", fontSize: 14, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "#359EFF",
    borderColor: "#359EFF",
  },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btnDanger: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  btnDangerText: { color: "#dc2626", fontSize: 14, fontWeight: "600" },
  mediaContainer: {
    backgroundColor: "#fff",
    marginBottom: 8,
    position: "relative",
  },
  imageWrapper: {
    width,
    height: width,
    position: "relative",
    backgroundColor: "#f9fafb",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  videoText: { marginTop: 8, color: "#9ca3af", fontSize: 14 },
  primaryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#359EFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "#359EFF",
    width: 16,
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 28,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#dc2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  attributesGrid: {
    gap: 12,
  },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  attrLabel: {
    fontSize: 14,
    color: "#6b7280",
    width: "35%",
  },
  attrValue: {
    fontSize: 14,
    color: "#111827",
    width: "65%",
    fontWeight: "500",
    textAlign: "right",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: "#4b5563",
    flex: 1,
  },
});

export default SellerListingDetail;
