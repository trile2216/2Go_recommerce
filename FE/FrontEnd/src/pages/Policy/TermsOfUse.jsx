import { Link } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import './PolicyPage.css';

export default function TermsOfUse() {
  return (
    <UserLayout>
      <div className="policy-page">
        <div className="policy-container">
          <nav className="policy-breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Quy định sử dụng</span>
          </nav>

          <h1 className="policy-title">Quy định sử dụng</h1>
          <p className="policy-last-updated">Cập nhật lần cuối: 28/02/2026</p>

          <section className="policy-section">
            <h2>1. Phạm vi áp dụng</h2>
            <p>Quy định này áp dụng cho <strong>tất cả người dùng</strong> truy cập và sử dụng dịch vụ 2GO, bao gồm người mua, người bán và các đối tác.</p>
          </section>

          <section className="policy-section">
            <h2>2. Tài khoản người dùng</h2>
            <ul>
              <li>Người dùng phải cung cấp thông tin chính xác.</li>
              <li>Chịu trách nhiệm bảo mật tài khoản.</li>
              <li>Không được chia sẻ tài khoản cho người khác.</li>
            </ul>
            <p>2GO có quyền tạm khóa hoặc chấm dứt tài khoản khi phát hiện:</p>
            <ul>
              <li>Gian lận</li>
              <li>Spam</li>
              <li>Vi phạm pháp luật</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. Nội dung và sản phẩm bị cấm</h2>
            <div className="policy-warning">
              <strong>⚠️ Cấm đăng tải:</strong>
            </div>
            <ul>
              <li>Hàng giả, hàng nhái</li>
              <li>Hàng cấm theo quy định pháp luật</li>
              <li>Nội dung vi phạm đạo đức, kích động, lừa đảo</li>
              <li>Thông tin sai lệch về sản phẩm</li>
            </ul>
            <p>2GO có quyền gỡ bỏ nội dung mà không cần thông báo trước nếu phát hiện vi phạm nghiêm trọng.</p>
          </section>

          <section className="policy-section">
            <h2>4. Quy trình giao dịch &amp; ký quỹ</h2>
            <ul>
              <li>Tiền thanh toán được giữ tại hệ thống ký quỹ.</li>
              <li>Sau khi người mua xác nhận đã nhận hàng, tiền được giải ngân cho người bán.</li>
              <li>Nếu phát sinh khiếu nại, giao dịch sẽ bị tạm giữ để điều tra.</li>
              <li>2GO có quyền đưa ra quyết định cuối cùng dựa trên bằng chứng hai bên cung cấp.</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Phí dịch vụ &amp; subscription</h2>
            <ul>
              <li>Phí hoa hồng và gói subscription được công bố minh bạch.</li>
              <li>2GO có quyền thay đổi mức phí nhưng phải thông báo trước.</li>
              <li>Người dùng tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận thay đổi.</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>6. Trách nhiệm &amp; miễn trừ</h2>
            <ul>
              <li>2GO là nền tảng trung gian kết nối.</li>
              <li>2GO không chịu trách nhiệm trực tiếp về chất lượng hàng hóa.</li>
              <li>Người bán chịu trách nhiệm về tính hợp pháp và mô tả sản phẩm.</li>
              <li>Người mua chịu trách nhiệm kiểm tra sản phẩm khi nhận hàng.</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Xử lý vi phạm</h2>
            <p>Vi phạm có thể dẫn đến:</p>
            <ul>
              <li>Cảnh cáo</li>
              <li>Gỡ bài đăng</li>
              <li>Tạm khóa tài khoản</li>
              <li>Chấm dứt tài khoản vĩnh viễn</li>
              <li>Báo cáo cơ quan chức năng (nếu cần)</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>8. Thay đổi điều khoản</h2>
            <p>2GO có quyền cập nhật điều khoản và sẽ thông báo trước tối thiểu <strong>07 ngày</strong>.</p>
          </section>
        </div>
      </div>
    </UserLayout>
  );
}
