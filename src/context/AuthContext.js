import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rentgear_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const persist = async (session) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const login = async (identifier, password) => {
    const { data } = await api.post('/api/auth/login', { identifier, password });
    setUser(data.user);
    setToken(data.token);
    await persist(data);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    setUser(data.user);
    setToken(data.token);
    await persist(data);
    return data.user;
  };

  const registerUser = async (payload) => {
    try {
      const { data } = await api.post('/api/auth/register', payload);
      return data.user;
    } catch (error) {
      const backendReason = error?.response?.data?.message;
      const networkReason = error?.message;
      const reason = backendReason || networkReason || 'Unknown registration error';
      console.error(`Registration failed: ${reason}`);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const checkUsernameAvailability = async (username) => {
    const { data } = await api.get('/api/auth/username-availability', {
      params: { username },
    });
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      registerUser,
      logout,
      checkUsernameAvailability,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
