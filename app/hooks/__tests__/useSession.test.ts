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
});

