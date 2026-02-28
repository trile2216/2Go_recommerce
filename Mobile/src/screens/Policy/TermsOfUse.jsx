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

export default function TermsOfUse() {
  const navigation = useNavigation();

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
        <Text style={styles.headerTitle}>Quy định sử dụng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Cập nhật lần cuối: 28/02/2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Phạm vi áp dụng</Text>
          <Text style={styles.text}>
            Quy định này áp dụng cho <Text style={styles.bold}>tất cả người dùng</Text> truy cập và sử dụng dịch vụ 2GO, bao gồm người mua, người bán và các đối tác.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Tài khoản người dùng</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Người dùng phải cung cấp thông tin chính xác.
            </Text>
            <Text style={styles.bulletText}>
              • Chịu trách nhiệm bảo mật tài khoản.
            </Text>
            <Text style={styles.bulletText}>
              • Không được chia sẻ tài khoản cho người khác.
            </Text>
          </View>
          <Text style={styles.text}>
            2GO có quyền tạm khóa hoặc chấm dứt tài khoản khi phát hiện:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Gian lận</Text>
            <Text style={styles.bulletText}>• Spam</Text>
            <Text style={styles.bulletText}>• Vi phạm pháp luật</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Nội dung và sản phẩm bị cấm</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>Cấm đăng tải:</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Hàng giả, hàng nhái</Text>
            <Text style={styles.bulletText}>
              • Hàng cấm theo quy định pháp luật
            </Text>
            <Text style={styles.bulletText}>
              • Nội dung vi phạm đạo đức, kích động, lừa đảo
            </Text>
            <Text style={styles.bulletText}>
              • Thông tin sai lệch về sản phẩm
            </Text>
          </View>
          <Text style={styles.text}>
            2GO có quyền gỡ bỏ nội dung mà không cần thông báo trước nếu phát
            hiện vi phạm nghiêm trọng.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. Quy trình giao dịch & ký quỹ
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Tiền thanh toán được giữ tại hệ thống ký quỹ.
            </Text>
            <Text style={styles.bulletText}>
              • Sau khi người mua xác nhận đã nhận hàng, tiền được giải ngân cho
              người bán.
            </Text>
            <Text style={styles.bulletText}>
              • Nếu phát sinh khiếu nại, giao dịch sẽ bị tạm giữ để điều tra.
            </Text>
            <Text style={styles.bulletText}>
              • 2GO có quyền đưa ra quyết định cuối cùng dựa trên bằng chứng hai
              bên cung cấp.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Phí dịch vụ & subscription
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • Phí hoa hồng và gói subscription được công bố minh bạch.
            </Text>
            <Text style={styles.bulletText}>
              • 2GO có quyền thay đổi mức phí nhưng phải thông báo trước.
            </Text>
            <Text style={styles.bulletText}>
              • Người dùng tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp
              nhận thay đổi.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Trách nhiệm & miễn trừ</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>
              • 2GO là nền tảng trung gian kết nối.
            </Text>
            <Text style={styles.bulletText}>
              • 2GO không chịu trách nhiệm trực tiếp về chất lượng hàng hóa.
            </Text>
            <Text style={styles.bulletText}>
              • Người bán chịu trách nhiệm về tính hợp pháp và mô tả sản phẩm.
            </Text>
            <Text style={styles.bulletText}>
              • Người mua chịu trách nhiệm kiểm tra sản phẩm khi nhận hàng.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Xử lý vi phạm</Text>
          <Text style={styles.text}>Vi phạm có thể dẫn đến:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Cảnh cáo</Text>
            <Text style={styles.bulletText}>• Gỡ bài đăng</Text>
            <Text style={styles.bulletText}>• Tạm khóa tài khoản</Text>
            <Text style={styles.bulletText}>
              • Chấm dứt tài khoản vĩnh viễn
            </Text>
            <Text style={styles.bulletText}>
              • Báo cáo cơ quan chức năng (nếu cần)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Thay đổi điều khoản</Text>
          <Text style={styles.text}>
            2GO có quyền cập nhật điều khoản và sẽ thông báo trước tối thiểu{' '}
            <Text style={styles.bold}>07 ngày</Text>.
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
  warningBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
  },
});