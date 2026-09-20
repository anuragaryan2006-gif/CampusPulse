import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('college_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/me');
      if (res.success) {
        setUser(res.user);
      } else {
        localStorage.removeItem('college_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('college_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.token) {
      localStorage.setItem('college_token', res.token);
      setUser(res.user);
    }
    return res;
  }

  async function register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  function logout() {
    localStorage.removeItem('college_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
