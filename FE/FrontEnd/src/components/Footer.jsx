export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-columns">
          <div className="footer-column">
            <h3 className="footer-heading">2GO Thủ Đức</h3>
            <p className="footer-text">
              Nền tảng mua bán đồ gia dụng, đồ cũ dành cho sinh viên tại Thành phố Thủ Đức. 
              Kết nối người mua và người bán một cách nhanh chóng, an toàn và tiện lợi.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12.0003 1.3335H10.0003C9.11627 1.3335 8.26842 1.68469 7.6433 2.30981C7.01818 2.93493 6.66699 3.78277 6.66699 4.66683V6.66683H4.66699V9.3335H6.66699V14.6668H9.33366V9.3335H11.3337L12.0003 6.66683H9.33366V4.66683C9.33366 4.49002 9.4039 4.32045 9.52892 4.19543C9.65395 4.0704 9.82351 4.00016 10.0003 4.00016H12.0003V1.3335Z" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M11.333 1.3335H4.66634C2.82539 1.3335 1.33301 2.82588 1.33301 4.66683V11.3335C1.33301 13.1744 2.82539 14.6668 4.66634 14.6668H11.333C13.174 14.6668 14.6663 13.1744 14.6663 11.3335V4.66683C14.6663 2.82588 13.174 1.3335 11.333 1.3335Z" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.6668 7.5802C10.7491 8.13503 10.6543 8.70168 10.396 9.19954C10.1376 9.69741 9.72889 10.1011 9.22788 10.3533C8.72687 10.6055 8.1591 10.6933 7.60532 10.6042C7.05155 10.515 6.53997 10.2536 6.14336 9.85698C5.74674 9.46036 5.48528 8.94878 5.39618 8.39501C5.30707 7.84124 5.39484 7.27346 5.64701 6.77245C5.89919 6.27144 6.30292 5.86269 6.80079 5.60436C7.29865 5.34603 7.8653 5.25126 8.42013 5.33353C8.98608 5.41746 9.51003 5.68118 9.91459 6.08574C10.3192 6.4903 10.5829 7.01425 10.6668 7.5802Z" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.667 4.3335H11.6737" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4 className="footer-subtitle">Liên kết nhanh</h4>
            <nav className="footer-nav">
              <a href="#" className="footer-link">Trang chủ</a>
              <a href="#" className="footer-link">Tìm kiếm</a>
              <a href="#" className="footer-link">Tin nhắn</a>
              <a href="#" className="footer-link">Đơn của tôi</a>
            </nav>
          </div>

          <div className="footer-column">
            <h4 className="footer-subtitle">Hỗ trợ</h4>
            <nav className="footer-nav">
              <a href="#" className="footer-link">Trung tâm trợ giúp</a>
              <a href="#" className="footer-link">Quy định sử dụng</a>
              <a href="#" className="footer-link">Chính sách bảo mật</a>
              <a href="#" className="footer-link">Giải quyết khiếu nại</a>
            </nav>
          </div>

          <div className="footer-column">
            <h4 className="footer-subtitle">Liên hệ</h4>
            <div className="contact-info">
              <div className="contact-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14.6669 11.2802V13.2802C14.6677 13.4659 14.6297 13.6497 14.5553 13.8198C14.4809 13.9899 14.3718 14.1426 14.235 14.2681C14.0982 14.3937 13.9367 14.4892 13.7608 14.5487C13.5849 14.6082 13.3985 14.6303 13.2136 14.6136C11.1622 14.3907 9.19161 13.6897 7.46028 12.5669C5.8495 11.5433 4.48384 10.1777 3.46028 8.56689C2.3336 6.8277 1.63244 4.84756 1.41361 2.78689C1.39695 2.60254 1.41886 2.41673 1.47795 2.24131C1.53703 2.06589 1.63199 1.90469 1.75679 1.76797C1.88159 1.63126 2.03348 1.52203 2.20281 1.44724C2.37213 1.37245 2.55517 1.33374 2.74028 1.33356H4.74028C5.06382 1.33038 5.37748 1.44495 5.62279 1.65592C5.8681 1.86689 6.02833 2.15986 6.07361 2.48023C6.15803 3.12027 6.31458 3.74871 6.54028 4.35356C6.62998 4.59218 6.64939 4.8515 6.59622 5.10081C6.54305 5.35012 6.41952 5.57897 6.24028 5.76023L5.39361 6.60689C6.34265 8.27592 7.72458 9.65786 9.39361 10.6069L10.2403 9.76023C10.4215 9.58099 10.6504 9.45746 10.8997 9.40429C11.149 9.35112 11.4083 9.37053 11.6469 9.46023C12.2518 9.68593 12.8802 9.84248 13.5203 9.92689C13.8441 9.97258 14.1399 10.1357 14.3513 10.3852C14.5627 10.6348 14.6751 10.9533 14.6669 11.2802Z" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <div className="contact-label">Hotline</div>
                  <div className="contact-value">1900-xxxx</div>
                </div>
              </div>
              <div className="contact-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.333 2.6665H2.66634C1.92996 2.6665 1.33301 3.26346 1.33301 3.99984V11.9998C1.33301 12.7362 1.92996 13.3332 2.66634 13.3332H13.333C14.0694 13.3332 14.6663 12.7362 14.6663 11.9998V3.99984C14.6663 3.26346 14.0694 2.6665 13.333 2.6665Z" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6663 4.6665L8.68634 8.4665C8.48052 8.59545 8.24255 8.66384 7.99967 8.66384C7.7568 8.66384 7.51883 8.59545 7.31301 8.4665L1.33301 4.6665" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <div className="contact-label">Email</div>
                  <div className="contact-value">support@recommerce.vn</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2024 ReCommerce Thủ Đức. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
