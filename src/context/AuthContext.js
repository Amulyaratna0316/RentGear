import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rentgear_auth';

const resolveSessionFromResponse = (data) => {
  const resolvedUser = data?.user || data?.player || (data?.id ? data : null);
  const resolvedToken = data?.token || data?.jwt || data?.accessToken || null;
  return { resolvedUser, resolvedToken };
};

const decodeBase64 = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> (-2 * bc & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const getTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    let decoded;
    if (typeof atob !== 'undefined') {
      decoded = atob(payload);
    } else {
      const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      decoded = decodeBase64(padded);
    }
    // Handle potential UTF-8 characters
    try {
      decoded = decodeURIComponent(escape(decoded));
    } catch (e) {
      // fallback if escape fails
    }
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = getTokenPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

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
          if (isTokenExpired(parsed?.token)) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setToken(null);
          } else {
            setUser(parsed.user || null);
            setToken(parsed.token || null);
          }
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
    const { data } = await api.post('/auth/login', { identifier, password });
    console.log('[Auth] /auth/login response:', data);

    const { resolvedUser, resolvedToken } = resolveSessionFromResponse(data);
    if (!resolvedUser) {
      throw new Error('Login succeeded but user payload is missing in response.');
    }

    const session = { user: resolvedUser, token: resolvedToken };
    setUser(resolvedUser);
    setToken(resolvedToken);
    await persist(session);
    return resolvedUser;
  };

  const signup = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    setToken(data.token);
    await persist(data);
    return data.user;
  };

  const registerUser = async (payload) => {
    try {
      const { data } = await api.post('/auth/register', payload);
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

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 401) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setToken(null);
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const checkUsernameAvailability = async (username) => {
    try {
      const { data } = await api.get('/auth/username-availability', {
        params: { username },
      });
      return data;
    } catch (_err) {
      // If the server is down or errors out, don't block the user — let them try to submit
      console.warn('[AuthContext] Username availability check failed, allowing fallback');
      return { available: true, message: 'Could not verify, will check on submit' };
    }
  };

  const switchRole = async () => {
    if (!user) return;
    const newRole = user.role === 'customer' ? 'owner' : 'customer';
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);

    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.user = updatedUser;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('[AuthContext] Failed to persist role switch', err);
    }
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
      switchRole,
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
