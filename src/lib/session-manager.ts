/**
 * SessionManager - Browser-based session management for persistent login
 * Handles JWT token storage, expiration tracking, and session validation
 */

export interface User {
  id: number;
  name: string;
  email: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  tokens: number;
  avatarUrl: string;
}

export interface SessionData {
  userId: number;
  userEmail: string;
  token: string;
  rememberMe: boolean;
  tokenExpiry?: string;
  lastActivity?: string;
}

export interface SessionInfo {
  userId: number | null;
  userEmail: string | null;
  tokenExpiry: Date | null;
  lastActivity: Date | null;
  rememberMe: boolean;
  isValid: boolean;
}

class SessionManager {
  private static instance: SessionManager;

  // Session keys for localStorage
  private readonly KEYS = {
    USER_ID: 'questify_userId',
    USER_EMAIL: 'questify_userEmail',
    AUTH_TOKEN: 'authToken', // Keep existing key for compatibility
    TOKEN_EXPIRY: 'questify_tokenExpiry',
    LAST_ACTIVITY: 'questify_lastActivity',
    REMEMBER_ME: 'questify_rememberMe',
    USER_DATA: 'user', // Keep existing key for compatibility
  };

  // Session configuration
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Check if we're running in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Check if user has a valid session
   */
  hasValidSession(): boolean {
    if (!this.isBrowser()) return false;

    try {
      const userId = localStorage.getItem(this.KEYS.USER_ID);
      const token = localStorage.getItem(this.KEYS.AUTH_TOKEN);
      const rememberMe = localStorage.getItem(this.KEYS.REMEMBER_ME) === 'true';

      if (!userId || !token) {
        return false;
      }

      // Check if remember me is enabled
      if (!rememberMe) {
        // Check session timeout
        const lastActivityStr = localStorage.getItem(this.KEYS.LAST_ACTIVITY);
        if (lastActivityStr) {
          const lastActivity = new Date(lastActivityStr);
          const timeSinceActivity = Date.now() - lastActivity.getTime();

          if (timeSinceActivity > this.SESSION_TIMEOUT) {
            this.clearSession();
            return false;
          }
        }
      }

      // Check token expiry
      const tokenExpiryStr = localStorage.getItem(this.KEYS.TOKEN_EXPIRY);
      if (tokenExpiryStr) {
        const tokenExpiry = new Date(tokenExpiryStr);

        if (Date.now() > tokenExpiry.getTime()) {
          console.log('[SessionManager] Token expired');
          this.clearSession();
          return false;
        }

        // Check if token needs refresh soon
        const timeUntilExpiry = tokenExpiry.getTime() - Date.now();
        if (timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD) {
          console.log('[SessionManager] Token will expire soon, consider refreshing');
        }
      }

      // Update last activity
      this.updateLastActivity();

      return true;
    } catch (error) {
      console.error('[SessionManager] Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Save a new session after login
   */
  saveSession(user: User, token: string, rememberMe: boolean = false): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(this.KEYS.USER_ID, user.id.toString());
      localStorage.setItem(this.KEYS.USER_EMAIL, user.email);
      localStorage.setItem(this.KEYS.AUTH_TOKEN, token);
      localStorage.setItem(this.KEYS.REMEMBER_ME, rememberMe.toString());
      localStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(user));

      // Calculate token expiry (default 7 days as per backend)
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem(this.KEYS.TOKEN_EXPIRY, tokenExpiry.toISOString());

      // Update last activity
      this.updateLastActivity();

      console.log('[SessionManager] Session saved for user:', user.email);
    } catch (error) {
      console.error('[SessionManager] Error saving session:', error);
      throw error;
    }
  }

  /**
   * Load session data
   */
  loadSession(): SessionData | null {
    if (!this.isBrowser()) return null;

    try {
      const userId = localStorage.getItem(this.KEYS.USER_ID);
      const userEmail = localStorage.getItem(this.KEYS.USER_EMAIL);
      const token = localStorage.getItem(this.KEYS.AUTH_TOKEN);
      const rememberMe = localStorage.getItem(this.KEYS.REMEMBER_ME) === 'true';
      const tokenExpiry = localStorage.getItem(this.KEYS.TOKEN_EXPIRY);
      const lastActivity = localStorage.getItem(this.KEYS.LAST_ACTIVITY);

      if (!userId || !token) {
        return null;
      }

      return {
        userId: parseInt(userId, 10),
        userEmail: userEmail || '',
        token,
        rememberMe,
        tokenExpiry: tokenExpiry || undefined,
        lastActivity: lastActivity || undefined,
      };
    } catch (error) {
      console.error('[SessionManager] Error loading session:', error);
      return null;
    }
  }

  /**
   * Clear the current session (logout)
   */
  clearSession(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.removeItem(this.KEYS.USER_ID);
      localStorage.removeItem(this.KEYS.USER_EMAIL);
      localStorage.removeItem(this.KEYS.AUTH_TOKEN);
      localStorage.removeItem(this.KEYS.TOKEN_EXPIRY);
      localStorage.removeItem(this.KEYS.LAST_ACTIVITY);
      localStorage.removeItem(this.KEYS.REMEMBER_ME);
      localStorage.removeItem(this.KEYS.USER_DATA);

      console.log('[SessionManager] Session cleared');
    } catch (error) {
      console.error('[SessionManager] Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(this.KEYS.LAST_ACTIVITY, new Date().toISOString());
    } catch (error) {
      console.error('[SessionManager] Error updating last activity:', error);
    }
  }

  /**
   * Update activity on user interaction
   */
  updateActivity(): void {
    this.updateLastActivity();
  }

  /**
   * Get session information
   */
  getSessionInfo(): SessionInfo {
    if (!this.isBrowser()) {
      return {
        userId: null,
        userEmail: null,
        tokenExpiry: null,
        lastActivity: null,
        rememberMe: false,
        isValid: false,
      };
    }

    try {
      const userId = localStorage.getItem(this.KEYS.USER_ID);
      const userEmail = localStorage.getItem(this.KEYS.USER_EMAIL);
      const tokenExpiryStr = localStorage.getItem(this.KEYS.TOKEN_EXPIRY);
      const lastActivityStr = localStorage.getItem(this.KEYS.LAST_ACTIVITY);
      const rememberMe = localStorage.getItem(this.KEYS.REMEMBER_ME) === 'true';

      return {
        userId: userId ? parseInt(userId, 10) : null,
        userEmail: userEmail || null,
        tokenExpiry: tokenExpiryStr ? new Date(tokenExpiryStr) : null,
        lastActivity: lastActivityStr ? new Date(lastActivityStr) : null,
        rememberMe,
        isValid: this.hasValidSession(),
      };
    } catch (error) {
      console.error('[SessionManager] Error getting session info:', error);
      return {
        userId: null,
        userEmail: null,
        tokenExpiry: null,
        lastActivity: null,
        rememberMe: false,
        isValid: false,
      };
    }
  }

  /**
   * Check if token will expire soon
   */
  shouldRefreshToken(): boolean {
    if (!this.isBrowser()) return false;

    try {
      const tokenExpiryStr = localStorage.getItem(this.KEYS.TOKEN_EXPIRY);

      if (!tokenExpiryStr) {
        return false;
      }

      const tokenExpiry = new Date(tokenExpiryStr);
      const timeUntilExpiry = tokenExpiry.getTime() - Date.now();

      return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      console.error('[SessionManager] Error checking token refresh:', error);
      return false;
    }
  }

  /**
   * Get time until session expires
   */
  getTimeUntilExpiry(): number | null {
    if (!this.isBrowser()) return null;

    try {
      const tokenExpiryStr = localStorage.getItem(this.KEYS.TOKEN_EXPIRY);

      if (!tokenExpiryStr) {
        return null;
      }

      const tokenExpiry = new Date(tokenExpiryStr);
      return tokenExpiry.getTime() - Date.now();
    } catch (error) {
      console.error('[SessionManager] Error getting time until expiry:', error);
      return null;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.KEYS.AUTH_TOKEN);
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    if (!this.isBrowser()) return null;

    try {
      const userStr = localStorage.getItem(this.KEYS.USER_DATA);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[SessionManager] Error getting current user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
