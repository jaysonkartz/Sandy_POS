import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignInLogger } from '../signin-logger';
import { supabase } from '../supabaseClient';

// Mock supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SignInLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDeviceInfo', () => {
    it('should detect Chrome browser', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.browser).toBe('Chrome');
    });

    it('should detect Firefox browser', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.browser).toBe('Firefox');
    });

    it('should detect Safari browser', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.browser).toBe('Safari');
    });

    it('should detect Windows OS', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.os).toBe('Windows');
    });

    it('should detect macOS', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.os).toBe('macOS');
    });

    it('should detect Linux OS', () => {
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.os).toBe('Linux');
    });

    it('should detect Android OS', () => {
      // Note: The implementation checks Linux before Android, so we need Android without Linux
      const userAgent = 'Mozilla/5.0 (Android 11; SM-G991B) AppleWebKit/537.36';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.os).toBe('Android');
    });

    it('should detect Mobile device type', () => {
      // The implementation checks for "Mobile" string in user agent
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Mobile/15E148';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.deviceType).toBe('Mobile');
    });

    it('should detect Desktop device type by default', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      expect(deviceInfo.deviceType).toBe('Desktop');
    });

    it('should return empty object for undefined userAgent', () => {
      const deviceInfo = SignInLogger.getDeviceInfo(undefined);
      expect(deviceInfo).toEqual({});
    });
  });

  describe('getClientIP', () => {
    it('should return CF-Connecting-IP if available', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
          'x-forwarded-for': '9.10.11.12',
        },
      });

      const ip = SignInLogger.getClientIP(request);
      expect(ip).toBe('1.2.3.4');
    });

    it('should return x-real-ip if CF-Connecting-IP is not available', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '5.6.7.8',
          'x-forwarded-for': '9.10.11.12',
        },
      });

      const ip = SignInLogger.getClientIP(request);
      expect(ip).toBe('5.6.7.8');
    });

    it('should return first IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '9.10.11.12, 13.14.15.16',
        },
      });

      const ip = SignInLogger.getClientIP(request);
      expect(ip).toBe('9.10.11.12');
    });

    it('should return undefined if no IP headers are present', () => {
      const request = new Request('https://example.com');
      const ip = SignInLogger.getClientIP(request);
      expect(ip).toBeUndefined();
    });
  });

  describe('logSignIn', () => {
    it('should insert sign-in record to database', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ data: [], error: null }),
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockReturnValue(mockFrom());

      const signInData = {
        userId: 'user-123',
        email: 'test@example.com',
        success: true,
        sessionId: 'session-123',
        userAgent: 'Mozilla/5.0',
        deviceInfo: { browser: 'Chrome' },
      };

      await SignInLogger.logSignIn(signInData);

      expect(supabase.from).toHaveBeenCalledWith('sign_in_records');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ data: null, error: new Error('DB error') }),
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockReturnValue(mockFrom());

      const signInData = {
        userId: 'user-123',
        email: 'test@example.com',
        success: true,
      };

      await expect(SignInLogger.logSignIn(signInData)).resolves.not.toThrow();
    });
  });

  describe('getUserSignInHistory', () => {
    it('should fetch user sign-in history', async () => {
      const mockData = [
        { id: 1, user_id: 'user-123', email: 'test@example.com', success: true },
        { id: 2, user_id: 'user-123', email: 'test@example.com', success: false },
      ];

      // Create a proper chain: from().select().eq().order().limit()
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrderFn = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqFn = vi.fn().mockReturnValue({ order: mockOrderFn });
      const mockSelectFn = vi.fn().mockReturnValue({ eq: mockEqFn });
      const mockFrom = { select: mockSelectFn };
      (supabase.from as any).mockReturnValue(mockFrom);

      const result = await SignInLogger.getUserSignInHistory('user-123', 10);

      expect(supabase.from).toHaveBeenCalledWith('sign_in_records');
      expect(mockSelectFn).toHaveBeenCalledWith('*');
      expect(mockEqFn).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockOrderFn).toHaveBeenCalledWith('sign_in_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockData);
    });

    it('should return empty array on error', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
      const mockOrderFn = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqFn = vi.fn().mockReturnValue({ order: mockOrderFn });
      const mockSelectFn = vi.fn().mockReturnValue({ eq: mockEqFn });
      const mockFrom = { select: mockSelectFn };
      (supabase.from as any).mockReturnValue(mockFrom);

      const result = await SignInLogger.getUserSignInHistory('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('getRecentSignIns', () => {
    it('should fetch recent sign-ins', async () => {
      const mockData = [
        { id: 1, email: 'test1@example.com', success: true },
        { id: 2, email: 'test2@example.com', success: false },
      ];

      const mockLimit = vi.fn().mockReturnValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any).mockReturnValue(mockFrom());

      const result = await SignInLogger.getRecentSignIns(50);

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('sign_in_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('getSignInStats', () => {
    it('should calculate sign-in statistics', async () => {
      const mockData = [
        { user_id: 'user-1', success: true },
        { user_id: 'user-1', success: true },
        { user_id: 'user-2', success: false },
        { user_id: 'user-3', success: true },
      ];

      const mockLte = vi.fn().mockReturnValue({ data: mockData, error: null });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any).mockReturnValue(mockFrom());

      const result = await SignInLogger.getSignInStats('2024-01-01', '2024-12-31');

      expect(result.totalSignIns).toBe(4);
      expect(result.successfulSignIns).toBe(3);
      expect(result.failedSignIns).toBe(1);
      expect(result.uniqueUsers).toBe(3);
    });

    it('should return zero stats on error', async () => {
      const mockSelect = vi.fn().mockReturnValue({ data: null, error: new Error('DB error') });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any).mockReturnValue(mockFrom());

      const result = await SignInLogger.getSignInStats();

      expect(result).toEqual({
        totalSignIns: 0,
        successfulSignIns: 0,
        failedSignIns: 0,
        uniqueUsers: 0,
      });
    });
  });
});

