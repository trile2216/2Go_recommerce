import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminNavLink() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Link 
      to="/admin"
      className="admin-nav-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        color: '#3b82f6',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.9rem'
      }}
    >
      📊 Dashboard
    </Link>
  );
}
