"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { USER_ROLES } from "@/app/constants/app-constants";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    phone: "",
    customer_code: "",
    whatsapp_notifications: true, // Default to opt-in
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string): { strength: "weak" | "medium" | "strong"; score: number; feedback: string } => {
    if (!password) {
      return { strength: "weak", score: 0, feedback: "" };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length checks
    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");
    
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("lowercase letter");
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("uppercase letter");
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("number");
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("special character");

    let strength: "weak" | "medium" | "strong";
    if (score <= 2) {
      strength = "weak";
    } else if (score <= 4) {
      strength = "medium";
    } else {
      strength = "strong";
    }

    return { strength, score, feedback: feedback.length > 0 ? `Add: ${feedback.slice(0, 2).join(", ")}` : "" };
  };

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check if customer already exists
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      // If there's an error and it's not a "no rows" error, throw it
      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
        throw customerCheckError;
      }

      if (existingCustomer) {
        throw new Error("An account with this email already exists");
      }

      // 2. Sign up the user in auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        // Handle specific Supabase auth errors
        if (signUpError.message.includes("already registered")) {
          throw new Error("An account with this email already exists");
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // 3. Create user record in users table
      const userData = {
        id: authData.user.id,
        email: formData.email,
        role: USER_ROLES.USER,
        created_at: new Date().toISOString(),
      };

      const { error: userError } = await supabase.from("users").insert([userData]);

      if (userError) throw userError;

      // 4. Create customer record
      const customerData = {
        name: formData.name,
        email: formData.email,
        user_id: authData.user.id,
        status: true,
        created_at: new Date().toISOString(),
        address: formData.address,
        phone: formData.phone,
        customer_code: formData.customer_code || null,
        whatsapp_notifications: formData.whatsapp_notifications,
      };

      const { error: customerError } = await supabase.from("customers").insert([customerData]);

      if (customerError) throw customerError;

      // Success handling
      alert("Account created successfully! Please check your email to verify your account.");
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Back Button */}
        <button
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => router.push("/")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8">Register Account</h1>

          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="customer_code">
                Customer Code (Optional)
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="customer_code"
                placeholder="Enter customer code"
                type="text"
                value={formData.customer_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_code: e.target.value }))}
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
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="password"
                placeholder="Enter your password (minimum 8 characters)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
              {formData.password && (
                <div className="mt-2">
                  {/* Strength Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === "weak"
                          ? "bg-red-500"
                          : passwordStrength.strength === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                      }}
                    />
                  </div>
                  {/* Strength Text */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.strength === "weak"
                          ? "text-red-600"
                          : passwordStrength.strength === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      Password Strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  {/* Feedback */}
                  {passwordStrength.feedback && (
                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsapp_notifications"
                checked={formData.whatsapp_notifications}
                onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_notifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="whatsapp_notifications" className="ml-2 block text-sm text-gray-700">
                I want to receive WhatsApp notifications about my orders and updates
              </label>
            </div>

            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Processing..." : "Sign Up"}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => router.push("/login")}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
