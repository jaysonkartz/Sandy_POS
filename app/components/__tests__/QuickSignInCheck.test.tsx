import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QuickSignInCheck from '../QuickSignInCheck';
import { SignInLogger } from '@/app/lib/signin-logger';

// Mock SignInLogger
vi.mock('@/app/lib/signin-logger', () => ({
  SignInLogger: {
    getRecentSignIns: vi.fn(),
  },
}));

describe('QuickSignInCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (SignInLogger.getRecentSignIns as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<QuickSignInCheck />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display recent sign-ins when data is loaded', async () => {
    const mockRecords = [
      {
        id: 1,
        email: 'test1@example.com',
        success: true,
        sign_in_at: new Date().toISOString(),
        failure_reason: null,
        device_info: { browser: 'Chrome', os: 'Windows' },
      },
      {
        id: 2,
        email: 'test2@example.com',
        success: false,
        sign_in_at: new Date().toISOString(),
        failure_reason: 'Invalid password',
        device_info: null,
      },
    ];

    (SignInLogger.getRecentSignIns as any).mockResolvedValue(mockRecords);

    render(<QuickSignInCheck />);

    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Sign-ins')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should display "Recent Failed Sign-ins" when showFailedOnly is true', async () => {
    const mockRecords = [
      {
        id: 1,
        email: 'test1@example.com',
        success: false,
        sign_in_at: new Date().toISOString(),
        failure_reason: 'Invalid credentials',
        device_info: null,
      },
    ];

    (SignInLogger.getRecentSignIns as any).mockResolvedValue(mockRecords);

    render(<QuickSignInCheck showFailedOnly={true} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Failed Sign-ins')).toBeInTheDocument();
    });
  });

  it('should filter failed sign-ins when showFailedOnly is true', async () => {
    const mockRecords = [
      {
        id: 1,
        email: 'success@example.com',
        success: true,
        sign_in_at: new Date().toISOString(),
        failure_reason: null,
        device_info: null,
      },
      {
        id: 2,
        email: 'failed@example.com',
        success: false,
        sign_in_at: new Date().toISOString(),
        failure_reason: 'Error',
        device_info: null,
      },
    ];

    (SignInLogger.getRecentSignIns as any).mockResolvedValue(mockRecords);

    render(<QuickSignInCheck showFailedOnly={true} limit={10} />);

    await waitFor(() => {
      expect(screen.queryByText('success@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('failed@example.com')).toBeInTheDocument();
    });
  });

  it('should display error message and retry button on error', async () => {
    (SignInLogger.getRecentSignIns as any).mockRejectedValue(new Error('Database error'));

    render(<QuickSignInCheck />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch records')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should retry fetching when retry button is clicked', async () => {
    (SignInLogger.getRecentSignIns as any)
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce([]);

    render(<QuickSignInCheck />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    retryButton.click();

    await waitFor(() => {
      expect(SignInLogger.getRecentSignIns).toHaveBeenCalledTimes(2);
    });
  });

  it('should display "No records found" when no records exist', async () => {
    (SignInLogger.getRecentSignIns as any).mockResolvedValue([]);

    render(<QuickSignInCheck />);

    await waitFor(() => {
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });
  });

  it('should respect limit prop', async () => {
    const mockRecords = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      email: `test${i + 1}@example.com`,
      success: true,
      sign_in_at: new Date().toISOString(),
      failure_reason: null,
      device_info: null,
    }));

    (SignInLogger.getRecentSignIns as any).mockResolvedValue(mockRecords);

    render(<QuickSignInCheck limit={5} />);

    await waitFor(() => {
      const displayedRecords = screen.getAllByText(/test\d+@example\.com/);
      expect(displayedRecords.length).toBeLessThanOrEqual(5);
    });
  });

  it('should display device info when available', async () => {
    const mockRecords = [
      {
        id: 1,
        email: 'test@example.com',
        success: true,
        sign_in_at: new Date().toISOString(),
        failure_reason: null,
        device_info: { browser: 'Chrome', os: 'Windows' },
      },
    ];

    (SignInLogger.getRecentSignIns as any).mockResolvedValue(mockRecords);

    render(<QuickSignInCheck />);

    await waitFor(() => {
      expect(screen.getByText(/Chrome on Windows/)).toBeInTheDocument();
    });
  });
});

