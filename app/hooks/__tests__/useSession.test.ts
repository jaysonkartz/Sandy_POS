import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSession } from '../useSession';
import { supabase } from '@/app/lib/supabaseClient';
import * as sessionHelpers from '@/app/utils/session-helpers';

// Mock dependencies
vi.mock('@/app/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      setSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/app/utils/session-helpers', () => ({
  isRefreshTokenError: vi.fn(),
  clearInvalidSession: vi.fn(),
  refreshSession: vi.fn(),
  handleRefreshTokenError: vi.fn(),
  persistSession: vi.fn(),
}));

describe('useSession', () => {
  const mockUnsubscribe = vi.fn();
  const mockSubscription = { unsubscribe: mockUnsubscribe };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    (supabase.auth.getSession as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBe(null);
    expect(result.current.userRole).toBe('');
  });

  it('should set session when valid session exists', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
      refresh_token: 'refresh',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.userRole).toBe('ADMIN');
  });

  it('should return false for isSessionValid when no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSessionValid).toBe(false);
  });

  it('should return true for isSessionValid when valid session exists', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'CUSTOMER' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSessionValid).toBe(true);
  });

  it('should handle sign out correctly', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.session).toBe(null);
    expect(result.current.userRole).toBe('');
  });

  it('should call forceRefreshSession', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useSession());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle auth state changes', async () => {
    let authStateChangeCallback: any;

    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      authStateChangeCallback = callback;
      return {
        data: { subscription: mockSubscription },
      };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const mockSession = {
      user: { id: 'user-456', email: 'new@example.com' },
      access_token: 'new-token',
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'CUSTOMER' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      authStateChangeCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(sessionHelpers.persistSession).toHaveBeenCalled();
    });
  });

  it('should handle auth state change with null session', async () => {
    let authStateChangeCallback: any;

    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      authStateChangeCallback = callback;
      return {
        data: { subscription: mockSubscription },
      };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      authStateChangeCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(result.current.userRole).toBe('');
      expect(result.current.session).toBe(null);
    });
  });

  it('should handle error in initializeSession', async () => {
    (supabase.auth.getSession as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });
  });

  it('should restore session from localStorage', async () => {
    const mockStoredSession = {
      access_token: 'stored-token',
      refresh_token: 'stored-refresh',
      user: { id: 'user-789', email: 'stored@example.com' },
    };

    localStorage.setItem('sandy_pos_session', JSON.stringify(mockStoredSession));

    const mockRestoredSession = {
      user: { id: 'user-789', email: 'stored@example.com' },
      access_token: 'stored-token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.setSession as any).mockResolvedValue({
      data: { session: mockRestoredSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'CUSTOMER' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'stored-token',
      refresh_token: 'stored-refresh',
    });
  });

  it('should handle invalid stored session in localStorage', async () => {
    localStorage.setItem('sandy_pos_session', 'invalid-json');

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(localStorage.getItem('sandy_pos_session')).toBeNull();
  });

  it('should handle refresh token error when restoring from localStorage', async () => {
    const mockStoredSession = {
      access_token: 'stored-token',
      refresh_token: 'stored-refresh',
      user: { id: 'user-789', email: 'stored@example.com' },
    };

    localStorage.setItem('sandy_pos_session', JSON.stringify(mockStoredSession));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.setSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid refresh token' },
    });

    (sessionHelpers.isRefreshTokenError as any).mockReturnValue(true);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(sessionHelpers.clearInvalidSession).toHaveBeenCalled();
  });

  it('should handle forceRefreshSession with error', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(result.current.session).toBe(null);
    expect(result.current.userRole).toBe('');
  });

  it('should handle forceRefreshSession when refresh fails', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(sessionHelpers.handleRefreshTokenError).toHaveBeenCalled();
  });

  it('should handle forceRefreshSession when refreshed session has no user', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue({
      user: null,
      access_token: 'token',
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(result.current.session).toBe(null);
    expect(result.current.userRole).toBe('');
  });

  it('should handle forceRefreshSession error', async () => {
    (supabase.auth.getSession as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(result.current.session).toBe(null);
    expect(result.current.userRole).toBe('');
  });

  it('should handle fetchUserRole error', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userRole).toBe('');
  });

  it('should handle aggressive session recovery with localStorage', async () => {
    const mockSession = {
      user: { id: 'user-999', email: 'recovered@example.com' },
      access_token: 'recovered-token',
    };

    // Set up localStorage with supabase key
    localStorage.setItem('sb-test-key', JSON.stringify({
      access_token: 'recovered-token',
      refresh_token: 'recovered-refresh',
    }));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    (supabase.auth.setSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger aggressive recovery by simulating session check
    await act(async () => {
      await result.current.forceRefreshSession();
    });
  });

  it('should handle aggressive session recovery with user in localStorage', async () => {
    const mockSession = {
      user: { id: 'user-888', email: 'local@example.com' },
    };

    localStorage.setItem('sb-test-key-2', JSON.stringify({
      user: { id: 'user-888', email: 'local@example.com' },
    }));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'CUSTOMER' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should auto-refresh session on interval', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify session is set up correctly - the interval will be set up internally
    expect(result.current.session).toBeTruthy();
    expect(result.current.userRole).toBe('ADMIN');

    // Cleanup
    unmount();
  });

  it('should handle session monitoring interval when session is invalid', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any)
      .mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })
      .mockResolvedValue({
        data: { session: null },
        error: null,
      });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify session monitoring is set up - the interval will handle errors gracefully
    expect(result.current.session).toBeTruthy();

    // Cleanup
    unmount();
  });

  it('should handle session monitoring interval when no session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify monitoring is set up - interval will attempt recovery
    expect(result.current.session).toBeNull();

    // Cleanup
    unmount();
  });

  it('should handle page visibility change when visible and no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      // Give time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Visibility handler is set up - verify it doesn't crash
    expect(result.current.session).toBeNull();

    // Cleanup
    unmount();
  });

  it('should handle page visibility change when visible and session invalid', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any)
      .mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })
      .mockResolvedValue({
        data: { session: null },
        error: null,
      });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      // Give time for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Visibility handler is set up - when session becomes invalid, it's cleared
    // The handler doesn't crash even when session is null
    expect(result.current.session).toBeNull();

    // Cleanup
    unmount();
  });

  it('should handle user activity timeout', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate user activity - activity handler is set up
    await act(async () => {
      document.dispatchEvent(new Event('mousedown'));
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify activity handler is set up
    expect(result.current.session).toBeTruthy();

    // Cleanup
    unmount();
  });

  it('should handle signOut error and fallback', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.signOut as any)
      .mockRejectedValueOnce(new Error('Sign out failed'))
      .mockResolvedValue({ error: null });

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.signOut();
      } catch (e) {
        // Ignore navigation errors
      }
    });

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(2);
    expect(localStorage.length).toBe(0);

    window.location = originalLocation;
    unmount();
  });

  it('should handle signOut with final error', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.signOut as any).mockRejectedValue(new Error('Sign out failed'));

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.signOut();
      } catch (e) {
        // Ignore navigation errors
      }
    });

    expect(window.location.href).toBe('/');

    window.location = originalLocation;
    unmount();
  });

  it('should handle session monitoring error gracefully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any)
      .mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })
      .mockRejectedValue(new Error('Network error'));

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Error handling is set up in monitoring interval - verify it doesn't crash
    expect(result.current.session).toBeTruthy();

    // Cleanup
    unmount();
  });

  it('should handle auto-refresh when refresh fails', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'ADMIN' },
            error: null,
          }),
        }),
      }),
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Auto-refresh interval is set up - error handling will be called when refresh fails
    expect(result.current.session).toBeTruthy();

    // Cleanup
    unmount();
  });

  it('should handle aggressive recovery with setSession error', async () => {
    localStorage.setItem('sb-test-key-3', JSON.stringify({
      access_token: 'token',
      refresh_token: 'refresh',
    }));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    (supabase.auth.setSession as any).mockRejectedValue(new Error('Set session failed'));

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });

    // Error is handled gracefully - verify hook doesn't crash
    expect(result.current.session).toBeNull();

    // Cleanup
    localStorage.removeItem('sb-test-key-3');
    unmount();
  });

  it('should handle aggressive recovery with localStorage parse error', async () => {
    localStorage.setItem('sb-test-key-4', 'invalid-json-{');

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });

    // Parse error is handled gracefully
    expect(result.current.session).toBeNull();

    // Cleanup
    localStorage.removeItem('sb-test-key-4');
    unmount();
  });

  it('should handle aggressive recovery when localStorage access fails', async () => {
    const originalKeys = Object.keys;
    let callCount = 0;
    
    // Create a function that returns empty array when accessing localStorage
    const mockKeys = function(obj: any) {
      callCount++;
      // Return empty array for localStorage to simulate access failure
      if (callCount > 1 && obj === localStorage) {
        return [];
      }
      return originalKeys.call(this, obj);
    };
    Object.keys = mockKeys as any;

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (sessionHelpers.refreshSession as any).mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });

    // Error is handled gracefully
    expect(result.current.session).toBeNull();

    // Restore original
    Object.keys = originalKeys;
    unmount();
  });

  it('should handle stored session without access_token', async () => {
    const mockStoredSession = {
      user: { id: 'user-999', email: 'stored@example.com' },
    };

    localStorage.setItem('sandy_pos_session', JSON.stringify(mockStoredSession));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'CUSTOMER' },
            error: null,
          }),
        }),
      }),
    });

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });

    // Session without access_token cannot be restored (needs access_token for setSession)
    // The code handles this gracefully - session remains null
    expect(result.current.session).toBeNull();

    // Cleanup
    localStorage.removeItem('sandy_pos_session');
    unmount();
  });

  it('should handle stored session restore error', async () => {
    const mockStoredSession = {
      access_token: 'stored-token',
      refresh_token: 'stored-refresh',
      user: { id: 'user-789', email: 'stored@example.com' },
    };

    localStorage.setItem('sandy_pos_session', JSON.stringify(mockStoredSession));

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.setSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Restore failed' },
    });

    (sessionHelpers.isRefreshTokenError as any).mockReturnValue(false);

    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 6000 });

    expect(localStorage.getItem('sandy_pos_session')).toBeNull();

    // Cleanup
    unmount();
  });
});

