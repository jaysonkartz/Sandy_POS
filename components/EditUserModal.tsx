"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { USER_ROLES } from "@/app/constants/app-constants";

interface User {
  id: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [role, setRole] = useState<string>(user?.role || USER_ROLES.CUSTOMER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Update role when user changes
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate role value
      if (![USER_ROLES.ADMIN, USER_ROLES.CUSTOMER].includes(role)) {
        throw new Error("Invalid role value");
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ role: role.toUpperCase() })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      setSuccess(true);
      // Wait a moment to show success message, then refresh and close
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Error updating user");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit User Role</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              type="email"
              value={user.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value={USER_ROLES.CUSTOMER}>Customer</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a role: Customer or Admin
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              User role updated successfully!
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
