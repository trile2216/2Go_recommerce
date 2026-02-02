import React, { useState } from 'react';
import AdminHeader from '../components/Admin/AdminHeader';
import AdminSidebar from '../components/Admin/AdminSidebar';
import '../styles/Admin/admin-layout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
      />
      
      <div className="admin-main-wrapper">
        <AdminHeader onMenuToggle={toggleSidebar} />
        
        <main className="admin-main-content">
          {children}
        </main>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="admin-footer-content">
            <p className="admin-footer-text">
              © 2024 ReCommerce Admin. All rights reserved.
            </p>
            <div className="admin-footer-links">
              <a href="#help">Help</a>
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
