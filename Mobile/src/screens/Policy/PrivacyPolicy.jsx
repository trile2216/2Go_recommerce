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

export default function PrivacyPolicy() {
  const navigation = useNavigation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@2go.vn');
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
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Cập nhật lần cuối: 28/02/2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin thu thập</Text>
          <Text style={styles.text}>Chúng tôi thu thập:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Thông tin tài khoản:</Text> họ tên,
              email, số điện thoại
            </Text>
            <Text style={styles.bulletText}>• Thông tin giao dịch</Text>
            <Text style={styles.bulletText}>• Lịch sử thanh toán</Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Dữ liệu kỹ thuật:</Text> IP, thiết bị,
              log truy cập
            </Text>
            <Text style={styles.bulletText}>
              • <Text style={styles.bold}>Nội dung do người dùng tạo:</Text> hình
              ảnh, chat, đánh giá
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Mục đích sử dụng</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Xác thực tài khoản</Text>
            <Text style={styles.bulletText}>
              • Xử lý thanh toán & vận chuyển
            </Text>
            <Text style={styles.bulletText}>• Phòng chống gian lận</Text>
            <Text style={styles.bulletText}>
              • Cải thiện trải nghiệm người dùng
            </Text>
            <Text style={styles.bulletText}>• Hỗ trợ khách hàng</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Chia sẻ dữ liệu</Text>
          <Text style={styles.text}>
            Chúng tôi có thể chia sẻ dữ liệu với:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Đối tác thanh toán</Text>
            <Text style={styles.bulletText}>• Đối tác vận chuyển</Text>
            <Text style={styles.bulletText}>
              • Nhà cung cấp dịch vụ công nghệ
            </Text>
            <Text style={styles.bulletText}>
              • Cơ quan nhà nước khi có yêu cầu hợp pháp
            </Text>
          </View>
          <View style={styles.highlight}>
            <Text style={styles.highlightIcon}>🔒</Text>
            <Text style={styles.highlightText}>
              Chúng tôi <Text style={styles.bold}>không bán dữ liệu cá nhân</Text>{' '}
              cho bên thứ ba.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Lưu trữ & bảo mật</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Dữ liệu được lưu trữ trên hạ tầng bảo mật tiêu chuẩn.
            </Text>
            <Text style={styles.bulletText}>
              • Áp dụng mã hóa và kiểm soát truy cập nội bộ.
            </Text>
            <Text style={styles.bulletText}>
              • Dữ liệu giao dịch được lưu tối thiểu{' '}
              <Text style={styles.bold}>05 năm</Text> theo yêu cầu pháp luật (nếu
              áp dụng).
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Quyền của người dùng</Text>
          <Text style={styles.text}>Người dùng có quyền:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Yêu cầu chỉnh sửa thông tin</Text>
            <Text style={styles.bulletText}>• Yêu cầu xóa tài khoản</Text>
            <Text style={styles.bulletText}>
              • Yêu cầu cung cấp dữ liệu cá nhân
            </Text>
            <Text style={styles.bulletText}>
              • Rút lại sự đồng ý xử lý dữ liệu (trong phạm vi pháp luật cho
              phép)
            </Text>
          </View>
          <Text style={styles.text}>
            Để thực hiện các quyền trên, vui lòng liên hệ:{' '}
            <Text style={styles.linkText} onPress={handleEmailPress}>
              support@2go.vn
            </Text>
          </Text>
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
  lastUpdated: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 20,
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
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#16a34a',
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});