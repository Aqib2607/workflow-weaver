import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser();
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/user');
      setAuthState({
        user: response.data,
        token: localStorage.getItem('auth_token'),
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    const { user, token } = response.data;
    
    localStorage.setItem('auth_token', token);
    setAuthState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
    
    return response.data;
  };

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    const { user, token } = response.data;
    
    localStorage.setItem('auth_token', token);
    setAuthState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
    
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem('auth_token');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...authState,
    login,
    register,
    logout,
  };
};