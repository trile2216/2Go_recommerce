import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import {
  getMyListings,
  publishListing,
  archiveListing,
  deleteListing,
} from "../service/home/api.sellerListing";

const STATUS_TABS = [
  { key: "", label: "Tất cả" },
  { key: "Draft", label: "Nháp" },
  { key: "PendingReview", label: "Chờ duyệt" },
  { key: "Active", label: "Đang bán" },
  { key: "Archived", label: "Đã ẩn" },
  { key: "Rejected", label: "Bị từ chối" },
];

const STATUS_LABEL = {
  Draft: "Nháp",
  PendingReview: "Chờ duyệt",
  Active: "Đang bán",
  Archived: "Đã ẩn",
  Rejected: "Bị từ chối",
  Deleted: "Đã xóa",
};

const STATUS_COLORS = {
  Draft: "#f3f4f6",
  PendingReview: "#fef3c7",
  Active: "#d1fae5",
  Archived: "#e5e7eb",
  Rejected: "#fee2e2",
  Deleted: "#fecaca",
};

const STATUS_TEXT_COLORS = {
  Draft: "#6b7280",
  PendingReview: "#d97706",
  Active: "#059669",
  Archived: "#4b5563",
  Rejected: "#dc2626",
  Deleted: "#991b1b",
};

const MyPost = () => {
  const navigation = useNavigation();

  // States
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [skip, setSkip] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const take = 15;

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getErrorMessage = (error) => {
    const raw =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Thao tác thất bại";
    if (typeof raw !== "string") return "Thao tác thất bại";
    return raw;
  };

  const getPublishErrorMessage = (error) => {
    const raw = getErrorMessage(error);
    if (raw.includes("Images did not pass quality checks")) {
      return "Ảnh chưa đạt chất lượng. Vui lòng cập nhật ảnh rõ nét hơn.";
    }
    if (raw.includes("Price must be greater than 0")) {
      return "Giá bán không hợp lệ. Vui lòng nhập giá >= 0.";
    }
    return raw;
  };

  const fetchListings = useCallback(
    async (status, currentSkip = 0) => {
      try {
        if (currentSkip === 0) {
          setLoading(true);
        }
        const data = await getMyListings({
          status: status || undefined,
          skip: currentSkip,
          take,
        });
        if (currentSkip === 0) {
          setListings(data.items || []);
        } else {
          setListings((prev) => [...prev, ...(data.items || [])]);
        }
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Error fetching seller listings:", err);
        Alert.alert("Lỗi", "Không thể tải danh sách bài đăng");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [take]
  );

  useFocusEffect(
    useCallback(() => {
      setListings([]);
      setSkip(0);
      fetchListings(activeTab, 0);
    }, [activeTab, fetchListings])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setSkip(0);
    fetchListings(activeTab, 0);
  };

  const handleLoadMore = () => {
    if (listings.length < total && !loading) {
      const newSkip = skip + take;
      setSkip(newSkip);
      fetchListings(activeTab, newSkip);
    }
  };

  const handlePublish = async (id) => {
    setActionLoading(id);
    try {
      await publishListing(id);
      Alert.alert("Thành công", "Đăng bài thành công!");
      fetchListings(activeTab, 0);
      setSkip(0);
    } catch (err) {
      const msg = getPublishErrorMessage(err);
      Alert.alert("Lỗi", msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id) => {
    setActionLoading(id);
    try {
      await archiveListing(id);
      Alert.alert("Thành công", "Đã ẩn bài đăng");
      fetchListings(activeTab, 0);
      setSkip(0);
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Xác nhận", "Bạn chắc muốn xóa bài đăng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setActionLoading(id);
          try {
            await deleteListing(id);
            Alert.alert("Thành công", "Đã xóa bài đăng");
            fetchListings(activeTab, 0);
            setSkip(0);
          } catch (err) {
            Alert.alert("Lỗi", getErrorMessage(err));
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const renderStatusBadge = (status) => {
    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: STATUS_COLORS[status] || "#f3f4f6",
          },
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            {
              color: STATUS_TEXT_COLORS[status] || "#6b7280",
            },
          ]}
        >
          {STATUS_LABEL[status] || status}
        </Text>
      </View>
    );
  };

  const renderListingCard = ({ item }) => {
    const isProcessing = actionLoading === item.listingId;
    const status = item.status;

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {item.primaryImage ? (
            <Image
              source={{ uri: item.primaryImage }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <MaterialCommunityIcons name="image-off" size={32} color="#9ca3af" />
            </View>
          )}
          <View style={styles.badgeContainer}>
            {renderStatusBadge(status)}
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.price !== undefined && item.price !== null && (
              <Text style={styles.price}>
                {item.price.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Text>
            )}
          </View>
          <View style={styles.metaContainer}>
            <MaterialCommunityIcons name="calendar-today" size={14} color="#9ca3af" />
            <Text style={styles.meta}>Posted {formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCardActions = (item) => {
    const isProcessing = actionLoading === item.listingId;
    const status = item.status;

    return (
      <View style={styles.cardActions}>
        {(status === "Draft" || status === "Rejected") && (
          <>
            <Pressable
              style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => navigation.navigate("PostListing", { editId: item.listingId })}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Sửa</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => handlePublish(item.listingId)}
              disabled={isProcessing}
            >
              {isProcessing && actionLoading === item.listingId ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color="#059669" />
                  <Text style={styles.actionButtonText}>Đăng</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.deleteButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => handleDelete(item.listingId)}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="#dc2626" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
            </Pressable>
          </>
        )}

        {status === "Active" && (
          <>
            <Pressable
              style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => handleArchive(item.listingId)}
              disabled={isProcessing}
            >
              {isProcessing && actionLoading === item.listingId ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : (
                <>
                  <MaterialCommunityIcons name="eye-off" size={18} color="#d97706" />
                  <Text style={styles.actionButtonText}>Ẩn</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => navigation.navigate("PostListing", { editId: item.listingId })}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Sửa</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.deleteButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => handleDelete(item.listingId)}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="#dc2626" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
            </Pressable>
          </>
        )}

        {status !== "Active" && status !== "Draft" && status !== "Rejected" && (
          <Pressable
            style={[styles.actionButton, styles.deleteButton, isProcessing && styles.actionButtonDisabled]}
            onPress={() => handleDelete(item.listingId)}
            disabled={isProcessing}
          >
            <MaterialCommunityIcons name="trash-can" size={18} color="#dc2626" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
          </Pressable>
        )}
      </View>
    );
  };

  if (loading && listings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải bài đăng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Bài đăng của tôi</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="magnify" size={24} color="#6b7280" />
          </Pressable>
          <Pressable style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#6b7280" />
          </Pressable>
        </View>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.segmentedContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentedControl}
        >
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.segmentedTab,
                activeTab === tab.key && styles.segmentedTabActive,
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                setListings([]);
                setSkip(0);
              }}
            >
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === tab.key && styles.segmentedTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {listings.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="store-outline" size={48} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
          <Text style={styles.emptyDescription}>
            Bắt đầu bán hàng bằng cách tạo bài đăng đầu tiên
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => navigation.navigate("PostListing")}
          >
            <Text style={styles.emptyButtonText}>Đăng tin ngay</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
            />
          }
        >
          <View style={styles.listContainer}>
            {listings.map((item) => (
              <View key={item.listingId} style={styles.cardWrapper}>
                {renderListingCard({ item })}
                {renderCardActions(item)}
              </View>
            ))}
          </View>

          {loading && listings.length > 0 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}

          {listings.length < total && !loading && (
            <Pressable
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
            >
              <Text style={styles.loadMoreBtnText}>Xem thêm</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerBackBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  segmentedContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentedTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedTabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    whiteSpace: "nowrap",
  },
  segmentedTabTextActive: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  listContainer: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    gap: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImage: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 20,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4b5563",
  },
  deleteButtonText: {
    color: "#dc2626",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreBtn: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4b5563",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default MyPost;
