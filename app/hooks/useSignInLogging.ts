import { useCallback } from "react";
import { SignInLogger, SignInData } from "@/app/lib/signin-logger";

export interface UseSignInLoggingReturn {
  logSignIn: (
    data: Omit<SignInData, "userId" | "email"> & { userId: string; email: string }
  ) => Promise<void>;
  logSignInSuccess: (userId: string, email: string, sessionId?: string) => Promise<void>;
  logSignInFailure: (userId: string, email: string, failureReason: string) => Promise<void>;
  getUserSignInHistory: (userId: string, limit?: number) => Promise<any[]>;
}

export const useSignInLogging = (): UseSignInLoggingReturn => {
  const logSignIn = useCallback(
    async (data: Omit<SignInData, "userId" | "email"> & { userId: string; email: string }) => {
      try {
        const userAgent = navigator.userAgent;
        const deviceInfo = SignInLogger.getDeviceInfo(userAgent);

        const signInData: SignInData = {
          ...data,
          userAgent,
          deviceInfo,
        };

        await SignInLogger.logSignIn(signInData);
      } catch (error) {
        console.error("Error logging sign-in:", error);
      }
    },
    []
  );

  const logSignInSuccess = useCallback(
    async (userId: string, email: string, sessionId?: string) => {
      try {
        console.warn("Logging successful sign-in for:", { userId, email });
        await logSignIn({
          userId,
          email,
          success: true,
          sessionId,
        });
        console.warn("Successfully logged sign-in");
      } catch (error) {
        console.error("Error in logSignInSuccess:", error);
      }
    },
    [logSignIn]
  );

  const logSignInFailure = useCallback(
    async (userId: string, email: string, failureReason: string) => {
      try {
        if (!userId) {
          return;
        }
        await logSignIn({
          userId,
          email,
          success: false,
          failureReason,
        });
      } catch (error) {
        console.warn("Failed to log sign-in failure:", error);
      }
    },
    [logSignIn]
  );

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
