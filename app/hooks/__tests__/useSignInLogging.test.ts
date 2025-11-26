import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSignInLogging } from '../useSignInLogging';
import { SignInLogger } from '@/app/lib/signin-logger';

// Mock the SignInLogger
vi.mock('@/app/lib/signin-logger', () => ({
  SignInLogger: {
    logSignIn: vi.fn(),
    getUserSignInHistory: vi.fn(),
    getDeviceInfo: vi.fn(() => ({ browser: 'Chrome', os: 'Windows' })),
  },
}));

describe('useSignInLogging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
  });

  it('should initialize with all required functions', () => {
    const { result } = renderHook(() => useSignInLogging());

    expect(result.current.logSignIn).toBeDefined();
    expect(result.current.logSignInSuccess).toBeDefined();
    expect(result.current.logSignInFailure).toBeDefined();
    expect(result.current.getUserSignInHistory).toBeDefined();
  });

  it('should call SignInLogger.logSignIn with correct data', async () => {
    const { result } = renderHook(() => useSignInLogging());

    const signInData = {
      userId: 'user-123',
      email: 'test@example.com',
      success: true,
      sessionId: 'session-123',
    };

    await act(async () => {
      await result.current.logSignIn(signInData);
    });

    expect(SignInLogger.logSignIn).toHaveBeenCalledTimes(1);
    const callArgs = (SignInLogger.logSignIn as any).mock.calls[0][0];
    expect(callArgs.userId).toBe('user-123');
    expect(callArgs.email).toBe('test@example.com');
    expect(callArgs.success).toBe(true);
    expect(callArgs.sessionId).toBe('session-123');
    expect(callArgs.userAgent).toBeDefined();
    expect(callArgs.deviceInfo).toBeDefined();
  });

  it('should log successful sign-in with logSignInSuccess', async () => {
    const { result } = renderHook(() => useSignInLogging());

    await act(async () => {
      await result.current.logSignInSuccess('user-123', 'test@example.com', 'session-456');
    });

    expect(SignInLogger.logSignIn).toHaveBeenCalledTimes(1);
    const callArgs = (SignInLogger.logSignIn as any).mock.calls[0][0];
    expect(callArgs.userId).toBe('user-123');
    expect(callArgs.email).toBe('test@example.com');
    expect(callArgs.success).toBe(true);
    expect(callArgs.sessionId).toBe('session-456');
  });

  it('should log failed sign-in with logSignInFailure', async () => {
    const { result } = renderHook(() => useSignInLogging());

    await act(async () => {
      await result.current.logSignInFailure('user-123', 'test@example.com', 'Invalid credentials');
    });

    expect(SignInLogger.logSignIn).toHaveBeenCalledTimes(1);
    const callArgs = (SignInLogger.logSignIn as any).mock.calls[0][0];
    expect(callArgs.userId).toBe('user-123');
    expect(callArgs.email).toBe('test@example.com');
    expect(callArgs.success).toBe(false);
    expect(callArgs.failureReason).toBe('Invalid credentials');
  });

  it('should handle anonymous user in logSignInFailure', async () => {
    const { result } = renderHook(() => useSignInLogging());

    await act(async () => {
      await result.current.logSignInFailure('', 'test@example.com', 'User not found');
    });

    expect(SignInLogger.logSignIn).toHaveBeenCalledTimes(1);
    const callArgs = (SignInLogger.logSignIn as any).mock.calls[0][0];
    expect(callArgs.userId).toBe('anonymous');
  });

  it('should get user sign-in history', async () => {
    const mockHistory = [
      { id: 1, user_id: 'user-123', email: 'test@example.com', success: true },
      { id: 2, user_id: 'user-123', email: 'test@example.com', success: false },
    ];

    (SignInLogger.getUserSignInHistory as any).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useSignInLogging());

    let history: any[] = [];
    await act(async () => {
      history = await result.current.getUserSignInHistory('user-123', 10);
    });

    expect(SignInLogger.getUserSignInHistory).toHaveBeenCalledWith('user-123', 10);
    expect(history).toEqual(mockHistory);
  });

  it('should handle errors gracefully without throwing', async () => {
    (SignInLogger.logSignIn as any).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useSignInLogging());

    await act(async () => {
      await result.current.logSignInSuccess('user-123', 'test@example.com');
    });

    // Should not throw, just log error
    expect(SignInLogger.logSignIn).toHaveBeenCalled();
  });
});

