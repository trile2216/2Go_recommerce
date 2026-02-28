import { Link } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import './PolicyPage.css';

export default function PrivacyPolicy() {
  return (
    <UserLayout>
      <div className="policy-page">
        <div className="policy-container">
          <nav className="policy-breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Chính sách bảo mật</span>
          </nav>

          <h1 className="policy-title">Chính sách bảo mật</h1>
          <p className="policy-last-updated">Cập nhật lần cuối: 28/02/2026</p>

          <section className="policy-section">
            <h2>1. Thông tin thu thập</h2>
            <p>Chúng tôi thu thập:</p>
            <ul>
              <li><strong>Thông tin tài khoản:</strong> họ tên, email, số điện thoại</li>
              <li>Thông tin giao dịch</li>
              <li>Lịch sử thanh toán</li>
              <li><strong>Dữ liệu kỹ thuật:</strong> IP, thiết bị, log truy cập</li>
              <li><strong>Nội dung do người dùng tạo:</strong> hình ảnh, chat, đánh giá</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>2. Mục đích sử dụng</h2>
            <ul>
              <li>Xác thực tài khoản</li>
              <li>Xử lý thanh toán &amp; vận chuyển</li>
              <li>Phòng chống gian lận</li>
              <li>Cải thiện trải nghiệm người dùng</li>
              <li>Hỗ trợ khách hàng</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. Chia sẻ dữ liệu</h2>
            <p>Chúng tôi có thể chia sẻ dữ liệu với:</p>
            <ul>
              <li>Đối tác thanh toán</li>
              <li>Đối tác vận chuyển</li>
              <li>Nhà cung cấp dịch vụ công nghệ</li>
              <li>Cơ quan nhà nước khi có yêu cầu hợp pháp</li>
            </ul>
            <div className="policy-highlight">
              🔒 Chúng tôi <strong>không bán dữ liệu cá nhân</strong> cho bên thứ ba.
            </div>
          </section>

          <section className="policy-section">
            <h2>4. Lưu trữ &amp; bảo mật</h2>
            <ul>
              <li>Dữ liệu được lưu trữ trên hạ tầng bảo mật tiêu chuẩn.</li>
              <li>Áp dụng mã hóa và kiểm soát truy cập nội bộ.</li>
              <li>Dữ liệu giao dịch được lưu tối thiểu <strong>05 năm</strong> theo yêu cầu pháp luật (nếu áp dụng).</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Quyền của người dùng</h2>
            <p>Người dùng có quyền:</p>
            <ul>
              <li>Yêu cầu chỉnh sửa thông tin</li>
              <li>Yêu cầu xóa tài khoản</li>
              <li>Yêu cầu cung cấp dữ liệu cá nhân</li>
              <li>Rút lại sự đồng ý xử lý dữ liệu (trong phạm vi pháp luật cho phép)</li>
            </ul>
            <p>Để thực hiện các quyền trên, vui lòng liên hệ: <a href="mailto:support@2go.vn">support@2go.vn</a></p>
          </section>
        </div>
      </div>
    </UserLayout>
  );
}
