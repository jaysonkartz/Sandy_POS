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
        console.error("Error logging sign-in:", error);
      }
    },
    []
  );

  const logSignInSuccess = useCallback(
    async (userId: string, email: string, sessionId?: string) => {
      try {
        console.log("Logging successful sign-in for:", { userId, email });
        await logSignIn({
          userId,
          email,
          success: true,
          sessionId,
        });
        console.log("Successfully logged sign-in");
      } catch (error) {
        // Log but don't throw - we don't want logging failures to break the login flow
        console.error("Error in logSignInSuccess:", error);
      }
    },
    [logSignIn]
  );

  const logSignInFailure = useCallback(
    async (userId: string, email: string, failureReason: string) => {
      try {
        await logSignIn({
          userId: userId || "anonymous",
          email,
          success: false,
          failureReason,
        });
      } catch (error) {
        // Silently handle logging errors to not disrupt the login flow
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
