import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removeFromFavorites } from "../store/slices/favoritesSlice";
import { Heart, MessageSquare, Bell, User, Search, ChevronDown, MapPin, Check, X, LogOut, ShoppingCart } from "lucide-react";
import "./Header.css";
import logo from "../assets/logo.jpg";
import { fetchAllCategories } from "../service/home/api.category";
import { fetchAllDistricts } from "../service/home/api.district";
import { fetchAllWards } from "../service/home/api.ward";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../service/home/api.notification";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import useAuth from "../context/UseAuth";

import LocationPermissionPopup from "./LocationPermissionPopup";


export default function Header() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logoutUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [categories, setCategories] = useState([{id: 0, name: "Tất cả"}]);
  const [selectedWard, setSelectedWard] = useState(0); // 0 = Tất cả phường (lưu id)
  const [userAddress, setUserAddress] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartMenu, setShowCartMenu] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([{id: 0, name: "Tất cả phường"}]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Get favorites and compare from Redux
  const dispatch = useDispatch();
  const favorites = useSelector(state => state.favorites.items);
  const compareItems = useSelector(state => state.compare.items);

  // Get cart from context
  const { cartItems, cartCount, removeFromCart, getTotalPrice } = useCart();
  const toast = useToast();

  const favoritesRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartRef = useRef(null);

  // Fetch notifications khi user đã đăng nhập
  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      setNotificationsLoading(true);
      const data = await fetchNotifications(0, 20);
      setNotifications(data.items || []);
      setUnreadCount((data.items || []).filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll mỗi 30 giây
    if (isLoggedIn) {
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.notificationId);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotificationsMenu(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchAllCategories();
        setCategories([{ id: 0, name: "Tất cả" }, ...data.items.map(cat => ({ id: cat.categoryId, name: cat.name }))]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDistrictsAndWards = async () => {
      try {
        const districtsData = await fetchAllDistricts();
        setDistricts([{ id: 0, name: "Tất cả quận" }, ...districtsData.items.map(dist => ({id: dist.districtId, name: dist.name}))]);
        
        const wardsData = await fetchAllWards();
        setWards([{ id: 0, name: "Tất cả phường" }, ...wardsData.items.map(ward  => ({id: ward.wardId, name: ward.name}))]);
      }
      catch (error) {
        console.error('Error fetching districts or wards:', error);
      }
    };
    fetchDistrictsAndWards();
  }, []);
  // Listen for user location updates and set ward automatically
  useEffect(() => {
    const updateUserLocation = () => {
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const locationData = JSON.parse(storedLocation);
          setUserAddress(locationData);
          
          // Get suburb/neighbourhood from address
          const suburb = locationData?.address?.address?.suburb || '';

          if (suburb) {
            // Check if suburb matches any ward in the list
            const matchingWard = wards.find(ward => 
              ward.name.toLowerCase().includes(suburb.toLowerCase()) ||
              suburb.toLowerCase().includes(ward.name.toLowerCase().replace('phường ', ''))
            );
            
            if (matchingWard && matchingWard.id !== 0) {
              console.log('Auto-setting ward to:', matchingWard);
              setSelectedWard(matchingWard.id); // Lưu id thay vì object
            }
          }
        } catch (error) {
          console.error('Error parsing user location:', error);
        }
      }
    };

    // Update on mount
    updateUserLocation();

    // Listen for storage changes (when location is updated)
    window.addEventListener('storage', updateUserLocation);
    
    // Also listen for custom event when location is updated in same tab
    const handleLocationUpdate = () => updateUserLocation();
    window.addEventListener('locationUpdated', handleLocationUpdate);
    
    return () => {
      window.removeEventListener('storage', updateUserLocation);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, [wards]); // Thêm dependency wards

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target)) {
        setShowFavoritesMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotificationsMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCartMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    // Build query params dynamically, only include non-zero values
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    
    if (selectedCategory !== 0) {
      params.append('categoryId', selectedCategory);
    }
    
    if (selectedWard !== 0) {
      params.append('ward', selectedWard);
    }
    
    const queryString = params.toString();
    navigate(`/listings${queryString ? `?${queryString}` : ''}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setShowUserMenu(false);
    navigate('/');
  };

  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .slice(-2)
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  };

  const closeAllMenus = () => {
    setShowFavoritesMenu(false);
    setShowNotificationsMenu(false);
    setShowUserMenu(false);
    setShowLocationPicker(false);
    setShowCartMenu(false);
  };

  return (
    <header className="header">
      <div className="header-wrapper">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={closeAllMenus}>
          <img src={logo} alt="2GO Logo" className="logo-badge" />
          <div className="logo-text">
            <h1 className="logo-title">2GO</h1>
            <p className="logo-subtitle">Thủ Đức</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="header-search">
          <div className="search-controls">
            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => {
                 setSelectedCategory(e.target.value)}}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="search-input-container">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="location-selector">
                <button
                  className="location-btn"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                >
                  <MapPin size={16} />
                  <span className="location-label">
                    {(() => {
                      if (selectedWard !== 0) {
                        const ward = wards.find(w => w.id === selectedWard);
                        return ward ? ward.name.replace('Phường ', '') : 'Thủ Đức';
                      }
                      return 'Thủ Đức';
                    })()}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {showLocationPicker && (
                  <div className="location-menu">
                    <div className="location-menu-header">
                      <span>Chọn khu vực</span>
                      <button
                        className="close-btn"
                        onClick={() => setShowLocationPicker(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="location-menu-body">
                      <div className="location-group">
                        <label className="location-group-label">Tỉnh/Thành phố</label>
                        <input
                          type="text"
                          className="location-input"
                          defaultValue="Thành phố Thủ Đức"
                          disabled
                        />
                      </div>
                      <div className="location-group">
                        <label className="location-group-label">Phường/Xã</label>
                        <select
                          className="location-select"
                          value={selectedWard}
                          onChange={(e) => setSelectedWard(Number(e.target.value))}
                        >
                          {wards.map((ward) => (
                            <option key={ward.id} value={ward.id}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="location-menu-actions">
                        <button
                          className="cancel-btn"
                          onClick={() => setShowLocationPicker(false)}
                        >
                          Hủy
                        </button>
                        <button
                          className="apply-location-btn"
                          onClick={() => setShowLocationPicker(false)}
                        >
                          <Check size={16} />
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              <Search size={16} />
              <span className="search-btn-text">Tìm kiếm</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions">
          {/* Favorites */}
          <div className="action-dropdown" ref={favoritesRef}>
            <button
              className="icon-btn favorites-btn"
              onClick={() => {
                setShowFavoritesMenu(!showFavoritesMenu);
                setShowNotificationsMenu(false);
                setShowUserMenu(false);
              }}
            >
              <Heart size={20} />
              <span className="icon-badge">{favorites.length}</span>
            </button>
            {showFavoritesMenu && (
              <div className="dropdown-content favorites-menu">
                <div className="dropdown-header">
                  <span>Yêu thích ({favorites.length})</span>
                  <button
                    className="close-btn"
                    onClick={() => setShowFavoritesMenu(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                {favorites.length > 0 ? (
                  <div className="dropdown-list">
                    {favorites.slice(0, 3).map((item) => (
                      <div key={item.id} className="dropdown-item">
                        <img src={item.image} alt={item.title} className="item-image" />
                        <div className="item-info">
                          <p className="item-title">{item.title}</p>
                          <p className="item-price">{item.price?.toLocaleString('vi-VN')}₫</p>
                        </div>
                        <button
                          className="remove-item-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeFromFavorites(item.id));
                            toast.info('Đã xóa khỏi yêu thích');
                          }}
                          title="Xóa khỏi yêu thích"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dropdown-empty">Bạn chưa có sản phẩm yêu thích nào</div>
                )}
                {favorites.length > 0 && (
                  <button
                    className="view-all-btn"
                    onClick={() => {
                      navigate('/favorites');
                      setShowFavoritesMenu(false);
                    }}
                  >
                    Xem tất cả ({favorites.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="action-dropdown" ref={cartRef}>
            <button
              className="icon-btn cart-btn"
              onClick={() => {
                setShowCartMenu(!showCartMenu);
                setShowFavoritesMenu(false);
                setShowNotificationsMenu(false);
                setShowUserMenu(false);
              }}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="icon-badge success">{cartCount}</span>
              )}
            </button>
            {showCartMenu && (
              <div className="dropdown-content cart-menu">
                <div className="dropdown-header">
                  <span>Giỏ hàng ({cartCount})</span>
                  <button
                    className="close-btn"
                    onClick={() => setShowCartMenu(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                {cartItems.length > 0 ? (
                  <>
                    <div className="dropdown-list">
                      {cartItems.slice(0, 4).map((item) => (
                        <div key={item.cartItemId} className="dropdown-item">
                          <img src={item.primaryImageUrl || item.image} alt={item.title} className="item-image" />
                          <div className="item-info">
                            <p className="item-title">{item.title}</p>
                            <p className="item-price">{Number(item.priceSnapshot || item.price).toLocaleString('vi-VN')}₫</p>
                          </div>
                          <button
                            className="remove-item-btn"
                            onClick={() => removeFromCart(item.cartItemId)}
                            title="Xóa khỏi giỏ hàng"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-total">
                      <span>Tổng:</span>
                      <span className="total-price">{getTotalPrice().toLocaleString('vi-VN')}₫</span>
                    </div>
                    <button
                      className="view-all-btn"
                      onClick={() => {
                        navigate('/checkout');
                        setShowCartMenu(false);
                      }}
                    >
                      Đi tới thanh toán
                    </button>
                  </>
                ) : (
                  <div className="dropdown-empty">Giỏ hàng trống</div>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <button
            className="icon-btn messages-btn"
            onClick={() => {
              navigate("/chat");
              closeAllMenus();
            }}
          >
            <MessageSquare size={20} />
            {/* <span className="icon-badge primary">5</span> */}
          </button>

          {/* Notifications */}
          <div className="action-dropdown" ref={notificationsRef}>
            <button
              className="icon-btn notifications-btn"
              onClick={() => {
                setShowNotificationsMenu(!showNotificationsMenu);
                setShowFavoritesMenu(false);
                setShowUserMenu(false);
                if (!showNotificationsMenu) loadNotifications();
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="icon-badge warning">{unreadCount}</span>
              )}
            </button>
            {showNotificationsMenu && (
              <div className="dropdown-content notifications-menu">
                <div className="dropdown-header">
                  <span>Thông báo {unreadCount > 0 && `(${unreadCount})`}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button
                        className="mark-all-read-btn"
                        onClick={handleMarkAllRead}
                        title="Đánh dấu tất cả đã đọc"
                      >
                        <Check size={14} />
                        Đọc tất cả
                      </button>
                    )}
                    <button
                      className="close-btn"
                      onClick={() => setShowNotificationsMenu(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {notificationsLoading ? (
                  <div className="dropdown-empty">Đang tải...</div>
                ) : notifications.length > 0 ? (
                  <div className="dropdown-list notifications-list">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.notificationId}
                        className={`dropdown-item notification-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-content">
                          <p className="notification-title">{notif.title}</p>
                          <p className="notification-message">{notif.message}</p>
                          <span className="notification-time">{formatTimeAgo(notif.createdAt)}</span>
                        </div>
                        {!notif.isRead && <span className="notification-dot"></span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dropdown-empty">Bạn chưa có thông báo mới</div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="action-dropdown user-dropdown" ref={userMenuRef}>
            <button
              className="icon-btn user-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowFavoritesMenu(false);
                setShowNotificationsMenu(false);
              }}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
            </button>
            {showUserMenu && (
              <div className="dropdown-content user-menu">
                {isLoggedIn && user ? (
                  <>
                    <div className="dropdown-header user-header">
                      <div className="user-menu-header">
                        <div className="user-avatar-lg">{getInitials(user.fullName || user.email)}</div>
                        <div className="user-info">
                          <div className="user-name">{user.fullName || user.email}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                      <button
                        className="close-btn"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="menu-section">
                      <div className="menu-section-title">Tài khoản</div>
                      <a href="/user/info" className="menu-item" onClick={(e) => { closeAllMenus(); }}>Hồ sơ cá nhân</a>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Cài đặt tài khoản</a>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="menu-section">
                      <div className="menu-section-title">Tiện ích</div>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Tin đăng đã lưu</a>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Lịch sử xem tin</a>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Đơn của tôi</a>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Đánh giá từ tôi</a>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="menu-section">
                      <div className="menu-section-title">Khác</div>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Trợ giúp</a>
                      <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); closeAllMenus(); }}>Đóng góp ý kiến</a>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button
                      className="menu-item logout"
                      onClick={handleLogout}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      <LogOut size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <div className="auth-menu">
                    <button
                      className="close-btn"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <X size={18} />
                    </button>
                    <div className="auth-menu-content">
                      <p className="auth-menu-text">Bạn chưa đăng nhập</p>
                      <button
                        className="auth-btn login-btn"
                        onClick={() => {
                          navigate('/auth/login');
                          closeAllMenus();
                        }}
                      >
                        Đăng nhập
                      </button>
                      <button
                        className="auth-btn register-btn"
                        onClick={() => {
                          navigate('/auth/register');
                          closeAllMenus();
                        }}
                      >
                        Đăng ký
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Button */}
          <button className="post-btn" onClick={() => navigate('/post/listing')}>Đăng tin</button>
        </div>
      </div>

      {/* Location Permission Popup */}
      <LocationPermissionPopup />
    </header>
  );
}
