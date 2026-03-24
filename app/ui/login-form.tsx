"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSignInLogging } from "@/app/hooks/useSignInLogging";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { logSignInSuccess, logSignInFailure } = useSignInLogging();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logSignInFailure("", email, error.message);
        setError(error.message);
        return;
      }

      if (data?.user) {
        await logSignInSuccess(data.user.id, data.user.email || email, data.session?.access_token);

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className="mb-3 text-2xl">Please log in to continue.</h1>
        <div className="w-full">
          <div>
            <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <input
                required
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                name="email"
                placeholder="Enter your email address"
                type="email"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                required
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 pr-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                minLength={6}
                name="password"
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
        <div className="text-right mt-2">
          <button
            className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
            type="button"
            onClick={() => router.push("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>
        <button
          className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </div>
    </form>
  );
}
