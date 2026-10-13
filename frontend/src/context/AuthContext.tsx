import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, type UserProfile } from '../api/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<UserProfile>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  }) => Promise<UserProfile>;
  setSession: (user: UserProfile, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const profile = await authApi.getProfile(storedToken);
          setUser(profile);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('access_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const setSession = (userObj: UserProfile, accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setUser(userObj);
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    setSession(res.user, res.accessToken);
    return res.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  }) => {
    const res = await authApi.register(data);
    setSession(res.user, res.accessToken);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
