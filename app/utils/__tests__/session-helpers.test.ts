import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRefreshTokenError,
  clearInvalidSession,
  refreshSession,
  handleRefreshTokenError,
  persistSession,
} from '../session-helpers';
import { supabase } from '@/app/lib/supabaseClient';
import { STORAGE_KEYS } from '@/app/constants/app-constants';

// Mock supabase
vi.mock('@/app/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      refreshSession: vi.fn(),
    },
  },
}));

describe('session-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage and ensure it's reset
    if (localStorage.clear) {
      localStorage.clear();
    } else {
      // Fallback: manually remove all keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
    }
  });

  describe('isRefreshTokenError', () => {
    it('should return true for "Invalid Refresh Token" error', () => {
      const error = { message: 'Invalid Refresh Token' };
      expect(isRefreshTokenError(error)).toBe(true);
    });

    it('should return true for "Refresh Token Not Found" error', () => {
      const error = { message: 'Refresh Token Not Found' };
      expect(isRefreshTokenError(error)).toBe(true);
    });

    it('should return true for refresh_token_not_found code', () => {
      const error = { code: 'refresh_token_not_found' };
      expect(isRefreshTokenError(error)).toBe(true);
    });

    it('should return true for session_not_found code', () => {
      const error = { code: 'session_not_found' };
      expect(isRefreshTokenError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { message: 'Some other error' };
      expect(isRefreshTokenError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isRefreshTokenError(null)).toBe(false);
      expect(isRefreshTokenError(undefined)).toBe(false);
    });
  });

  describe('clearInvalidSession', () => {
    it('should remove supabase keys from localStorage', () => {
      // Clear localStorage first to ensure clean state
      localStorage.clear();
      
      localStorage.setItem('sb-test-key', 'value');
      localStorage.setItem('supabase-key', 'value');
      localStorage.setItem(STORAGE_KEYS.SESSION, 'session-data');
      localStorage.setItem('other-key', 'value');

      // Verify keys exist before clearing
      expect(localStorage.getItem('sb-test-key')).toBe('value');
      expect(localStorage.getItem('supabase-key')).toBe('value');
      expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBe('session-data');

      clearInvalidSession();

      expect(localStorage.getItem('sb-test-key')).toBeNull();
      expect(localStorage.getItem('supabase-key')).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('value');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearInvalidSession()).not.toThrow();

      localStorage.getItem = originalGetItem;
    });
  });

  describe('refreshSession', () => {
    it('should return session when refresh is successful', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
        refresh_token: 'refresh',
      };

      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await refreshSession();
      expect(result).toEqual(mockSession);
    });

    it('should return null when refresh token error occurs', async () => {
      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid Refresh Token' },
      });

      const result = await refreshSession();
      expect(result).toBeNull();
    });

    it('should return null when no session is returned', async () => {
      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await refreshSession();
      expect(result).toBeNull();
    });

    it('should return null on exception', async () => {
      (supabase.auth.refreshSession as any).mockRejectedValue(new Error('Network error'));

      const result = await refreshSession();
      expect(result).toBeNull();
    });
  });

  describe('handleRefreshTokenError', () => {
    it('should clear session and user role', () => {
      const setSession = vi.fn();
      const setUserRole = vi.fn();

      localStorage.setItem(STORAGE_KEYS.SESSION, 'session-data');
      localStorage.setItem('sb-key', 'value');

      handleRefreshTokenError(setSession, setUserRole);

      expect(setSession).toHaveBeenCalledWith(null);
      expect(setUserRole).toHaveBeenCalledWith('');
      expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
    });
  });

  describe('persistSession', () => {
    it('should save session to localStorage when session exists', () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 1234567890,
      };

      persistSession(mockSession as any);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || '{}');
      expect(stored.access_token).toBe('token');
      expect(stored.refresh_token).toBe('refresh');
      expect(stored.user).toEqual(mockSession.user);
      expect(stored.expires_at).toBe(1234567890);
    });

    it('should remove session from localStorage when session is null', () => {
      localStorage.setItem(STORAGE_KEYS.SESSION, 'existing-data');

      persistSession(null);

      expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 1234567890,
      };

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => persistSession(mockSession as any)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });
});

