import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpCenter() {
  const navigation = useNavigation();

  const topics = [
    {
      icon: '👤',
      title: 'Tài khoản & bảo mật',
      items: [
        'Cách tạo tài khoản',
        'Xác minh email/số điện thoại',
        'Quên mật khẩu',
        'Bảo mật tài khoản',
      ],
    },
    {
      icon: '📦',
      title: 'Đăng bán sản phẩm',
      items: [
        'Cách tạo listing',
        'Quy định hình ảnh',
        'Nội dung bị cấm',
        'Chỉnh sửa/xóa bài đăng',
        'Lý do bài bị từ chối',
      ],
    },
    {
      icon: '🛒',
      title: 'Mua hàng & thanh toán',
      items: [
        'Quy trình đặt hàng',
        'Các phương thức thanh toán',
        'Theo dõi trạng thái giao dịch',
        'Hủy đơn hàng',
      ],
    },
    {
      icon: '🔒',
      title: 'Ký quỹ (Escrow)',
      items: [
        'Cách hoạt động của cơ chế ký quỹ',
        'Khi nào tiền được giải ngân',
        'Xử lý tranh chấp',
      ],
    },
    {
      icon: '🚚',
      title: 'Vận chuyển',
      items: [
        'Tạo yêu cầu giao hàng',
        'Theo dõi đơn',
        'Tính phí vận chuyển',
        'Giao hàng cồng kềnh',
      ],
    },
    {
      icon: '⭐',
      title: 'Đánh giá & phản hồi',
      items: [
        'Cách chấm điểm người bán',
        'Cách chỉnh sửa đánh giá',
        'Quy định chống đánh giá giả mạo',
      ],
    },
    {
      icon: '🚨',
      title: 'Báo cáo vi phạm',
      items: [
        'Báo cáo sản phẩm giả mạo',
        'Báo cáo hành vi lừa đảo',
        'Cung cấp bằng chứng',
      ],
    },
  ];

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@2go.vn');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:0123456789');
  };

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
        <Text style={styles.headerTitle}>Trung tâm trợ giúp</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.intro}>
            Chào mừng bạn đến với{' '}
            <Text style={styles.brandName}>2GO</Text> – nền tảng mua bán đồ cũ
            an toàn dành cho sinh viên. Chúng tôi hỗ trợ bạn trong suốt quá
            trình từ đăng bán đến khi hoàn tất giao dịch thông qua cơ chế ký
            quỹ (Escrow).
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Các chủ đề hỗ trợ</Text>
        
        {topics.map((topic, idx) => (
          <View key={idx} style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </View>
            {topic.items.map((item, i) => (
              <View key={i} style={styles.topicItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.topicItemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
        
        <View style={styles.contactGrid}>
          <Pressable style={styles.contactCard} onPress={handleEmailPress}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📧</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@2go.vn</Text>
            </View>
          </Pressable>

          <Pressable style={styles.contactCard} onPress={handlePhonePress}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Hotline / Zalo</Text>
              <Text style={styles.contactValue}>0xxx xxx xxx</Text>
            </View>
          </Pressable>

          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>🕐</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Giờ làm việc</Text>
              <Text style={styles.contactValue}>
                08:00 – 22:00{' \n'}(Thứ 2 – Chủ Nhật)
              </Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>⏱️</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Thời gian phản hồi</Text>
              <Text style={styles.contactValue}>Trung bình 24 giờ làm việc</Text>
            </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  brandName: {
    fontWeight: '700',
    color: '#2563eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#4b5563',
    marginRight: 8,
    marginTop: 2,
  },
  topicItemText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    lineHeight: 20,
  },
  contactGrid: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactIconText: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
});