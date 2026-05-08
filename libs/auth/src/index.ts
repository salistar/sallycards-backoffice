/**
 * @sally/auth
 * Authentication and identity management for SallyCards.
 * Provides: anonymous auth, token management, session persistence, and token refresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@sally/auth_token';
const REFRESH_TOKEN_STORAGE_KEY = '@sally/auth_refresh_token';
const USER_ID_STORAGE_KEY = '@sally/auth_user_id';
const TOKEN_EXPIRY_KEY = '@sally/auth_token_expiry';

export interface AuthToken {
  access: string;
  refresh: string;
  expiresIn: number; // seconds
  expiresAt: number; // timestamp
}

export interface AuthUser {
  id: string;
  username: string;
  isAnonymous: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: AuthToken | null;
  isLoading: boolean;
  error: string | null;
}

type AuthCallback = (state: AuthState) => void;

/**
 * Main auth manager for SallyCards.
 * Handles token storage, refresh, and anonymous auth.
 */
export class AuthManager {
  private user: AuthUser | null = null;
  private token: AuthToken | null = null;
  private isLoading = false;
  private error: string | null = null;
  private callbacks: Set<AuthCallback> = new Set();
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private apiBaseUrl: string,
  ) {}

  /**
   * Initialize auth from stored credentials.
   * Call once on app startup.
   */
  async initialize(): Promise<void> {
    this.isLoading = true;
    this.notify();

    try {
      const [storedToken, storedUserId] = await Promise.all([
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(USER_ID_STORAGE_KEY),
      ]);

      if (storedToken && storedUserId) {
        const token = JSON.parse(storedToken) as AuthToken;

        // Check if token is still valid
        if (token.expiresAt > Date.now()) {
          this.token = token;
          this.user = {
            id: storedUserId,
            username: `User_${storedUserId.slice(0, 6)}`,
            isAnonymous: true,
          };

          // Schedule token refresh
          this.scheduleTokenRefresh();
        } else {
          // Token expired, try to refresh
          await this.refreshTokenSilent();
        }
      }
    } catch (err) {
      console.error('[AuthManager] Failed to restore session:', err);
      this.error = 'Failed to restore session';
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  /**
   * Authenticate anonymously (creates a new anonymous session).
   */
  async loginAnonymously(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Auth failed with status ${response.status}`);
      }

      const data = await response.json() as AuthToken & { userId: string };

      this.token = {
        access: data.access,
        refresh: data.refresh,
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      this.user = {
        id: data.userId,
        username: `User_${data.userId.slice(0, 6)}`,
        isAnonymous: true,
      };

      // Store credentials
      await this.persistToken();
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, data.userId);

      // Schedule refresh
      this.scheduleTokenRefresh();

      this.isLoading = false;
      this.notify();

      return { success: true, user: this.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      this.error = message;
      this.isLoading = false;
      this.notify();
      return { success: false, error: message };
    }
  }

  /**
   * Upgrade anonymous account to permanent (when user provides email/password).
   * Not fully implemented - placeholder for future social auth integration.
   */
  async upgradeAccount(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.user || !this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token.access}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Upgrade failed with status ${response.status}`);
      }

      this.user.isAnonymous = false;
      this.notify();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upgrade failed';
      return { success: false, error: message };
    }
  }

  /**
   * Logout and clear stored credentials.
   */
  async logout(): Promise<void> {
    this.user = null;
    this.token = null;

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(USER_ID_STORAGE_KEY),
        AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
      ]);
    } catch (err) {
      console.error('[AuthManager] Failed to clear credentials:', err);
    }

    this.notify();
  }

  /**
   * Refresh the access token using the refresh token.
   */
  private async refreshTokenSilent(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.token.refresh }),
      });

      if (!response.ok) {
        // Refresh failed - logout
        await this.logout();
        return false;
      }

      const data = await response.json() as { access: string; expiresIn: number };

      this.token.access = data.access;
      this.token.expiresIn = data.expiresIn;
      this.token.expiresAt = Date.now() + data.expiresIn * 1000;

      await this.persistToken();
      this.scheduleTokenRefresh();

      return true;
    } catch (err) {
      console.error('[AuthManager] Token refresh failed:', err);
      return false;
    }
  }

  /**
   * Schedule automatic token refresh before expiration.
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!this.token) return;

    // Refresh 5 minutes before expiration
    const msUntilExpiry = this.token.expiresAt - Date.now();
    const msUntilRefresh = Math.max(0, msUntilExpiry - 5 * 60 * 1000);

    this.refreshTimeout = setTimeout(() => {
      this.refreshTokenSilent().catch((err) => {
        console.error('[AuthManager] Auto-refresh failed:', err);
      });
    }, msUntilRefresh);
  }

  /**
   * Persist token to storage.
   */
  private async persistToken(): Promise<void> {
    if (!this.token) return;

    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.token));
    } catch (err) {
      console.error('[AuthManager] Failed to persist token:', err);
    }
  }

  /**
   * Get current auth state.
   */
  getState(): AuthState {
    return {
      user: this.user,
      token: this.token,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  /**
   * Get current access token.
   */
  getAccessToken(): string | null {
    return this.token?.access ?? null;
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null && this.token.expiresAt > Date.now();
  }

  /**
   * Subscribe to auth state changes.
   */
  subscribe(callback: AuthCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all subscribers of state change.
   */
  private notify(): void {
    const state = this.getState();
    this.callbacks.forEach((cb) => cb(state));
  }

  /**
   * Cleanup on destroy.
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    this.callbacks.clear();
  }
}

// Export singleton for app-wide use
const API_URL = typeof process !== 'undefined' && process.env?.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : 'https://api.sallycards.com';

export const authManager = new AuthManager(API_URL);
