import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getMyReports, replyReport } from "../service/home/api.report";
import { useAuth } from "../context/AuthContext";

const STATUS_MAP = {
  Open: { label: "Mở", color: "#eab308", bgColor: "#fef08a" },
  InReview: { label: "Đang xem xét", color: "#3b82f6", bgColor: "#bfdbfe" },
  WaitingOtherParty: { label: "Chờ phản hồi", color: "#f97316", bgColor: "#ffedd5" },
  Resolved: { label: "Đã giải quyết", color: "#10b981", bgColor: "#d1fae5" },
  Rejected: { label: "Từ chối", color: "#ef4444", bgColor: "#fee2e2" },
};

const PAGE_SIZE = 10;

const MyReports = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Reply state
  const [replyingId, setReplyingId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Evidence expand state
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      const currentSkip = isRefresh ? 0 : skip;
      if (isRefresh) setLoading(true);

      const data = await getMyReports(currentSkip, PAGE_SIZE);
      const items = data.items || [];
      
      setTotal(data.total || 0);

      if (isRefresh) {
        setReports(items);
      } else {
        setReports((prev) => [...prev, ...items]);
      }

      setSkip(currentSkip + PAGE_SIZE);
      if (items.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [skip]);

  useEffect(() => {
    fetchReports(true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchReports();
    }
  };

  const handleReply = async (reportId) => {
    if (!replyMessage.trim()) return;
    try {
      setReplySending(true);
      await replyReport(reportId, replyMessage.trim());
      Alert.alert("Thành công", "Đã gửi phản hồi thành công!");
      setReplyingId(null);
      setReplyMessage("");
      // Refresh to update status
      fetchReports(true);
    } catch (error) {
      console.error("Error replying to report:", error);
      Alert.alert("Lỗi", "Không thể gửi phản hồi");
    } finally {
      setReplySending(false);
    }
  };

  const toggleEvidence = (reportId) => {
    setExpandedEvidence((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const getStatusInfo = (status) => {
    return STATUS_MAP[status] || { label: status || "Không rõ", color: "#6b7280", bgColor: "#e5e7eb" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item: report }) => {
    const statusInfo = getStatusInfo(report.status);
    const hasEvidence = report.evidenceUrls && report.evidenceUrls.length > 0;
    const isExpanded = expandedEvidence[report.reportId];
    const needsReply = report.waitingForUserId === user?.userId;

    return (
      <View style={[styles.card, needsReply && styles.cardNeedsReply]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.reportId}>Phiếu #{report.reportId}</Text>
          <View style={[styles.badge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Reason */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Lý do:</Text>
          <Text style={styles.reasonText}>{report.reason || "Không có lý do"}</Text>
        </View>

        {/* Evidence */}
        {hasEvidence && (
          <View style={styles.evidenceContainer}>
            <Pressable style={styles.evidenceToggle} onPress={() => toggleEvidence(report.reportId)}>
              <MaterialCommunityIcons name="image-multiple" size={16} color="#4b5563" />
              <Text style={styles.evidenceToggleText}>Bằng chứng ({report.evidenceUrls.length})</Text>
              <MaterialCommunityIcons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#4b5563" 
              />
            </Pressable>
            {isExpanded && (
              <View style={styles.evidenceGallery}>
                {report.evidenceUrls.map((url, idx) => (
                  <Pressable key={idx} onPress={() => Linking.openURL(url)}>
                    <Image source={{ uri: url }} style={styles.evidenceImage} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Reply Prompt */}
        {needsReply && (
          <View style={styles.replyPrompt}>
            <View style={styles.replyNotice}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#b45309" />
              <Text style={styles.replyNoticeText}>Phiếu này đang chờ phản hồi từ bạn</Text>
            </View>
            
            {replyingId === report.reportId ? (
              <View style={styles.replyForm}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Nhập nội dung phản hồi..."
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.replyActions}>
                  <Pressable 
                    style={styles.replyCancelBtn} 
                    onPress={() => { setReplyingId(null); setReplyMessage(""); }}
                    disabled={replySending}
                  >
                    <Text style={styles.replyCancelBtnText}>Hủy</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.replySubmitBtn, (!replyMessage.trim() || replySending) && styles.replyBtnDisabled]} 
                    onPress={() => handleReply(report.reportId)}
                    disabled={replySending || !replyMessage.trim()}
                  >
                    {replySending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="send" size={14} color="#fff" />
                        <Text style={styles.replySubmitBtnText}>Gửi phản hồi</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.replyBtn} onPress={() => { setReplyingId(report.reportId); setReplyMessage(""); }}>
                <MaterialCommunityIcons name="reply" size={16} color="#fff" />
                <Text style={styles.replyBtnText}>Phản hồi ngay</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Pressable style={styles.orderLink} onPress={() => navigation.navigate("OrderDetail", { orderId: report.orderId })}>
            <MaterialCommunityIcons name="shopping-outline" size={14} color="#359EFF" />
            <Text style={styles.orderLinkText}>Đơn hàng #{report.orderId}</Text>
          </Pressable>
          <Text style={styles.dateText}>{formatDate(report.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Phiếu báo cáo</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#359EFF" />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => `report-${item.reportId}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-alert-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Chưa có báo cáo nào</Text>
                <Text style={styles.emptyDesc}>Bạn có thể báo cáo người bán từ chi tiết đơn hàng nếu gặp vấn đề.</Text>
              </View>
            }
            ListFooterComponent={
               <View style={styles.footerLoader}>
                {loadingMore && <ActivityIndicator size="small" color="#359EFF" />}
                {!hasMore && reports.length > 0 && <Text style={styles.endText}>Đã tải hết báo cáo</Text>}
               </View>
            }
          />
        )}
      </KeyboardAvoidingView>
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
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardNeedsReply: {
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reportId: { fontSize: 14, fontWeight: "700", color: "#374151" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  reasonContainer: { marginBottom: 12 },
  reasonLabel: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
  reasonText: { fontSize: 14, color: "#111827", lineHeight: 20 },
  evidenceContainer: { backgroundColor: "#f9fafb", borderRadius: 8, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: "#f3f4f6" },
  evidenceToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  evidenceToggleText: { fontSize: 13, fontWeight: "500", color: "#4b5563", flex: 1 },
  evidenceGallery: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  evidenceImage: { width: 60, height: 60, borderRadius: 6, backgroundColor: "#e5e7eb" },
  replyPrompt: { backgroundColor: "#fffbeb", borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fef3c7" },
  replyNotice: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  replyNoticeText: { fontSize: 13, color: "#92400e", fontWeight: "500" },
  replyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f59e0b", paddingVertical: 8, borderRadius: 6 },
  replyBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  replyForm: { marginTop: 4 },
  replyInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10, fontSize: 14, minHeight: 80, marginBottom: 10 },
  replyActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  replyCancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
  replyCancelBtnText: { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  replySubmitBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#359EFF" },
  replySubmitBtnText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  replyBtnDisabled: { opacity: 0.6 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  orderLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderLinkText: { fontSize: 13, color: "#359EFF", fontWeight: "500" },
  dateText: { fontSize: 12, color: "#9ca3af" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptyDesc: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8, marginHorizontal: 20, lineHeight: 20 },
  footerLoader: { paddingVertical: 16, alignItems: "center" },
  endText: { fontSize: 12, color: "#9ca3af" },
});

export default MyReports;
