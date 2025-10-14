"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useSignInLogging } from "@/app/hooks/useSignInLogging";

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function CustomerLoginModal({ isOpen, onClose, onLoginSuccess }: CustomerLoginModalProps) {
  const router = useRouter();
  const { logSignInSuccess, logSignInFailure } = useSignInLogging();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER",
    address: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // Log failed sign-in attempt
        await logSignInFailure("", formData.email, signInError.message);
        throw signInError;
      }

      if (data?.user) {
        // Log successful sign-in
        await logSignInSuccess(
          data.user.id, 
          data.user.email || formData.email,
          data.session?.access_token
        );

        // Notify parent component of successful login
        onLoginSuccess?.();
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. First check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select()
        .eq("email", formData.email)
        .single();

      if (existingUser) {
        throw new Error("User already exists");
      }

      // 2. Sign up the user in auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      // 3. Create customer record
      const customerData = {
        name: formData.name,
        email: formData.email,
        user_id: authData.user!.id,
        status: true,
        created_at: new Date().toISOString(),
        address: formData.address,
        phone: formData.phone,
      };

      const { error: customerError } = await supabase.from("customers").insert([customerData]);

      if (customerError) throw customerError;

      // Success handling here
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isRegistering ? "Register Account" : "Customer Login"}
          </h1>

          <form className="space-y-6" onSubmit={isRegistering ? handleSignUp : handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}

            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="name"
                    placeholder="Enter your full name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="phone"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="address">
                    Address
                  </label>
                  <textarea
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="address"
                    placeholder="Enter your address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="email"
                placeholder="Enter your email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="password"
                placeholder="Enter your password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? "Already have an account? Sign in" : "New customer? Register here"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
