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

  // Prevent background scroll if this is rendered as an overlay/modal
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      // Fullscreen overlay so it never "mixes" with the page behind
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4 py-10"
      onClick={() => router.back()}
      aria-modal="true"
      role="dialog"
    >
      {/* Card */}
      <motion.div
        initial={{ y: 12, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500">Please sign in to continue</p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="sr-only" htmlFor="email-address">
                Email address
              </label>
              <input
                required
                id="email-address"
                name="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                required
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </button>

              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => router.push("/")}
              >
                Back to Home
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
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