import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Bell, User, X, LogOut, Check, Menu } from "lucide-react";
import "../Header.css";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../../service/home/api.notification";
import useAuth from "../../context/UseAuth";

export default function AdminHeader({ onMenuToggle }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, logoutUser } = useAuth();
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications upon component mount or when logged in.
  // Note: Admin might use a different notification endpoint or the same one.
  // Using the same one as per "based on Header.jsx".
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleLogout = async () => {
    await logoutUser();
    setShowUserMenu(false);
    navigate('/auth/login');
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'A';
    return fullName
      .split(' ')
      .slice(-2)
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  };

  const closeAllMenus = () => {
    setShowNotificationsMenu(false);
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="header-wrapper">
        {/* Spacer to push actions to the right */}
        <div style={{ flex: 1 }}></div>

        {/* Actions */}
        <div className="header-actions">

          {/* Messages */}
          {/* <button
            className="icon-btn messages-btn"
            onClick={() => {
              navigate("/admin/messages"); // Assuming admin has a messages route or keep it generic
              closeAllMenus();
            }}
          >
            <MessageSquare size={20} />
          </button> */}

          {/* Notifications */}
          <div className="action-dropdown" ref={notificationsRef}>
            <button
              className="icon-btn notifications-btn"
              onClick={() => {
                setShowNotificationsMenu(!showNotificationsMenu);
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
                        <div className="user-avatar-lg">{getInitials(user.profile?.fullName || user.fullName || user.email || 'Admin')}</div>
                        <div className="user-info">
                          <div className="user-name">{user.profile?.fullName || user.fullName || 'Admin'}</div>
                          <div className="user-email">{user.email || 'admin@example.com'}</div>
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
                      <div className="menu-section-title">Admin Controls</div>
                      <button className="menu-item" onClick={() => { navigate('/admin/profile'); closeAllMenus(); }}>Hồ sơ cá nhân</button>
                      <button className="menu-item" onClick={() => { navigate('/admin/settings'); closeAllMenus(); }}>Cài đặt</button>
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
                  // Fallback for not logged in, though admin should be
                  <div className="auth-menu">
                     <button
                      className="menu-item logout"
                      onClick={() => navigate('/auth/login')}
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
