import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PricingPolicy() {
  const navigation = useNavigation();

  const pricingPlans = [
    {
      name: 'Basic',
      price: '0 VND',
      period: '/tháng',
      badge: 'Miễn phí',
      badgeColor: '#6b7280',
      features: [
        '✓ 02 bài đăng/tháng',
        '✓ Hiển thị tiêu chuẩn',
        '✓ Hỗ trợ cơ bản',
      ],
    },
    {
      name: 'Premium',
      price: '33.000₫',
      period: '/tháng',
      badge: 'Phổ biến',
      badgeColor: '#16a34a',
      features: [
        '✓ Tối đa 07 bài đăng',
        '✓ AI chống spam & phát hiện nội dung trùng lặp',
        '✓ So sánh giá tham khảo thị trường',
        '✓ Ưu tiên duyệt bài nhanh hơn',
      ],
    },
    {
      name: 'Pro',
      price: '55.000₫',
      period: '/tháng',
      badge: 'Pro',
      badgeColor: '#2563eb',
      features: [
        '✓ Tối đa 15 bài đăng',
        '✓ AI chống spam & phân tích giá nâng cao',
        '✓ Boosted Listing (ưu tiên hiển thị)',
        '✓ Hỗ trợ vận chuyển đồ cồng kềnh với chiết khấu',
        '✓ Hỗ trợ khách hàng ưu tiên',
      ],
    },
    {
      name: 'VIP',
      price: '88.000₫',
      period: '/tháng',
      badge: 'VIP',
      badgeColor: '#dc2626',
      features: [
        '✓ Đăng bài không giới hạn',
        '✓ Hiển thị đầu trang tìm kiếm',
        '✓ AI tối ưu hóa nội dung & đề xuất giá thông minh',
        '✓ Kiểm định chất lượng sản phẩm miễn phí',
        '✓ Hỗ trợ riêng (priority support)',
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Chính sách phí & Gói Subscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Chiến lược định giá (Freemium Model)
          </Text>
          <Text style={styles.text}>
            2GO áp dụng mô hình Freemium nhằm khuyến khích người dùng trải
            nghiệm đầy đủ quy trình giao dịch trước khi trả phí.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Người dùng mới được đăng miễn phí{' '}
              <Text style={styles.bold}>02 bài thanh lý</Text> đầu tiên.
            </Text>
            <Text style={styles.bulletText}>
              • Sau khi vượt quá giới hạn miễn phí, người dùng có thể: trả phí
              hoa hồng theo giao dịch, hoặc đăng ký gói subscription tháng.
            </Text>
          </View>
          <Text style={[styles.text, styles.bold, styles.marginTop]}>
            Mục tiêu của mô hình:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Giảm rào cản gia nhập</Text>
            <Text style={styles.bulletText}>• Tăng trải nghiệm thực tế</Text>
            <Text style={styles.bulletText}>
              • Thúc đẩy chuyển đổi sang gói trả phí
            </Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Phí hoa hồng nền tảng</Text>
          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              Mức hoa hồng: 7% trên tổng giá trị giao dịch thành công
            </Text>
          </View>
          <Text style={[styles.text, styles.bold]}>Hoa hồng được khấu trừ khi:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Giao dịch hoàn tất</Text>
            <Text style={styles.bulletText}>
              • Người mua xác nhận đã nhận hàng
            </Text>
            <Text style={styles.bulletText}>
              • Hoặc sau thời gian xác nhận tự động (nếu không có khiếu nại)
            </Text>
          </View>
          <Text style={[styles.text, styles.bold, styles.marginTop]}>
            Hoa hồng không hoàn lại trong các trường hợp:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Người bán vi phạm điều khoản
            </Text>
            <Text style={styles.bulletText}>
              • Giao dịch bị hủy do lỗi người bán
            </Text>
          </View>
        </View>

        {/* Section 3 - Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Các gói Subscription</Text>
          {pricingPlans.map((plan, index) => (
            <View key={index} style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: plan.badgeColor },
                  ]}
                >
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
              </View>
              <View style={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                  <Text key={idx} style={styles.featureText}>
                    {feature}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Điều khoản áp dụng</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Gói subscription có hiệu lực trong{' '}
              <Text style={styles.bold}>30 ngày</Text> kể từ ngày thanh toán.
            </Text>
            <Text style={styles.bulletText}>• Không hoàn phí giữa kỳ.</Text>
            <Text style={styles.bulletText}>
              • 2GO có quyền điều chỉnh giá và quyền lợi gói, nhưng phải thông báo
              trước ít nhất <Text style={styles.bold}>07 ngày</Text>.
            </Text>
            <Text style={styles.bulletText}>
              • Người dùng có thể hủy gia hạn tự động bất kỳ lúc nào.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  text: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  marginTop: {
    marginTop: 12,
  },
  bulletList: {
    marginVertical: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  highlight: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  highlightText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pricingHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  period: {
    fontSize: 14,
    color: '#6b7280',
  },
  featuresList: {
    padding: 20,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});