import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchSubscriptionPlans } from "../service/home/api.subscription";
import { createSubscriptionPayment } from "../service/home/api.payment";

const Subscription = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubscriptionPlans();
      setPlans(data.items || []);
    } catch (err) {
      setError("Không thể tải gói dịch vụ. Vui lòng thử lại sau.");
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuySubscription = async (plan) => {
    try {
      setProcessingPlanId(plan.planId);
      const response = await createSubscriptionPayment("PAYOS", plan.code);
      
      if (response && response.payUrl) {
        // Open payment URL in browser
        const supported = await Linking.canOpenURL(response.payUrl);
        if (supported) {
          await Linking.openURL(response.payUrl);
        } else {
          Alert.alert("Lỗi", "Không thể mở trang thanh toán.");
        }
      } else {
        Alert.alert("Lỗi", "Không thể tạo thanh toán. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tạo thanh toán.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>Gói Hội Viên</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182ce" />
          <Text style={styles.loadingText}>Đang tải gói dịch vụ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>Gói Hội Viên</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#e53e3e" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadPlans}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>Gói Hội Viên</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#cbd5e0" />
          <Text style={styles.emptyTitle}>Chưa có gói dịch vụ</Text>
          <Text style={styles.emptyDescription}>
            Hiện tại hệ thống chưa có gói hội viên nào. Vui lòng quay lại sau.
          </Text>
          <Pressable style={styles.homeButton} onPress={() => navigation?.navigate("Home")}>
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Gói Hội Viên</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro Section */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Nâng cấp tài khoản</Text>
          <Text style={styles.introSubtitle}>
            Mở khóa nhiều tính năng hơn và tăng giới hạn đăng tin của bạn.
          </Text>
        </View>

        {/* Plans */}
        {plans.map((plan) => (
          <View
            key={plan.planId}
            style={[styles.planCard, plan.isFeatured && styles.planCardFeatured]}
          >
            {/* Featured Badge */}
            {plan.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>PHỔ BIẾN NHẤT</Text>
              </View>
            )}

            {/* Plan Header */}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
                <Text style={styles.planCurrency}>₫</Text>
              </View>
              <Text style={styles.planDuration}>/{plan.durationDays} ngày</Text>
            </View>

            {/* Plan Features */}
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#48bb78" />
                <Text style={styles.featureText}>
                  Giới hạn đăng tin:{" "}
                  <Text style={styles.featureHighlight}>
                    {plan.monthlyListingLimit ? `${plan.monthlyListingLimit} tin/tháng` : "Không giới hạn"}
                  </Text>
                </Text>
              </View>

              {plan.description && (
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#48bb78" />
                  <Text style={styles.featureText}>{plan.description}</Text>
                </View>
              )}

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#48bb78" />
                <Text style={styles.featureText}>Hỗ trợ ưu tiên</Text>
              </View>
            </View>

            {/* Action Button */}
            <Pressable
              style={[
                styles.planButton,
                plan.isFeatured ? styles.planButtonPrimary : styles.planButtonOutline,
                processingPlanId === plan.planId && styles.planButtonDisabled,
              ]}
              onPress={() => handleBuySubscription(plan)}
              disabled={processingPlanId === plan.planId}
            >
              {processingPlanId === plan.planId ? (
                <ActivityIndicator
                  size="small"
                  color={plan.isFeatured ? "#fff" : "#3182ce"}
                />
              ) : (
                <Text
                  style={[
                    styles.planButtonText,
                    plan.isFeatured ? styles.planButtonTextPrimary : styles.planButtonTextOutline,
                  ]}
                >
                  Chọn gói này
                </Text>
              )}
            </Pressable>
          </View>
        ))}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
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
  },
  introSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
    textAlign: "center",
  },
  introSubtitle: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardFeatured: {
    borderWidth: 2,
    borderColor: "#3182ce",
  },
  featuredBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#3182ce",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3182ce",
  },
  planCurrency: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3182ce",
    marginTop: 4,
  },
  planDuration: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: "#4a5568",
    marginLeft: 10,
    lineHeight: 20,
  },
  featureHighlight: {
    fontWeight: "700",
    color: "#2d3748",
  },
  planButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  planButtonPrimary: {
    backgroundColor: "#3182ce",
  },
  planButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3182ce",
  },
  planButtonDisabled: {
    opacity: 0.7,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  planButtonTextPrimary: {
    color: "#fff",
  },
  planButtonTextOutline: {
    color: "#3182ce",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#718096",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#e53e3e",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#3182ce",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3748",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  homeButton: {
    backgroundColor: "#3182ce",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Subscription;
