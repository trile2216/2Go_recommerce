import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../context/AuthContext";
import { getOrderById, cancelOrder, confirmOrder, completeOrder } from "../service/home/api.order";
import { createReport } from "../service/home/api.report";
import { createRating } from "../service/home/api.rating";
import { getShippingByOrder, getGhnPrintToken } from "../service/home/api.shipping";
import { uploadImageAndGetUrl, uploadVideoAndGetUrl } from "../service/upload/api.upload";
import { createPayment } from "../service/home/api.payment";

import OrderStatusStepper, { getStatusLabel } from "../components/OrderStatusStepper";
import CreateShippingModal from "../components/CreateShippingModal";

const STATUS_MAP = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Delivering: "Đang giao hàng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS = {
  Pending: { bg: "#fef3c7", text: "#d97706", icon: "clock-outline" },
  Paid: { bg: "#dbeafe", text: "#2563eb", icon: "check-circle-outline" },
  Confirmed: { bg: "#dbeafe", text: "#2563eb", icon: "check-circle" },
  Shipping: { bg: "#dbeafe", text: "#2563eb", icon: "truck-delivery" },
  Completed: { bg: "#dcfce7", text: "#16a34a", icon: "check-decagram" },
  Cancelled: { bg: "#fee2e2", text: "#dc2626", icon: "close-circle" },
};

const OrderDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);

  // Modals
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(null);

  // Report state
  const [reportReason, setReportReason] = useState("");
  const [reportFiles, setReportFiles] = useState([]);
  const [reportUploading, setReportUploading] = useState(false);

  // Rating state
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  const fetchShipping = useCallback(async () => {
    try {
      const data = await getShippingByOrder(orderId);
      setShippingInfo(data);
    } catch (error) {
      setShippingInfo(null);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        fetchOrder();
        fetchShipping();
      }
    }, [orderId, fetchOrder, fetchShipping])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    await fetchShipping();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = () => {
    Alert.alert("Hủy đơn hàng", "Bạn có chắc chắn muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            const result = await cancelOrder(orderId);
            Alert.alert("Thành công", result.message || "Đã hủy đơn hàng");
            fetchOrder();
          } catch (error) {
            Alert.alert(
              "Lỗi",
              error.response?.data?.message || "Không thể hủy đơn hàng"
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleConfirmOrder = () => {
    Alert.alert("Xác nhận đơn hàng", "Người bán: Bạn muốn xác nhận đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          setActionLoading(true);
          try {
            const result = await confirmOrder(orderId);
            Alert.alert("Thành công", result.message || "Đã xác nhận đơn hàng");
            fetchOrder();
          } catch (error) {
            Alert.alert(
              "Lỗi",
              error.response?.data?.message || "Xác nhận đơn hàng thất bại"
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCompleteOrder = () => {
    Alert.alert(
      "Xác nhận nhận hàng",
      "Bạn đã nhận được hàng và hài lòng với sản phẩm?",
      [
        { text: "Chưa", style: "cancel" },
        {
          text: "Đã nhận hàng",
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await completeOrder(orderId);
              Alert.alert("Thành công", result.message || "Đơn hàng đã hoàn thành");
              fetchOrder();
            } catch (error) {
              Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể hoàn thành đơn hàng"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePayDeposit = async () => {
    try {
      setActionLoading(true);
      const res = await createPayment(orderId, "PAYOS"); // Backend should handle creating deposit if correctly structured
      if (res.payUrl) {
        Linking.openURL(res.payUrl);
      }
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || "Tạo thanh toán cọc thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayRemaining = async () => {
    try {
      setActionLoading(true);
      // For now assuming BE manages creating correct payment intents based on status.
      // If we need another field (since `FE` had "DEPOSIT" | "REMAINING" param not exactly matching api sig, 
      // but in `api.payment.js` it only takes `(orderId, method)`
      const res = await createPayment(orderId, "PAYOS"); 
      if (res.payUrl) {
        Linking.openURL(res.payUrl);
      }
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || "Tạo thanh toán phần còn lại thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickReportFiles = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
         // Appending to report files
         const newFiles = result.assets.map((asset) => ({
             uri: asset.uri,
             type: asset.type === "video" ? "video" : "image"
         }));
         setReportFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể chọn ảnh/video.");
    }
  };

  const removeReportFile = (index) => {
    setReportFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do báo cáo");
      return;
    }

    try {
      setActionLoading(true);
      let evidenceUrls = [];

      if (reportFiles.length > 0) {
        setReportUploading(true);
        const imageFiles = reportFiles.filter(f => f.type === "image").map((f, i) => ({
            uri: f.uri,
            type: "image/jpeg",
            name: `report_img_${Date.now()}_${i}.jpg`
        }));
        const videoFiles = reportFiles.filter(f => f.type === "video").map((f, i) => ({
            uri: f.uri,
            type: "video/mp4",
            name: `report_vid_${Date.now()}_${i}.mp4`
        }));

        if (imageFiles.length > 0) {
           const urls = await uploadImageAndGetUrl(imageFiles); // API handles multiple URIs via FormData
           evidenceUrls.push(...(Array.isArray(urls) ? urls : [urls]));
        }
        if (videoFiles.length > 0) {
           const urls = await uploadVideoAndGetUrl(videoFiles);
           evidenceUrls.push(...(Array.isArray(urls) ? urls : [urls]));
        }
        setReportUploading(false);
      }

      await createReport({
        orderId: orderId,
        targetUserId: order.sellerId, // buyer reports seller usually in this context
        reason: reportReason,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : null,
      });

      Alert.alert("Thành công", "Đã gửi báo cáo thành công!");
      setShowReportModal(false);
      setReportReason("");
      setReportFiles([]);
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || "Gửi báo cáo thất bại");
    } finally {
      setActionLoading(false);
      setReportUploading(false);
    }
  };

  const submitRating = async () => {
    if (ratingScore < 1 || ratingScore > 5) {
      Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá");
      return;
    }
    try {
      setActionLoading(true);
      await createRating({
        orderId: orderId,
        score: ratingScore,
        comment: ratingComment || null,
      });
      Alert.alert("Thành công", "Đánh giá người bán thành công!");
      setShowRatingModal(false);
      setRatingScore(0);
      setRatingComment("");
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || error.response?.data || "Đánh giá thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!shippingInfo?.trackingCode) {
      Alert.alert("Lỗi", "Không tìm thấy mã vận đơn GHN");
      return;
    }
    try {
      setActionLoading(true);
      const result = await getGhnPrintToken({ orderCodes: [shippingInfo.trackingCode] });
      if (result.printA5Url) {
         Linking.openURL(result.printA5Url);
      } else {
         Alert.alert("Lỗi", "Không thể lấy link in nhãn");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lấy nhãn vận chuyển thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    return STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle" };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#359EFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(order.status);
  
  const isBuyer = String(user?.userId) === String(order.buyerId);
  const isSeller = String(user?.userId) === String(order.sellerId);

  const buyerCanCancel = isBuyer && (order.status === "Pending" || order.status === "Paid");
  const sellerCanCancel = isSeller && (order.status === "Pending" || order.status === "Paid");
  const sellerCanConfirm = isSeller && (order.status === "Pending" || order.status === "Paid");
  const buyerCanComplete = isBuyer && order.status === "Delivered";

  const hasShipping = Boolean(shippingInfo && (shippingInfo.provider || shippingInfo.trackingCode || shippingInfo.status));

  const sellerCanCreateShipping = isSeller && !hasShipping && (
    (order.depositRequired && order.escrowStatus === "Funded") ||
    (!order.depositRequired && (order.status === "Confirmed" || order.status === "Paid"))
  );

  const buyerNeedsToPayDeposit = isBuyer && order.depositRequired && !order.depositPaid && order.status === "Pending";
  const buyerNeedsToPayRemaining = isBuyer && order.depositRequired && order.depositPaid && order.status === "Confirmed" && order.escrowStatus !== "Funded";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#359EFF"]} />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusStyle.bg }]}>
          <View style={styles.statusIconContainer}>
            <MaterialCommunityIcons name={statusStyle.icon} size={40} color={statusStyle.text} />
          </View>
          <View>
            <Text style={[styles.statusTitle, { color: statusStyle.text }]}>
              {getStatusLabel(order.status, order.paymentMethod)}
            </Text>
            <Text style={styles.statusDate}>Cập nhật: {formatDate(order.updatedAt || order.createdAt)}</Text>
          </View>
        </View>

        {/* Status Stepper */}
        <View style={styles.card}>
           <Text style={styles.cardTitle}>Trạng thái Giao hàng</Text>
           <OrderStatusStepper currentStatus={order.status} />
           
           {isSeller && order.paymentMethod === "PAYOS" && ["Confirmed", "Shipping", "Completed"].includes(order.status) && (
             <View style={styles.infoBanner}>
               <MaterialCommunityIcons name="information" size={16} color="#0369a1" />
               <Text style={styles.infoBannerText}>
                 Tiền sẽ được chuyển vào tài khoản của bạn trong 3-5 ngày làm việc sau khi đơn hàng hoàn thành.
               </Text>
             </View>
           )}
        </View>

        {/* Order Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="receipt" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng</Text>
            <Text style={styles.infoValue}>#{order.orderCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày đặt</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === "PayOS" ? "Thanh toán online" : "Thanh toán khi nhận hàng"}
            </Text>
          </View>
        </View>

        {/* Product */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Sản phẩm</Text>
          </View>

          <Pressable
            style={styles.productItem}
            onPress={() =>
              navigation.navigate("Detail", { listingId: order.listingId })
            }
          >
            <Image
              source={{
                uri: order.listingPrimaryImageUrl || "https://via.placeholder.com/80",
              }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {order.listingTitle || `Sản phẩm #${order.listingId}`}
              </Text>
              {order.sellerName && (
                <Text style={styles.sellerName}>Bán bởi: {order.sellerName}</Text>
              )}
              <Text style={styles.productPrice}>{formatPrice(order.listingPrice)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Partner Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={isBuyer ? "store" : "account"} size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>{isBuyer ? "Thông tin người bán" : "Thông tin người mua"}</Text>
          </View>

          {isBuyer && (
             <>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Người bán</Text>
                 <Text style={styles.infoValue}>{order.sellerEmail || `User #${order.sellerId}`}</Text>
               </View>
               {order.sellerPhone && (
                 <View style={styles.infoRow}>
                   <Text style={styles.infoLabel}>Liên hệ</Text>
                   <Text style={styles.infoValue}>{order.sellerPhone}</Text>
                 </View>
               )}
             </>
          )}

          {isSeller && (
             <>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Người mua</Text>
                 <Text style={styles.infoValue}>{order.buyerEmail || `User #${order.buyerId}`}</Text>
               </View>
               <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                 <Text style={styles.infoLabel}>Địa chỉ giao hàng</Text>
                 <Text style={[styles.infoValue, { marginTop: 4 }]}>{order.deliveryAddress || "Chưa cung cấp"}</Text>
               </View>
               {order.buyerPhone && (
                 <View style={styles.infoRow}>
                   <Text style={styles.infoLabel}>Điện thoại</Text>
                   <Text style={styles.infoValue}>{order.buyerPhone}</Text>
                 </View>
               )}
             </>
          )}
        </View>

        {/* Shipping Info Box */}
        {hasShipping && (
           <View style={styles.card}>
             <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="truck-fast" size={20} color="#359EFF" />
                <Text style={styles.cardTitle}>Thông tin vận chuyển</Text>
             </View>
             
             <View style={styles.infoRow}>
               <Text style={styles.infoLabel}>Đơn vị VC</Text>
               <Text style={styles.infoValue}>{shippingInfo.provider || "GHN"}</Text>
             </View>
             {shippingInfo.trackingCode && (
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Mã vận đơn</Text>
                 <Text style={styles.infoValue}>{shippingInfo.trackingCode}</Text>
               </View>
             )}
             <View style={styles.infoRow}>
               <Text style={styles.infoLabel}>Trạng thái VC</Text>
               <Text style={[styles.infoValue, { color: "#d97706" }]}>
                   {shippingInfo.status === "Requested" && "Đã yêu cầu"}
                   {shippingInfo.status === "InTransit" && "Đang giao"}
                   {shippingInfo.status === "Delivered" && "Đã giao"}
                   {shippingInfo.status === "Failed" && "Giao thất bại"}
                   {!["Requested", "InTransit", "Delivered", "Failed"].includes(shippingInfo.status) && (shippingInfo.status || "N/A")}
               </Text>
             </View>

             {isSeller && shippingInfo.trackingCode && (
                <View style={{ marginTop: 12 }}>
                   <Pressable style={styles.outlineButton} onPress={handlePrintLabel} disabled={actionLoading}>
                      <MaterialCommunityIcons name="printer" size={20} color="#359EFF" />
                      <Text style={styles.outlineButtonText}>In nhãn vận chuyển (A5)</Text>
                   </Pressable>
                </View>
             )}
           </View>
        )}

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#359EFF" />
            <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá sản phẩm</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.listingPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>Miễn phí</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount || order.listingPrice)}</Text>
          </View>
        </View>

        {/* Payment Status Box */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
             <MaterialCommunityIcons name="credit-card-check" size={20} color="#359EFF" />
             <Text style={styles.cardTitle}>Tình trạng thanh toán</Text>
           </View>
           
           <View style={styles.paymentStatusContainer}>
             {order.depositRequired && !order.depositPaid && order.depositDeadlineAt && new Date(order.depositDeadlineAt) < new Date() ? (
                <View style={[styles.paymentAlert, styles.paymentAlertError]}>
                   <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
                   <Text style={[styles.paymentAlertText, { color: "#ef4444" }]}>Quá hạn cọc – có thể bị tịch thu</Text>
                </View>
             ) : order.depositPaid && !["Completed", "Cancelled"].includes(order.status) && order.escrowStatus !== "Funded" ? (
                <View style={[styles.paymentAlert, styles.paymentAlertInfo]}>
                   <MaterialCommunityIcons name="check-circle" size={18} color="#0284c7" />
                   <Text style={[styles.paymentAlertText, { color: "#0284c7" }]}>Đã thanh toán cọc {formatPrice((order.totalAmount || 0) * 0.1)}</Text>
                </View>
             ) : order.depositPaid && (order.status === "Completed" || order.escrowStatus === "Funded") ? (
                <View style={[styles.paymentAlert, styles.paymentAlertSuccess]}>
                   <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />
                   <Text style={[styles.paymentAlertText, { color: "#16a34a" }]}>Đã thanh toán đủ</Text>
                </View>
             ) : !order.depositRequired && order.paymentMethod !== "COD" ? (
                <View style={[styles.paymentAlert, styles.paymentAlertSuccess]}>
                   <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />
                   <Text style={[styles.paymentAlertText, { color: "#16a34a" }]}>Đã thanh toán online</Text>
                </View>
             ) : order.paymentMethod === "COD" ? (
                <View style={[styles.paymentAlert, styles.paymentAlertPending]}>
                   <MaterialCommunityIcons name="circle-outline" size={18} color="#d97706" />
                   <Text style={[styles.paymentAlertText, { color: "#d97706" }]}>Thanh toán khi nhận hàng (COD)</Text>
                </View>
             ) : (
                <View style={[styles.paymentAlert, styles.paymentAlertPending]}>
                   <MaterialCommunityIcons name="circle-outline" size={18} color="#d97706" />
                   <Text style={[styles.paymentAlertText, { color: "#d97706" }]}>Chờ thanh toán</Text>
                </View>
             )}
           </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
           {/* DEPOSIT ACTION BUTTONS for Buyer */}
           {buyerNeedsToPayDeposit && (
              <View style={styles.actionGroup}>
                  <Pressable style={styles.primaryButton} onPress={handlePayDeposit} disabled={actionLoading}>
                     {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Thanh toán tiền cọc (10%)</Text>}
                  </Pressable>
                  <Text style={styles.actionHint}>Bạn cần đặt cọc trước khi người bán xác nhận đơn hàng.</Text>
              </View>
           )}

           {buyerNeedsToPayRemaining && (
              <View style={styles.actionGroup}>
                  <Pressable style={styles.primaryButton} onPress={handlePayRemaining} disabled={actionLoading}>
                     {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Thanh toán phần còn lại (90%)</Text>}
                  </Pressable>
                  <Text style={[styles.actionHint, { color: "#0369a1" }]}>Vui lòng thanh toán phần còn lại để lấy hàng.</Text>
              </View>
           )}

           {/* CONFIRM for Seller */}
           {sellerCanConfirm && (
              <Pressable style={styles.primaryButton} onPress={handleConfirmOrder} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Xác nhận đơn hàng</Text>}
              </Pressable>
           )}

           {/* CREATE SHIPPING for Seller */}
           {sellerCanCreateShipping && (
              <Pressable style={styles.primaryButton} onPress={() => setShowShippingModal(true)} disabled={actionLoading}>
                  <Text style={styles.primaryButtonText}>Tạo đơn vận chuyển</Text>
              </Pressable>
           )}

           {/* COMPLETE for Buyer */}
           {buyerCanComplete && (
              <Pressable style={[styles.primaryButton, { backgroundColor: "#16a34a" }]} onPress={handleCompleteOrder} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Đã nhận được hàng</Text>}
              </Pressable>
           )}

           {/* CANCEL for Buyer */}
           {buyerCanCancel && (
              <Pressable style={styles.dangerButton} onPress={handleCancelOrder} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#ef4444" /> : <Text style={styles.dangerButtonText}>Hủy đơn hàng</Text>}
              </Pressable>
           )}

           {/* CANCEL for Seller */}
           {sellerCanCancel && (
              <Pressable style={styles.dangerButton} onPress={handleCancelOrder} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#ef4444" /> : <Text style={styles.dangerButtonText}>Hủy đơn hàng này</Text>}
              </Pressable>
           )}

           {/* RATING for Buyer */}
           {isBuyer && order.status === "Completed" && (
              <Pressable style={styles.primaryButton} onPress={() => setShowRatingModal(true)} disabled={actionLoading}>
                  <Text style={styles.primaryButtonText}>Đánh giá người bán</Text>
              </Pressable>
           )}

           {/* REPORT for Buyer */}
           {isBuyer && order.status === "Completed" && (
              <Pressable style={[styles.primaryButton, { backgroundColor: "#f59e0b", marginTop: 12 }]} onPress={() => setShowReportModal(true)} disabled={actionLoading}>
                  <Text style={styles.primaryButtonText}>Báo cáo sản phẩm</Text>
              </Pressable>
           )}
        </View>

        {/* Contact Seller / Buyer */}
        <Pressable
          style={styles.contactButton}
          onPress={() => navigation.navigate("Chat")}
        >
          <MaterialCommunityIcons name="chat-outline" size={20} color="#359EFF" />
          <Text style={styles.contactButtonText}>{isBuyer ? "Liên hệ người bán" : "Liên hệ người mua"}</Text>
        </Pressable>
      </ScrollView>

      {/* Shipping Modal */}
      {showShippingModal && (
        <CreateShippingModal
          visible={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          order={order}
          user={user}
          onSuccess={() => {
            fetchOrder();
            fetchShipping();
          }}
        />
      )}

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Báo cáo sản phẩm</Text>
              <Pressable onPress={() => {
                 setShowReportModal(false);
                 setReportFiles([]);
                 setReportReason("");
              }}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
               <Text style={styles.modalLabel}>Lý do báo cáo</Text>
               <TextInput
                 style={styles.textArea}
                 placeholder="Mô tả lý do..."
                 value={reportReason}
                 onChangeText={setReportReason}
                 multiline
                 numberOfLines={4}
                 textAlignVertical="top"
               />

               <Text style={styles.modalLabel}>Bằng chứng (Ảnh/Video)</Text>
               <Pressable style={styles.uploadBtn} onPress={handlePickReportFiles}>
                  <MaterialCommunityIcons name="image-plus" size={24} color="#359EFF" />
                  <Text style={styles.uploadBtnText}>Chọn ảnh hoặc video</Text>
               </Pressable>

               <View style={styles.evidenceContainer}>
                 {reportFiles.map((file, index) => (
                    <View key={index} style={styles.evidenceItem}>
                       {file.type === "image" ? (
                         <Image source={{ uri: file.uri }} style={styles.evidenceImage} />
                       ) : (
                         <View style={styles.videoPlaceholder}>
                           <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
                         </View>
                       )}
                       <Pressable style={styles.removeEvidenceBtn} onPress={() => removeReportFile(index)}>
                          <MaterialCommunityIcons name="close-circle" size={20} color="#ef4444" />
                       </Pressable>
                    </View>
                 ))}
               </View>
               <View style={{height: 20}} />
            </ScrollView>
            <View style={styles.modalFooter}>
               <Pressable style={styles.cancelBtn} onPress={() => {
                 setShowReportModal(false);
                 setReportFiles([]);
                 setReportReason("");
               }}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
               </Pressable>
               <Pressable 
                  style={[styles.submitBtn, { backgroundColor: '#b45309' }, (!reportReason.trim() || actionLoading || reportUploading) && styles.disabledBtn]} 
                  onPress={submitReport}
                  disabled={!reportReason.trim() || actionLoading || reportUploading}
               >
                  {actionLoading || reportUploading ? (
                     <ActivityIndicator size="small" color="#fff" />
                  ) : (
                     <Text style={styles.submitBtnText}>Gửi báo cáo</Text>
                  )}
               </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá người bán</Text>
              <Pressable onPress={() => {
                 setShowRatingModal(false);
                 setRatingScore(0);
                 setRatingComment("");
              }}>
                <MaterialCommunityIcons name="close" size={24} color="#111" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
               <Text style={styles.modalLabel}>Chấm sao</Text>
               <View style={styles.ratingStars}>
                  {[1,2,3,4,5].map(star => (
                     <Pressable key={star} onPress={() => setRatingScore(star)}>
                        <MaterialCommunityIcons 
                          name={star <= ratingScore ? "star" : "star-outline"} 
                          size={40} 
                          color={star <= ratingScore ? "#f59e0b" : "#ccc"} 
                        />
                     </Pressable>
                  ))}
               </View>

               <Text style={[styles.modalLabel, { marginTop: 16 }]}>Nhận xét (Tùy chọn)</Text>
               <TextInput
                 style={styles.textArea}
                 placeholder="Chia sẻ trải nghiệm..."
                 value={ratingComment}
                 onChangeText={setRatingComment}
                 multiline
                 numberOfLines={3}
                 textAlignVertical="top"
               />
               <View style={{height: 20}} />
            </ScrollView>
            <View style={styles.modalFooter}>
               <Pressable style={styles.cancelBtn} onPress={() => {
                 setShowRatingModal(false);
                 setRatingScore(0);
                 setRatingComment("");
               }}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
               </Pressable>
               <Pressable 
                  style={[styles.submitBtn, { backgroundColor: '#f59e0b' }, (ratingScore === 0 || actionLoading) && styles.disabledBtn]} 
                  onPress={submitRating}
                  disabled={ratingScore === 0 || actionLoading}
               >
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Đánh giá</Text>}
               </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#359EFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#359EFF",
  },
  addressText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#359EFF",
  },
  // New Styles
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f0fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#359EFF',
    borderRadius: 8,
    gap: 8,
  },
  outlineButtonText: {
    color: '#359EFF',
    fontWeight: '600',
    fontSize: 14,
  },
  paymentStatusContainer: {
    marginTop: 4,
  },
  paymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  paymentAlertError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  paymentAlertInfo: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  paymentAlertSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  paymentAlertPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  paymentAlertText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    marginBottom: 16,
    gap: 12,
  },
  actionGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#359EFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  actionHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#359EFF",
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#359EFF",
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111",
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#359EFF",
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 8,
    backgroundColor: "#eff6ff",
  },
  uploadBtnText: {
    fontSize: 14,
    color: "#359EFF",
    fontWeight: "600",
  },
  evidenceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  evidenceItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  removeEvidenceBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4b5563",
  },
  submitBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  ratingStars: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});

export default OrderDetail;
