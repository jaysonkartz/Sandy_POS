"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = async () => {
    setMessage(null);
    setChecking(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      setEmail(user?.email ?? null);

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: customer } = await supabase
        .from("customers")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customer?.status) {
        router.replace("/");
        return;
      }

      setMessage("Still pending approval. Please check again later.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-white border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Account pending approval</h1>
        <p className="mt-2 text-gray-600">
          Your account{email ? ` (${email})` : ""} has been created, but it needs admin approval
          before you can access the system.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            disabled={checking}
            type="button"
            onClick={refreshStatus}
          >
            {checking ? "Checking..." : "Check approval status"}
          </button>

          <button
            className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 font-medium hover:bg-gray-200"
            type="button"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}

        <p className="mt-6 text-sm text-gray-500">
          If you think this is a mistake, please contact the admin.
        </p>
      </div>
    </div>
  );
}
