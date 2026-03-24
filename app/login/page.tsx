"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { motion } from "framer-motion";
import { useSignInLogging } from "@/app/hooks/useSignInLogging";
import { X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { logSignInSuccess, logSignInFailure } = useSignInLogging();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        await logSignInFailure("", email.trim(), error.message);
        throw error;
      }

      if (data.session && data.user) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("status")
          .eq("user_id", data.user.id)
          .single();

        if (customerError || !customerData) {
          await supabase.auth.signOut();
          setError("Customer account not found. Please contact support.");
          return;
        }

        if (!customerData.status) {
          router.push("/pending-approval");
          return;
        }

        await logSignInSuccess(
          data.user.id,
          data.user.email || email.trim(),
          data.session.access_token
        );

        const intendedCategory = localStorage.getItem("intendedCategory");
        if (intendedCategory) {
          localStorage.removeItem("intendedCategory");
          router.push(`/products/${intendedCategory}`);
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4 py-10"
      initial={{ opacity: 0 }}
      role="dialog"
      transition={{ duration: 0.18 }}
      onClick={() => router.back()}
    >
      
      <motion.div
        animate={{ y: 0, scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100"
        initial={{ y: 12, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500">Please sign in to continue</p>
          </div>

          <button
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100"
            type="button"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        
        <div className="px-5 py-5">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="sr-only" htmlFor="email-address">
                Email address
              </label>
              <input
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="email-address"
                name="email"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="password"
                name="password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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

            <div className="text-right">
              <button
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                type="button"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <button
              className="font-medium text-blue-600 hover:text-blue-500"
              onClick={() => router.push("/signup")}
            >
              Sign up here
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
