import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Heart, MessageSquare, Bell, User, Search, ChevronDown, MapPin, Check, X, LogOut } from "lucide-react";
import "./Header.css";
import { fetchAllCategories } from "../service/home/api.category";
import LocationPermissionPopup from "./LocationPermissionPopup";

const DISTRICTS = [
  "Tất cả phường",
  "Phường Linh Xuân",
  "Phường Bình Chiểu",
  "Phường Hiệp Bình Phước",
  "Phường Linh Trung",
  "Phường Tam Bình",
  "Phường Tam Phú",
];

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [categories, setCategories] = useState([{id: 0, name: "Tất cả"}]);
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả phường");
  const [userAddress, setUserAddress] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Get favorites and compare from Redux
  const favorites = useSelector(state => state.favorites.items);
  const compareItems = useSelector(state => state.compare.items);
  
  // Auth state - read from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const favoritesRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Check auth status on mount and when window regains focus
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      console.log('Checking auth - stored user:', storedUser);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed user:', parsedUser);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch (e) {
          console.error('Error parsing user:', e);
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // Check immediately on mount
    checkAuth();

    // Also check when visibility changes (page comes into focus)
    window.addEventListener('visibilitychange', checkAuth);
    // Check when tab regains focus
    window.addEventListener('focus', checkAuth);
    // Check when storage changes (other tab logged in)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('visibilitychange', checkAuth);
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Also check auth when location changes (navigate to home after login)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing user on location change:', e);
      }
    }
  }, []);

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

  // Listen for user location updates and set district automatically
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
            // Check if suburb matches any district in the list
            const matchingDistrict = DISTRICTS.find(district => 
              district.toLowerCase().includes(suburb.toLowerCase()) ||
              suburb.toLowerCase().includes(district.toLowerCase().replace('phường ', ''))
            );
            
            if (matchingDistrict && matchingDistrict !== 'Tất cả phường') {
              console.log('Auto-setting district to:', matchingDistrict);
              setSelectedDistrict(matchingDistrict);
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
  }, []);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // const handleSearch = () => {
  //   navigate(`/listings?search=${searchQuery}&categoryId=${selectedCategory}&district=${selectedDistrict}`);
  // };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // handleSearch();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
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
  };

  return (
    <header className="header">
      <div className="header-wrapper">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={closeAllMenus}>
          <div className="logo-badge">R</div>
          <div className="logo-text">
            <h1 className="logo-title">ReCommerce</h1>
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
                if(e.target.value != 0) setSelectedCategory(e.target.value)}}
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
                    {selectedDistrict !== 'Tất cả phường' 
                      ? selectedDistrict.replace('Phường ', '') 
                      : 'Thủ Đức'
                    }
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
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                          {DISTRICTS.map((district) => (
                            <option key={district} value={district}>
                              {district}
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
              // onClick={handleSearch}
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
              }}
            >
              <Bell size={20} />
              {/* <span className="icon-badge warning">2</span> */}
            </button>
            {showNotificationsMenu && (
              <div className="dropdown-content notifications-menu">
                <div className="dropdown-header">
                  <span>Thông báo</span>
                  <button 
                    className="close-btn"
                    onClick={() => setShowNotificationsMenu(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="dropdown-empty">Bạn chưa có thông báo mới</div>
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
          <button className="post-btn" onClick={closeAllMenus}>Đăng tin</button>
        </div>
      </div>

      {/* Location Permission Popup */}
      <LocationPermissionPopup />
    </header>
  );
}
