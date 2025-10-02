import { useCallback } from 'react';
import { SignInLogger, SignInData } from '@/app/lib/signin-logger';

export interface UseSignInLoggingReturn {
  logSignIn: (data: Omit<SignInData, 'userId' | 'email'> & { userId: string; email: string }) => Promise<void>;
  logSignInSuccess: (userId: string, email: string, sessionId?: string) => Promise<void>;
  logSignInFailure: (userId: string, email: string, failureReason: string) => Promise<void>;
  getUserSignInHistory: (userId: string, limit?: number) => Promise<any[]>;
}

export const useSignInLogging = (): UseSignInLoggingReturn => {
  const logSignIn = useCallback(async (data: Omit<SignInData, 'userId' | 'email'> & { userId: string; email: string }) => {
    try {
      // Get client-side information
      const userAgent = navigator.userAgent;
      const deviceInfo = SignInLogger.getDeviceInfo(userAgent);
      
      // Note: IP address cannot be reliably obtained client-side
      // For production, consider using a service like ipify.org or similar
      const signInData: SignInData = {
        ...data,
        userAgent,
        deviceInfo,
      };

      await SignInLogger.logSignIn(signInData);
    } catch (error) {
      console.error('Error logging sign-in:', error);
    }
  }, []);

  const logSignInSuccess = useCallback(async (userId: string, email: string, sessionId?: string) => {
    await logSignIn({
      userId,
      email,
      success: true,
      sessionId,
    });
  }, [logSignIn]);

  const logSignInFailure = useCallback(async (userId: string, email: string, failureReason: string) => {
    await logSignIn({
      userId,
      email,
      success: false,
      failureReason,
    });
  }, [logSignIn]);

  const getUserSignInHistory = useCallback(async (userId: string, limit: number = 10) => {
    return await SignInLogger.getUserSignInHistory(userId, limit);
  }, []);

  return {
    logSignIn,
    logSignInSuccess,
    logSignInFailure,
    getUserSignInHistory,
  };
};
