import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getMyRatings, getRatingsForUser } from "../service/home/api.rating";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;
const SCORE_LABELS = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất tốt",
};

const MyReviews = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("received"); // "received" | "sent"

  // Sent Reviews State
  const [sentReviews, setSentReviews] = useState([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentLoadingMore, setSentLoadingMore] = useState(false);
  const [sentSkip, setSentSkip] = useState(0);
  const [sentHasMore, setSentHasMore] = useState(true);

  // Received Reviews State
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedAvg, setReceivedAvg] = useState(0);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [receivedLoadingMore, setReceivedLoadingMore] = useState(false);
  const [receivedSkip, setReceivedSkip] = useState(0);
  const [receivedHasMore, setReceivedHasMore] = useState(true);

  const fetchSent = useCallback(async (isRefresh = false) => {
    try {
      const currentSkip = isRefresh ? 0 : sentSkip;
      if (isRefresh) setSentLoading(true);

      const data = await getMyRatings(currentSkip, PAGE_SIZE);
      const items = data.items || [];
      
      setSentTotal(data.total || 0);

      if (isRefresh) {
        setSentReviews(items);
      } else {
        setSentReviews((prev) => [...prev, ...items]);
      }

      setSentSkip(currentSkip + PAGE_SIZE);
      setSentHasMore(items.length >= PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching sent reviews:", error);
    } finally {
      setSentLoading(false);
      setSentLoadingMore(false);
    }
  }, [sentSkip]);

  const fetchReceived = useCallback(async (isRefresh = false) => {
    if (!user?.userId) return;
    try {
      const currentSkip = isRefresh ? 0 : receivedSkip;
      if (isRefresh) setReceivedLoading(true);

      const data = await getRatingsForUser(user.userId, currentSkip, PAGE_SIZE);
      const items = data.items || [];
      
      setReceivedTotal(data.total || 0);
      if (data.avgRating !== undefined) setReceivedAvg(data.avgRating);

      if (isRefresh) {
        setReceivedReviews(items);
      } else {
        setReceivedReviews((prev) => [...prev, ...items]);
      }

      setReceivedSkip(currentSkip + PAGE_SIZE);
      setReceivedHasMore(items.length >= PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching received reviews:", error);
    } finally {
      setReceivedLoading(false);
      setReceivedLoadingMore(false);
    }
  }, [user?.userId, receivedSkip]);

  useEffect(() => {
    fetchSent(true);
  }, []);

  useEffect(() => {
    fetchReceived(true);
  }, [user?.userId]);

  const handleLoadMoreReceived = () => {
    if (!receivedLoadingMore && receivedHasMore && !receivedLoading) {
      setReceivedLoadingMore(true);
      fetchReceived();
    }
  };

  const handleLoadMoreSent = () => {
    if (!sentLoadingMore && sentHasMore && !sentLoading) {
      setSentLoadingMore(true);
      fetchSent();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderStars = (score, size = 16) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <MaterialCommunityIcons
            key={s}
            name={s <= score ? "star" : "star-outline"}
            size={size}
            color={s <= score ? "#f59e0b" : "#d1d5db"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item: review }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {review.rater && (
          <View style={styles.raterInfo}>
            <View style={styles.avatarContainer}>
              {review.rater.avatarUrl ? (
                <Image source={{ uri: review.rater.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarFallback}>{review.rater.fullName?.charAt(0) || "?"}</Text>
              )}
            </View>
            <Text style={styles.raterName}>{review.rater.fullName || "Người dùng"}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.reviewMeta}>
        <View style={styles.starsRow}>
          {renderStars(review.score)}
          <Text style={styles.scoreLabel}>{SCORE_LABELS[review.score]}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
      </View>

      {review.comment ? (
        <Text style={styles.commentText}>{review.comment}</Text>
      ) : null}

      <Pressable 
        style={styles.orderLink} 
        onPress={() => navigation.navigate("OrderDetail", { orderId: review.orderId })}
      >
        <MaterialCommunityIcons name="shopping-outline" size={14} color="#359EFF" />
        <Text style={styles.orderLinkText}>Đơn hàng #{review.orderId}</Text>
      </Pressable>
    </View>
  );

  const renderEmptyObj = (text) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="star-circle-outline" size={48} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptyDesc}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Seller Profile Summary */}
      <View style={styles.profileSummary}>
        <View style={styles.profileAvatarContainer}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.profileImage} />
          ) : (
            <MaterialCommunityIcons name="account" size={32} color="#9ca3af" />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.fullName || "Người bán"}</Text>
          <View style={styles.ratingSummaryRow}>
            {receivedLoading ? (
              <Text style={styles.loadingStatsText}>Đang tải thống kê...</Text>
            ) : receivedAvg > 0 ? (
              <>
                {renderStars(Math.round(receivedAvg), 18)}
                <Text style={styles.avgScoreText}>{receivedAvg.toFixed(1)}</Text>
                <Text style={styles.totalCountText}>({receivedTotal} đánh giá)</Text>
              </>
            ) : (
              <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
            )}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === "received" && styles.tabButtonActive]}
          onPress={() => setActiveTab("received")}
        >
          <Text style={[styles.tabText, activeTab === "received" && styles.tabTextActive]}>
            Được đánh giá ({receivedTotal})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "sent" && styles.tabButtonActive]}
          onPress={() => setActiveTab("sent")}
        >
          <Text style={[styles.tabText, activeTab === "sent" && styles.tabTextActive]}>
            Đã đánh giá ({sentTotal})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {activeTab === "received" ? (
        receivedLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#359EFF" />
          </View>
        ) : (
          <FlatList
            data={receivedReviews}
            keyExtractor={(item) => `received-${item.ratingId}`}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMoreReceived}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyObj("Chưa có ai đánh giá bạn.")}
            ListFooterComponent={
              <View style={styles.footerLoader}>
                {receivedLoadingMore && <ActivityIndicator size="small" color="#359EFF" />}
              </View>
            }
          />
        )
      ) : (
        sentLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#359EFF" />
          </View>
        ) : (
          <FlatList
            data={sentReviews}
            keyExtractor={(item) => `sent-${item.ratingId}`}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMoreSent}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyObj("Bạn có thể đánh giá người bán sau khi đơn hàng đã hoàn thành.")}
            ListFooterComponent={
              <View style={styles.footerLoader}>
                {sentLoadingMore && <ActivityIndicator size="small" color="#359EFF" />}
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileSummary: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", resizeMode: "cover" },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  ratingSummaryRow: { flexDirection: "row", alignItems: "center" },
  avgScoreText: { fontSize: 15, fontWeight: "700", color: "#111827", marginLeft: 6 },
  totalCountText: { fontSize: 13, color: "#6b7280", marginLeft: 4 },
  noRatingText: { fontSize: 14, color: "#6b7280", fontStyle: "italic" },
  loadingStatsText: { fontSize: 14, color: "#9ca3af" },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: { borderBottomColor: "#359EFF" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#359EFF" },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { marginBottom: 8 },
  raterInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarFallback: { fontSize: 12, fontWeight: "bold", color: "#6b7280" },
  raterName: { fontSize: 14, fontWeight: "600", color: "#374151" },
  reviewMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreLabel: { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  dateText: { fontSize: 12, color: "#9ca3af" },
  commentText: { fontSize: 14, color: "#1f2937", lineHeight: 20, marginBottom: 12, backgroundColor: "#f9fafb", padding: 12, borderRadius: 8 },
  orderLink: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  orderLinkText: { fontSize: 13, color: "#359EFF", fontWeight: "500" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptyDesc: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8, marginHorizontal: 20, lineHeight: 20 },
  footerLoader: { paddingVertical: 16, alignItems: "center" },
});

export default MyReviews;
