import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, MessageSquare, Settings, LogOut, User, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Admin/admin-header.css';

export default function AdminHeader({ onMenuToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-wrapper">
        {/* Left Section */}
        <div className="admin-header-left">
          <button 
            className="admin-menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Search Bar */}
          <form className="admin-header-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-search-btn">
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Right Section */}
        <div className="admin-header-right">
          {/* Notifications */}
          <button className="admin-header-icon" aria-label="Notifications">
            <Bell size={20} color='blue'/>
            <span className="admin-badge">3</span>
          </button>

          {/* Messages */}
          <button className="admin-header-icon" aria-label="Messages">
            <MessageSquare size={20} color='blue'/>
            <span className="admin-badge">5</span>
          </button>

          {/* Divider */}
          <div className="admin-header-divider"></div>

          {/* User Menu */}
          <div className="admin-user-menu-wrapper">
            <button
              className="admin-user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="admin-user-avatar">
                {getInitials(user?.fullName || 'User')}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">
                  {user?.fullName || 'Admin'}
                </span>
                <span className="admin-user-role">Administrator</span>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="admin-user-dropdown">
                <div className="admin-dropdown-header">
                  <div className="admin-user-avatar-lg">
                    {getInitials(user?.fullName || 'User')}
                  </div>
                  <div>
                    <h6>{user?.fullName || 'Admin'}</h6>
                    <p>{user?.email || 'admin@recommerce.com'}</p>
                  </div>
                </div>
                <div className="admin-dropdown-divider"></div>
                <a href="/admin/profile" className="admin-dropdown-item">
                  <User size={18} />
                  <span>My Profile</span>
                </a>
                <a href="/admin/settings/general" className="admin-dropdown-item">
                  <Settings size={18} />
                  <span>Settings</span>
                </a>
                <div className="admin-dropdown-divider"></div>
                <button 
                  onClick={handleLogout}
                  className="admin-dropdown-item admin-logout-btn"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
