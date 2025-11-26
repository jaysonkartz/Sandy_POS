import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../protected-route';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock supabase client first to prevent initialization errors
vi.mock('@/app/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock hooks
vi.mock('@/app/hooks/useAuth');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('should show loading when auth is loading', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: true });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    (useAuth as any).mockReturnValue({ user: mockUser, loading: false });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should not redirect while loading', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: true });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render nothing when user is not authenticated and not loading', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(container.firstChild).toBeNull();
  });
});

