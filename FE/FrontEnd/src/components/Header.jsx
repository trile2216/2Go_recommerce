import { useState } from 'react';

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo-link">
            <div className="logo-image">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/688baa8a39694f306007b6c4867b7e81cb956b8e?width=78" alt="2GO Logo" />
            </div>
            <div className="logo-text">
              <h1 className="site-title">2GO</h1>
              <p className="site-location">Thủ Đức</p>
            </div>
          </a>

          <div className="search-container">
            <div className="search-wrapper">
              <select className="category-select">
                <option>Tất cả</option>
              </select>
              
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm..." 
                  className="search-input"
                />
                <button className="location-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3337 6.66671C13.3337 9.99537 9.64099 13.462 8.40099 14.5327C8.28548 14.6196 8.14486 14.6665 8.00033 14.6665C7.85579 14.6665 7.71518 14.6196 7.59966 14.5327C6.35966 13.462 2.66699 9.99537 2.66699 6.66671C2.66699 5.25222 3.2289 3.89567 4.22909 2.89547C5.22928 1.89528 6.58584 1.33337 8.00033 1.33337C9.41481 1.33337 10.7714 1.89528 11.7716 2.89547C12.7718 3.89567 13.3337 5.25222 13.3337 6.66671Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 8.66663C9.10457 8.66663 10 7.7712 10 6.66663C10 5.56206 9.10457 4.66663 8 4.66663C6.89543 4.66663 6 5.56206 6 6.66663C6 7.7712 6.89543 8.66663 8 8.66663Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Linh Xuân</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <button className="search-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.0005 14L11.1338 11.1333" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn favorites">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12.6663 9.33333C13.6597 8.36 14.6663 7.19333 14.6663 5.66667C14.6663 4.69421 14.28 3.76158 13.5924 3.07394C12.9048 2.38631 11.9721 2 10.9997 2C9.82634 2 8.99967 2.33333 7.99967 3.33333C6.99967 2.33333 6.17301 2 4.99967 2C4.02721 2 3.09458 2.38631 2.40695 3.07394C1.71932 3.76158 1.33301 4.69421 1.33301 5.66667C1.33301 7.2 2.33301 8.36667 3.33301 9.33333L7.99967 14L12.6663 9.33333Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="badge">3</span>
            </button>

            <button className="icon-btn messages">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10C14 10.3536 13.8595 10.6928 13.6095 10.9428C13.3594 11.1929 13.0203 11.3333 12.6667 11.3333H4.66667L2 14V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V10Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="badge badge-blue">5</span>
            </button>

            <button className="icon-btn notifications">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 5.33337C4 4.27251 4.42143 3.25509 5.17157 2.50495C5.92172 1.7548 6.93913 1.33337 8 1.33337C9.06087 1.33337 10.0783 1.7548 10.8284 2.50495C11.5786 3.25509 12 4.27251 12 5.33337C12 10 14 11.3334 14 11.3334H2C2 11.3334 4 10 4 5.33337Z" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.86621 14C6.9778 14.203 7.14184 14.3722 7.3412 14.4901C7.54057 14.608 7.76793 14.6702 7.99954 14.6702C8.23116 14.6702 8.45852 14.608 8.65788 14.4901C8.85725 14.3722 9.02129 14.203 9.13288 14" stroke="#1E293B" strokeOpacity="0.894118" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="badge badge-blue">2</span>
            </button>

            <button 
              className="icon-btn user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12.6663 14V12.6667C12.6663 11.9594 12.3854 11.2811 11.8853 10.781C11.3852 10.281 10.7069 10 9.99967 10H5.99967C5.29243 10 4.61415 10.281 4.11406 10.781C3.61396 11.2811 3.33301 11.9594 3.33301 12.6667V14" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.99967 7.33333C9.47243 7.33333 10.6663 6.13943 10.6663 4.66667C10.6663 3.19391 9.47243 2 7.99967 2C6.52692 2 5.33301 3.19391 5.33301 4.66667C5.33301 6.13943 6.52692 7.33333 7.99967 7.33333Z" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            <button className="post-btn">Đăng tin</button>
          </div>
        </div>
      </header>

      {/* User Menu Dropdown */}
      {userMenuOpen && (
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar-large">NV</div>
            <div className="user-details">
              <div className="user-name">Nguyễn Văn A</div>
              <div className="user-email">user@example.com</div>
            </div>
          </div>
          
          <div className="menu-divider"></div>
          
          <div className="menu-section">
            <div className="section-label">Tiện ích</div>
            <a href="#" className="menu-item">Tin đăng đã lưu</a>
            <a href="#" className="menu-item">Lịch sử xem tin</a>
            <a href="#" className="menu-item">Đơn của tôi</a>
            <a href="#" className="menu-item">Đánh giá từ tôi</a>
          </div>
          
          <div className="menu-divider"></div>
          
          <div className="menu-section">
            <div className="section-label">Khác</div>
            <a href="#" className="menu-item">Cài đặt tài khoản</a>
            <a href="#" className="menu-item">Trợ giúp</a>
            <a href="#" className="menu-item">Đóng góp ý kiến</a>
          </div>
          
          <div className="menu-divider"></div>
          
          <a href="#" className="menu-item logout">Đăng xuất</a>
        </div>
      )}
    </>
  );
}
