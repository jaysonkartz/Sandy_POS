"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // ✅ Prevent StrictMode double-run in dev
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const isAbortError = (err: any) =>
      err?.name === "AbortError" ||
      (typeof err?.message === "string" &&
        err.message.toLowerCase().includes("signal is aborted"));

    const getErrorParams = (url: URL) => {
      const hashParams = new URLSearchParams(
        url.hash.startsWith("#") ? url.hash.slice(1) : ""
      );

      return {
        error:
          url.searchParams.get("error") || hashParams.get("error") || null,
        error_description:
          url.searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          null,
        error_code:
          url.searchParams.get("error_code") || hashParams.get("error_code") || null,
        code: url.searchParams.get("code") || null,
        access_token: hashParams.get("access_token"),
        refresh_token: hashParams.get("refresh_token"),
      };
    };

    const checkSessionOnce = async () => {
      const url = new URL(window.location.href);
      const params = getErrorParams(url);

      // 0) if Supabase sent an auth error in URL
      if (params.error || params.error_description || params.error_code) {
        const message = decodeURIComponent(params.error_description || "")
          .replace(/\+/g, " ")
          .trim();

        setError(
          message ||
            "Invalid or expired reset link. Please request a new password reset."
        );
        return;
      }

      // 1) If we have ?code=... (PKCE) -> exchange it
      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;

        // data.session exists -> validated OK
        if (!data?.session) {
          setError("Unable to validate reset link. Please request a new password reset.");
        }
        return;
      }

      // 2) If we have #access_token=... -> set session
      if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;

        if (!data?.session) {
          setError("Unable to validate reset link. Please request a new password reset.");
        }

        // clean hash
        if (url.hash) {
          window.history.replaceState(
            null,
            "",
            `${url.origin}${url.pathname}${url.search}`
          );
        }
        return;
      }

      // 3) Otherwise just check if user already has a session
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data?.session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    };

    const run = async () => {
      try {
        setError(null);

        // try once
        await checkSessionOnce();
      } catch (err: any) {
        console.error("Reset link validation error:", err);

        // ✅ AbortError is usually transient (locks.ts)
        if (isAbortError(err)) {
          try {
            // quick retry once
            await checkSessionOnce();
          } catch (err2: any) {
            console.error("Reset link validation retry error:", err2);
            setError("Unable to validate reset link. Please request a new password reset.");
          }
        } else {
          const msg = (err?.message || "").toLowerCase();
          if (msg.includes("invalid_grant") || msg.includes("expired")) {
            setError("Invalid or expired reset link. Please request a new password reset.");
          } else {
            setError("An error occurred while validating the reset link.");
          }
        }
      } finally {
        setIsValidating(false);
      }
    };

    run();
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      console.error("Reset password error:", err);

      const isAbort =
        err?.name === "AbortError" ||
        (typeof err?.message === "string" &&
          err.message.toLowerCase().includes("signal is aborted"));

      setError(
        isAbort
          ? "Network was interrupted. Please try again."
          : err instanceof Error
          ? err.message
          : "An error occurred while resetting your password"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full space-y-8">
        <motion.div animate={{ y: 0 }} initial={{ y: -20 }} transition={{ duration: 0.5 }}>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below
          </p>
        </motion.div>

        {isValidating ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            initial={{ opacity: 0, y: -10 }}
          >
            <p className="text-gray-600">Validating reset link...</p>
          </motion.div>
        ) : success ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
          >
            <p className="text-center">Password reset successfully! Redirecting to login...</p>
          </motion.div>
        ) : error && error.includes("Invalid or expired") ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
          >
            <p className="text-center mb-4">{error}</p>
            <div className="text-center">
              <Link className="text-blue-600 hover:text-blue-500 font-medium" href="/forgot-password">
                Request New Reset Link
              </Link>
            </div>
          </motion.div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <motion.input
                    required
                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out"
                    id="password"
                    minLength={8}
                    name="password"
                    placeholder="Enter new password (min 8 characters)"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    whileFocus={{ scale: 1.01 }}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <motion.input
                    required
                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out"
                    id="confirm-password"
                    minLength={8}
                    name="confirm-password"
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    whileFocus={{ scale: 1.01 }}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-all duration-200 ease-in-out"
              disabled={isLoading}
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </motion.button>
          </form>
        )}

        <motion.div
          animate={{ opacity: 1 }}
          className="text-center"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-gray-600">
            <Link
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              href="/login"
            >
              Back to Login
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
