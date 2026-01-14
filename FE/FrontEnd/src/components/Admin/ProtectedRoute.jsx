import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  // Optional: Check if user is admin
  // if (user?.role !== 'admin') {
  //   return <Navigate to="/" replace />;
  // }

  return children;
}
