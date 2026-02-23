import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  List,
  Flag,
} from 'lucide-react';
import { X } from 'lucide-react';
import '../../styles/Admin/admin-sidebar.css';
import logo from '../../assets/logo.jpg';

export default function ModSidebar({ isOpen, onToggle }) {
  const location = useLocation();

  const menuItems = [
    {
      id: 'users',
      label: 'User Management',
      icon: <Users size={20} />,
      path: '/mod/users'
    },
    {
      id: 'listings',
      label: 'Listing Moderation',
      icon: <List size={20} />,
      path: '/mod/listings'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Flag size={20} />,
      path: '/mod/reports'
    }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={onToggle}
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/mod/users" className="header-logo">
            <img src={logo} alt="2GO Logo" className="logo-badge" />
            <div className="logo-text">
              <h1 className="logo-title">2GO</h1>
              <p className="logo-subtitle">Moderator</p>
            </div>
          </Link>
          <button 
            className="admin-sidebar-close d-md-none"
            onClick={onToggle}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <ul className="admin-nav-list">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.id} className="admin-nav-item">
                  <Link
                    to={item.path}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                    onClick={onToggle}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-text">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
