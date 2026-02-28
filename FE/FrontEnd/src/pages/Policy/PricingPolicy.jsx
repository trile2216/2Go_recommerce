import { Link } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import './PolicyPage.css';

export default function PricingPolicy() {
  return (
    <UserLayout>
      <div className="policy-page">
        <div className="policy-container">
          <nav className="policy-breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Chính sách phí dịch vụ &amp; Gói Subscription</span>
          </nav>

          <h1 className="policy-title">Chính sách phí dịch vụ &amp; Gói Subscription</h1>

          {/* Section 1 */}
          <section className="policy-section">
            <h2>1. Chiến lược định giá (Freemium Model)</h2>
            <p>2GO áp dụng mô hình Freemium nhằm khuyến khích người dùng trải nghiệm đầy đủ quy trình giao dịch trước khi trả phí.</p>
            <ul>
              <li>Người dùng mới được đăng miễn phí <strong>02 bài thanh lý</strong> đầu tiên.</li>
              <li>Sau khi vượt quá giới hạn miễn phí, người dùng có thể: trả phí hoa hồng theo giao dịch, hoặc đăng ký gói subscription tháng.</li>
            </ul>
            <p><strong>Mục tiêu của mô hình:</strong></p>
            <ul>
              <li>Giảm rào cản gia nhập</li>
              <li>Tăng trải nghiệm thực tế</li>
              <li>Thúc đẩy chuyển đổi sang gói trả phí</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="policy-section">
            <h2>2. Phí hoa hồng nền tảng</h2>
            <div className="policy-highlight">
              <strong>Mức hoa hồng: 7%</strong> trên tổng giá trị giao dịch thành công
            </div>
            <p><strong>Hoa hồng được khấu trừ khi:</strong></p>
            <ul>
              <li>Giao dịch hoàn tất</li>
              <li>Người mua xác nhận đã nhận hàng</li>
              <li>Hoặc sau thời gian xác nhận tự động (nếu không có khiếu nại)</li>
            </ul>
            <p><strong>Hoa hồng không hoàn lại trong các trường hợp:</strong></p>
            <ul>
              <li>Người bán vi phạm điều khoản</li>
              <li>Giao dịch bị hủy do lỗi người bán</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="policy-section">
            <h2>3. Các gói Subscription</h2>
            <div className="pricing-grid">
              <div className="pricing-card basic">
                <div className="pricing-badge">Miễn phí</div>
                <h3>Basic</h3>
                <div className="pricing-price">0 VND<span>/tháng</span></div>
                <ul>
                  <li>✓ 02 bài đăng/tháng</li>
                  <li>✓ Hiển thị tiêu chuẩn</li>
                  <li>✓ Hỗ trợ cơ bản</li>
                </ul>
              </div>

              <div className="pricing-card premium">
                <div className="pricing-badge popular">Phổ biến</div>
                <h3>Premium</h3>
                <div className="pricing-price">33.000₫<span>/tháng</span></div>
                <ul>
                  <li>✓ Tối đa 07 bài đăng</li>
                  <li>✓ AI chống spam &amp; phát hiện nội dung trùng lặp</li>
                  <li>✓ So sánh giá tham khảo thị trường</li>
                  <li>✓ Ưu tiên duyệt bài nhanh hơn</li>
                </ul>
              </div>

              <div className="pricing-card pro">
                <div className="pricing-badge">Pro</div>
                <h3>Pro</h3>
                <div className="pricing-price">55.000₫<span>/tháng</span></div>
                <ul>
                  <li>✓ Tối đa 15 bài đăng</li>
                  <li>✓ AI chống spam &amp; phân tích giá nâng cao</li>
                  <li>✓ Boosted Listing (ưu tiên hiển thị)</li>
                  <li>✓ Hỗ trợ vận chuyển đồ cồng kềnh với chiết khấu</li>
                  <li>✓ Hỗ trợ khách hàng ưu tiên</li>
                </ul>
              </div>

              <div className="pricing-card vip">
                <div className="pricing-badge vip-badge">VIP</div>
                <h3>VIP</h3>
                <div className="pricing-price">88.000₫<span>/tháng</span></div>
                <ul>
                  <li>✓ Đăng bài không giới hạn</li>
                  <li>✓ Hiển thị đầu trang tìm kiếm</li>
                  <li>✓ AI tối ưu hóa nội dung &amp; đề xuất giá thông minh</li>
                  <li>✓ Kiểm định chất lượng sản phẩm miễn phí</li>
                  <li>✓ Hỗ trợ riêng (priority support)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="policy-section">
            <h2>4. Điều khoản áp dụng</h2>
            <ul>
              <li>Gói subscription có hiệu lực trong <strong>30 ngày</strong> kể từ ngày thanh toán.</li>
              <li>Không hoàn phí giữa kỳ.</li>
              <li>2GO có quyền điều chỉnh giá và quyền lợi gói, nhưng phải thông báo trước ít nhất <strong>07 ngày</strong>.</li>
              <li>Người dùng có thể hủy gia hạn tự động bất kỳ lúc nào.</li>
            </ul>
          </section>
        </div>
      </div>
    </UserLayout>
  );
}
