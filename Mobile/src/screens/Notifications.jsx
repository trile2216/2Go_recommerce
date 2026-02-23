import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatTimeAgo } from "../utils/dateUtils";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../service/home/api.notification";
import { useAuth } from "../context/AuthContext";

const Notifications = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const TAKE = 20;

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (notifications.length === 0) {
        setLoading(true);
      }

      const skip = isRefresh ? 0 : notifications.length;
      const data = await fetchNotifications(skip, TAKE);

      // Handle pagination
      if (data?.items?.length < TAKE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      const newItems = data?.items || [];
      if (isRefresh) {
        setNotifications(newItems);
      } else {
        setNotifications((prev) => {
          // Prevent duplicates
          const newUniqueItems = newItems.filter(
            (item) => !prev.some((p) => p.notificationId === item.notificationId)
          );
          return [...prev, ...newUniqueItems];
        });
      }

      // Calculate unread count globally if needed, or simply from the first page
      // Here we count unread items from the fetched data
      if (isRefresh) {
          const unread = newItems.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
      }

    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications(true);
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(() => {
    loadNotifications(true);
  }, [user]);

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      loadNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read optimistic
    if (!notification.isRead) {
      try {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await markNotificationRead(notification.notificationId);
      } catch (error) {
         console.error("Error marking read:", error);
      }
    }

    // Navigation logic based on notification type and link
    if (notification.type === "Order" && notification.link) {
         if (notification.link.includes("/seller/orders/")) {
             // Extract orderId from link
             const orderId = notification.link.split("/").pop();
             navigation.navigate("Orders"); // Simple fallback, or OrderDetail if you support passing orderId
         } else if (notification.link.includes("/orders/")) {
             const orderId = notification.link.split("/").pop();
             navigation.navigate("OrderDetail", { orderId });
         }
    } else if (notification.type === "Chat" && notification.link) {
         // Chat link formatting typically: /chat/123
         const chatId = notification.link.split("/").pop();
         navigation.navigate("Conversation", { chatId: parseInt(chatId) });
    } else if (notification.type === "Listing" && notification.link) {
         const listingId = notification.link.split("/").pop();
         navigation.navigate("Detail", { listingId });
    }
  };

  const renderItem = ({ item }) => {
    return (
      <Pressable
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  if (!user) {
     return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
                </Pressable>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Đăng nhập để xem thông báo</Text>
            </View>
        </SafeAreaView>
     )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <MaterialCommunityIcons name="check-all" size={20} color="#359EFF" />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId.toString()}
          renderItem={renderItem}
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
          ListFooterComponent={
            hasMore && !refreshing && notifications.length > 0 ? (
              <ActivityIndicator
                size="small"
                color="#359EFF"
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  markAllBtn: {
    padding: 4,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  unreadItem: {
    backgroundColor: "#f8faff",
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unreadText: {
    color: "#111",
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
});

export default Notifications;
