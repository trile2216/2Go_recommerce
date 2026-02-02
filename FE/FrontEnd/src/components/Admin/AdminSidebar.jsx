import React, { useState } from 'react';
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
  Shapes
} from 'lucide-react';
import '../../styles/Admin/admin-sidebar.css';

export default function AdminSidebar({ isOpen, onToggle }) {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      icon: <LayoutDashboard size={20} />,
      submenu: [
        { label: 'CRM Dashboard', path: '/admin' },
        { label: 'Analytics', path: '/admin/analytics' }
      ]
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package size={20} />,
      submenu: [
        { label: 'All Products', path: '/admin/products' },
        { label: 'Add Product', path: '/admin/products/create' },
        { label: 'Categories', path: '/admin/categories' }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users size={20} />,
      submenu: [
        { label: 'All Customers', path: '/admin/customers' },
        { label: 'Customer View', path: '/admin/customers/view' },
        { label: 'Add Customer', path: '/admin/customers/create' }
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      submenu: [
        { label: 'All Orders', path: '/admin/orders' },
        { label: 'Pending', path: '/admin/orders/pending' },
        { label: 'Completed', path: '/admin/orders/completed' }
      ]
    },
    {
      id: 'listings',
      label: 'Listings',
      icon: <List size={20} />,
      submenu: [
        { label: 'All Listings', path: '/admin/listings' },
        { label: 'Add Listing', path: '/admin/listings/create' }
      ]
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Shapes size={20} />,
      submenu: [
        { label: 'All Categories', path: '/admin/categories' },
        { label: 'Add Category', path: '/admin/categories/create' }
      ]
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
                <button
                  className={`admin-nav-link ${expandedMenu === item.id ? 'expanded' : ''}`}
                  onClick={() => toggleMenu(item.id)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-text">{item.label}</span>
                  {item.submenu && (
                    <ChevronRight 
                      size={18} 
                      className={`admin-nav-arrow ${expandedMenu === item.id ? 'rotated' : ''}`}
                    />
                  )}
                </button>

                {/* Submenu */}
                {item.submenu && expandedMenu === item.id && (
                  <ul className="admin-submenu">
                    {item.submenu.map((subitem, idx) => (
                      <li key={idx} className="admin-submenu-item">
                        <Link to={subitem.path} className="admin-submenu-link">
                          {subitem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  );
}
