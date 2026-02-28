import { Link } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import './PolicyPage.css';

export default function HelpCenter() {
  const topics = [
    {
      icon: '👤',
      title: 'Tài khoản & bảo mật',
      items: ['Cách tạo tài khoản', 'Xác minh email/số điện thoại', 'Quên mật khẩu', 'Bảo mật tài khoản'],
    },
    {
      icon: '📦',
      title: 'Đăng bán sản phẩm',
      items: ['Cách tạo listing', 'Quy định hình ảnh', 'Nội dung bị cấm', 'Chỉnh sửa/xóa bài đăng', 'Lý do bài bị từ chối'],
    },
    {
      icon: '🛒',
      title: 'Mua hàng & thanh toán',
      items: ['Quy trình đặt hàng', 'Các phương thức thanh toán', 'Theo dõi trạng thái giao dịch', 'Hủy đơn hàng'],
    },
    {
      icon: '🔒',
      title: 'Ký quỹ (Escrow)',
      items: ['Cách hoạt động của cơ chế ký quỹ', 'Khi nào tiền được giải ngân', 'Xử lý tranh chấp'],
    },
    {
      icon: '🚚',
      title: 'Vận chuyển',
      items: ['Tạo yêu cầu giao hàng', 'Theo dõi đơn', 'Tính phí vận chuyển', 'Giao hàng cồng kềnh'],
    },
    {
      icon: '⭐',
      title: 'Đánh giá & phản hồi',
      items: ['Cách chấm điểm người bán', 'Cách chỉnh sửa đánh giá', 'Quy định chống đánh giá giả mạo'],
    },
    {
      icon: '🚨',
      title: 'Báo cáo vi phạm',
      items: ['Báo cáo sản phẩm giả mạo', 'Báo cáo hành vi lừa đảo', 'Cung cấp bằng chứng'],
    },
  ];

  return (
    <UserLayout>
      <div className="policy-page">
        <div className="policy-container">
          <nav className="policy-breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Trung tâm trợ giúp</span>
          </nav>

          <h1 className="policy-title">Trung tâm trợ giúp</h1>
          <p className="policy-intro">
            Chào mừng bạn đến với <strong>2GO</strong> – nền tảng mua bán đồ cũ an toàn dành cho sinh viên.
            Chúng tôi hỗ trợ bạn trong suốt quá trình từ đăng bán đến khi hoàn tất giao dịch thông qua cơ chế ký quỹ (Escrow).
          </p>

          <section className="policy-section">
            <h2>Các chủ đề hỗ trợ</h2>
            <div className="help-topics-grid">
              {topics.map((topic, idx) => (
                <div key={idx} className="help-topic-card">
                  <div className="help-topic-icon">{topic.icon}</div>
                  <h3>{topic.title}</h3>
                  <ul>
                    {topic.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="policy-section">
            <h2>Liên hệ hỗ trợ</h2>
            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-card-icon">📧</div>
                <div>
                  <div className="contact-card-label">Email</div>
                  <a href="mailto:support@2go.vn" className="contact-card-value">support@2go.vn</a>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">📞</div>
                <div>
                  <div className="contact-card-label">Hotline / Zalo</div>
                  <div className="contact-card-value">0xxx xxx xxx</div>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">🕐</div>
                <div>
                  <div className="contact-card-label">Giờ làm việc</div>
                  <div className="contact-card-value">08:00 – 22:00 (Thứ 2 – Chủ Nhật)</div>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">⏱️</div>
                <div>
                  <div className="contact-card-label">Thời gian phản hồi</div>
                  <div className="contact-card-value">Trung bình 24 giờ làm việc</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </UserLayout>
  );
}
