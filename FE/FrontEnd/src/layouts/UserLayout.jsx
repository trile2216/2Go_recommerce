import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/user-layout.css';

export default function UserLayout({ children }) {
  return (
    <div className="user-layout">
      <Header />
      
      <main className="user-main-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}
