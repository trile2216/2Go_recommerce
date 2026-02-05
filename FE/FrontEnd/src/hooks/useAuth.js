import { useState, useEffect } from 'react';
import { logout as logoutAPI } from '../service/auth/api.auth';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('user');
  });

  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
        } catch (e) {
          console.error('Error parsing user:', e);
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // Listen for custom auth change event
    window.addEventListener('authChange', handleAuthChange);
    // Also listen for storage events (for sync across tabs)
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await logoutAPI(refreshToken);
      }
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsLoggedIn(false);
      window.dispatchEvent(new Event('authChange'));
    }
  };

  return { user, isLoggedIn, logout };
};
