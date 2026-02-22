
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  ChevronRight,
  Menu,
  X,
  List,
  Shapes,
  HandCoins,
  TrendingUp
} from 'lucide-react';
import '../../styles/Admin/admin-sidebar.css';
import logo from "../../assets/logo.jpg";

export default function AdminSidebar({ isOpen, onToggle }) {
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      icon: <LayoutDashboard size={20} />,
      path: '/admin'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Package size={20} />,
      path: '/admin/reports'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users size={20} />,
      path: '/admin/customers'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      path: '/admin/orders'
    },
    {
      id: 'listings',
      label: 'Listings',
      icon: <List size={20} />,
      path: '/admin/listings'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Shapes size={20} />,
      path: '/admin/categories'
    },
    {
      id: 'plan',
      label: 'Subscription Plans',
      icon: <HandCoins size={20} />,
      path: '/admin/plans'
    },
    {
      id: 'market-prices',
      label: 'Market Prices',
      icon: <TrendingUp size={20} />,
      path: '/admin/market-prices'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="admin-sidebar-header">
          {/* Logo */}
          <Link to="/admin" className="header-logo" >
            <img src={logo} alt="2GO Logo" className="logo-badge" />
            <div className="logo-text">
              <h1 className="logo-title">2GO</h1>
              <p className="logo-subtitle">Admin Portal</p>
            </div>
          </Link>
          <button 
            className="admin-sidebar-close d-md-none"
            onClick={onToggle}
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="admin-sidebar-nav">
          <ul className="admin-nav-list">
            {menuItems.map((item) => {
              const isActive = item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);
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
