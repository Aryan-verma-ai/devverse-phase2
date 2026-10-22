/**
 * DEVVERSE — React Authentication Context
 *
 * Manages the real server session state for the client:
 *   - Fetches current user from GET /api/auth/me on mount (session hydration).
 *   - Handles graceful fallback for unauthenticated guests (no localStorage tokens).
 *   - Exposes login, signup, logout, and refreshUser actions.
 *   - Exposes isAuthenticated flag and loading state to guard protected routes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Hydrates the user session on application load or refresh.
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setError(null);
      return currentUser;
    } catch (err) {
      // 401 UNAUTHORIZED is expected for guest visitors — do not treat as an error
      if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
        setUser(null);
        setError(null);
      } else {
        // Unexpected network or server error
        setUser(null);
        setError(err?.message || 'Unable to verify authentication status.');
      }
      return null;
    }
  }, []);

  // Initial session hydration on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          // Only report non-401 errors
          if (err?.status !== 401 && err?.code !== 'UNAUTHORIZED') {
            setError(err?.message || 'Failed to initialize session.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Logs in with email/username and password.
   */
  const login = useCallback(async (credentials) => {
    setError(null);
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  /**
   * Registers a new user account.
   */
  const signup = useCallback(async (userData) => {
    setError(null);
    const signedUpUser = await authService.signup(userData);
    setUser(signedUpUser);
    return signedUpUser;
  }, []);

  /**
   * Signs out the user and clears server session cookie.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume the AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
