import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  { email: 'demo1@ivy.homes', label: 'Demo 1', name: 'Demo User 1' },
  { email: 'demo2@ivy.homes', label: 'Demo 2', name: 'Demo User 2' },
  { email: 'demo3@ivy.homes', label: 'Demo 3', name: 'Demo User 3' },
];

export const DEMO_PASSWORD = 'f214f01ed6';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ivy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-login demo1 if no session exists, to make reviewing instant
  useEffect(() => {
    if (!user && !api.token) {
      login('demo1@ivy.homes', DEMO_PASSWORD).catch(() => {});
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const switchAccount = async (email) => {
    return login(email, DEMO_PASSWORD);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        switchAccount,
        demoUsers: DEMO_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
