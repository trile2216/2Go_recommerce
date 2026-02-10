
import { Link } from 'react-router-dom';
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
  HandCoins
} from 'lucide-react';
import '../../styles/Admin/admin-sidebar.css';

export default function AdminSidebar({ isOpen, onToggle }) {

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      icon: <LayoutDashboard size={20} />,
      path: '/admin'
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package size={20} />,
      path: '/admin/products'
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
          <Link to="/admin" className="admin-logo">
            <div className="logo-icon">R</div>
            <div className="logo-text">
              <h3>ReCommerce</h3>
              <p>Admin</p>
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
            {menuItems.map((item) => (
              <li key={item.id} className="admin-nav-item">
                <Link
                  to={item.path}
                  className="admin-nav-link"
                  onClick={onToggle}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  );
}
