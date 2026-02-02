// Admin Configuration
export const ADMIN_CONFIG = {
  // Admin routes base path
  basePath: '/admin',
  
  // Menu items configuration
  menuItems: [
    {
      id: 'dashboard',
      label: 'Dashboards',
      icon: 'LayoutDashboard',
      path: '/admin',
      submenu: [
        { label: 'CRM Dashboard', path: '/admin' },
        { label: 'Analytics', path: '/admin/analytics' }
      ]
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'Package',
      path: '/admin/products',
      submenu: [
        { label: 'All Products', path: '/admin/products' },
        { label: 'Add Product', path: '/admin/products/create' },
        { label: 'Categories', path: '/admin/categories' }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'Users',
      path: '/admin/customers',
      submenu: [
        { label: 'All Customers', path: '/admin/customers' },
        { label: 'Add Customer', path: '/admin/customers/create' }
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'ShoppingCart',
      path: '/admin/orders',
      submenu: [
        { label: 'All Orders', path: '/admin/orders' },
        { label: 'Pending', path: '/admin/orders/pending' },
        { label: 'Completed', path: '/admin/orders/completed' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      path: '/admin/settings',
      submenu: [
        { label: 'General', path: '/admin/settings/general' },
        { label: 'Email', path: '/admin/settings/email' },
        { label: 'Security', path: '/admin/settings/security' }
      ]
    }
  ],

  // API Endpoints
  apiEndpoints: {
    stats: '/api/admin/stats',
    products: '/api/listings',
    customers: '/api/customers',
    orders: '/api/orders',
    settings: '/api/settings'
  },

  // Table Pagination
  itemsPerPage: 10,

  // Theme Colors
  colors: {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f9fafb',
    dark: '#1f2937'
  },

  // Date Format
  dateFormat: 'DD/MM/YYYY',
  
  // Currency
  currency: {
    symbol: 'đ',
    locale: 'vi-VN',
    code: 'VND'
  },

  // Sidebar
  sidebar: {
    width: '280px',
    collapsedWidth: '80px',
    animationDuration: '0.3s'
  },

  // Header
  header: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb'
  }
};

// Export default config
export default ADMIN_CONFIG;
