import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { supabase } from '@/app/lib/supabaseClient';

// Mock supabase
vi.mock('@/app/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state and null user', () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('should set user when session exists', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should set user to null when no session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
  });

  it('should subscribe to auth state changes', () => {
    const unsubscribe = vi.fn();
    
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth());

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should update user on auth state change', async () => {
    const mockUser = { id: 'user-456', email: 'new@example.com' };
    let authStateChangeCallback: any;

    (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate auth state change
    act(() => {
      authStateChangeCallback('SIGNED_IN', { user: mockUser });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });
});

