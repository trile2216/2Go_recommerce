import React, { useState } from 'react';
import AdminHeader from '../components/Admin/AdminHeader';
import ModSidebar from '../components/Mod/ModSidebar';
import '../styles/Admin/admin-layout.css';

export default function ModLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      <ModSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
      />
      
      <div className="admin-main-wrapper">
        <AdminHeader onMenuToggle={toggleSidebar} />
        
        <main className="admin-main-content">
          {children}
        </main>

        <footer className="admin-footer">
          <div className="admin-footer-content">
            <p className="admin-footer-text">
              © 2024 ReCommerce Moderator. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
