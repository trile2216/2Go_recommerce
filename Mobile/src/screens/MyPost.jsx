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
  FlatList,
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
          <Text style={styles.title} numberOfLines={2}>
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

          <View style={styles.metaContainer}>
            <Text style={styles.meta}>Ngày: {formatDate(item.createdAt)}</Text>
            {item.updatedAt && (
              <Text style={styles.meta}>Cập nhật: {formatDate(item.updatedAt)}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {(status === "Draft" || status === "Rejected") && (
            <>
              <Pressable
                style={[styles.actionBtn, styles.editBtn, isProcessing && styles.disabled]}
                onPress={() => navigation.navigate("PostListing", { editId: item.listingId })}
                disabled={isProcessing}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#2563eb" />
              </Pressable>
              <Pressable
                style={[
                  styles.actionBtn,
                  styles.publishBtn,
                  isProcessing && styles.disabled,
                ]}
                onPress={() => handlePublish(item.listingId)}
                disabled={isProcessing}
              >
                {isProcessing && actionLoading === item.listingId ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <MaterialCommunityIcons name="send" size={16} color="#059669" />
                )}
              </Pressable>
            </>
          )}

          {status === "Active" && (
            <>
              <Pressable
                style={[
                  styles.actionBtn,
                  styles.archiveBtn,
                  isProcessing && styles.disabled,
                ]}
                onPress={() => handleArchive(item.listingId)}
                disabled={isProcessing}
              >
                {isProcessing && actionLoading === item.listingId ? (
                  <ActivityIndicator size="small" color="#d97706" />
                ) : (
                  <MaterialCommunityIcons name="archive" size={16} color="#d97706" />
                )}
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.viewBtn]}
                onPress={() =>
                  navigation.navigate("Detail", { listingId: item.listingId })
                }
              >
                <MaterialCommunityIcons name="eye" size={16} color="#7c3aed" />
              </Pressable>
            </>
          )}

          {(status === "Draft" || status === "PendingReview") && (
            <Pressable
              style={[styles.actionBtn, styles.viewBtn]}
              onPress={() =>
                navigation.navigate("Detail", { listingId: item.listingId })
              }
            >
              <MaterialCommunityIcons name="eye" size={16} color="#7c3aed" />
            </Pressable>
          )}

          {status !== "Deleted" && (
            <Pressable
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                isProcessing && styles.disabled,
              ]}
              onPress={() => handleDelete(item.listingId)}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="trash-can" size={16} color="#dc2626" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (loading && listings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
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
        <View>
          <Text style={styles.title}>Bài đăng của tôi</Text>
          <Text style={styles.subtitle}>Quản lý bài đăng bán hàng</Text>
        </View>
        <Pressable
          style={styles.createBtn}
          onPress={() => navigation.navigate("PostListing")}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Đăng tin</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView
        style={styles.tabsContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key);
              setListings([]);
              setSkip(0);
            }}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
        <View style={styles.content}>
          <Text style={styles.countText}>
            Hiển thị {listings.length} / {total} bài đăng
          </Text>

          <FlatList
            data={listings}
            renderItem={renderListingCard}
            keyExtractor={(item) => item.listingId.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#359EFF"]}
              />
            }
          />

          {loading && listings.length > 0 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#359EFF" />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ff6b35",
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 0,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#ff6b35",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#ff6b35",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  countText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    flexDirection: "row",
    gap: 12,
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
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
    top: 4,
    left: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardBody: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 0,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d32f2f",
    marginBottom: 4,
  },
  metaContainer: {
    gap: 2,
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
  },
  actionsContainer: {
    paddingRight: 8,
    justifyContent: "center",
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  publishBtn: {
    borderColor: "#059669",
    backgroundColor: "#ecfdf5",
  },
  archiveBtn: {
    borderColor: "#d97706",
    backgroundColor: "#fffbeb",
  },
  deleteBtn: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  viewBtn: {
    borderColor: "#7c3aed",
    backgroundColor: "#f5f3ff",
  },
  disabled: {
    opacity: 0.5,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
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
    backgroundColor: "#ff6b35",
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default MyPost;
