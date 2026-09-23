import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'analyst' | 'authority' | 'user' | string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => { throw new Error('Not implemented'); },
  signup: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('thermaltrace_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const dbUser = await apiService.getCurrentUser();
      setUser(dbUser);
    } catch (err) {
      console.error('Session validation failed:', err);
      localStorage.removeItem('thermaltrace_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiService.login(email, password);
    localStorage.setItem('thermaltrace_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (fullName: string, email: string, password: string): Promise<User> => {
    const res = await apiService.signup({ full_name: fullName, email, password });
    localStorage.setItem('thermaltrace_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('thermaltrace_token');
      setUser(null);
    }
  };

  const role = user ? user.role.toLowerCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
