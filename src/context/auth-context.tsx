'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { sessionManager, User } from '@/lib/session-manager';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string, rememberMe?: boolean) => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  updateActivity: () => void;
  getSessionInfo: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if session is valid on mount
    const checkSession = () => {
      const hasValidSession = apiClient.hasValidSession();
      
      if (hasValidSession) {
        const savedUser = apiClient.getCurrentUser();
        const sessionInfo = apiClient.getSessionInfo();
        
        if (savedUser) {
          setUser(savedUser);
          setRememberMe(sessionInfo.rememberMe);
          console.log('[AuthProvider] Session restored for user:', savedUser.email);
        }
      } else {
        console.log('[AuthProvider] No valid session found');
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Update activity periodically
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      apiClient.updateActivity();
    };

    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Update activity every 5 minutes
    const interval = setInterval(handleActivity, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [user]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await apiClient.signin(email, password, rememberMe);
    setUser(response.user);
    setRememberMe(rememberMe);
  };

  const signup = async (name: string, email: string, password: string, rememberMe: boolean = false) => {
    const response = await apiClient.signup(name, email, password, rememberMe);
    setUser(response.user);
    setRememberMe(rememberMe);
  };

  const handleOAuthCallback = async (token: string) => {
    // Store the token and fetch user data
    const response = await apiClient.handleOAuthToken(token);
    setUser(response.user);
    setRememberMe(true); // OAuth sessions are always "remember me"
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setRememberMe(false);
  };

  const updateActivity = () => {
    apiClient.updateActivity();
  };

  const getSessionInfo = () => {
    return apiClient.getSessionInfo();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        handleOAuthCallback,
        logout,
        isAuthenticated: !!user,
        isLoading,
        rememberMe,
        updateActivity,
        getSessionInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
