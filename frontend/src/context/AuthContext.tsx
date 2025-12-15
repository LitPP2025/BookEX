import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI } from '../services/api';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => Promise<void>;
  refreshTokens: () => Promise<string>;
  logout: () => void;
  loading: boolean;
  updateProfile: (data: { full_name?: string | null; city?: string | null; about?: string | null }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setSessionFromResponse = useCallback((data: AuthResponse) => {
    const { access_token, refresh_token, user: responseUser } = data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(responseUser));
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    setUser(responseUser);
    return access_token;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== 'undefined') {
          setUser(JSON.parse(storedUser));
          api.defaults.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    setSessionFromResponse(response.data);
  };

  const register = async (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => {
    const response = await authAPI.register(userData);
    setSessionFromResponse(response.data);
  };

  const refreshTokens = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    const response = await authAPI.refresh({ refresh_token: refreshToken });
    return setSessionFromResponse(response.data);
  }, [setSessionFromResponse]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    api.defaults.headers.Authorization = '';
  };

  const updateProfile = async (data: { full_name?: string | null; city?: string | null; about?: string | null }) => {
    const response = await authAPI.updateProfile(data);
    setUser(response.data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, refreshTokens, logout, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
