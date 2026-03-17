"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

// Pages that pending users are allowed to access.
const ALLOWLIST = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/unauthorized",
  "/403",
]);

// Routes that should never be blocked by approval gating.
const ADMIN_PREFIXES = ["/management"];

export default function ApprovalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);
  const inFlight = useRef(false);

  useEffect(() => {
    const isAllowlisted = (path: string) => {
      if (ALLOWLIST.has(path)) return true;
      // Allow all nested routes under allowlisted base paths (if any later)
      return false;
    };

    const isAdminArea = (path: string) => ADMIN_PREFIXES.some((p) => path.startsWith(p));

    const checkApproval = async () => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        // If current page is allowlisted or admin area, don't block.
        if (isAllowlisted(pathname) || isAdminArea(pathname)) {
          setIsChecking(false);
          return;
        }

        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes.user;

        // Not logged in → no approval gating (public browsing allowed)
        if (!user) {
          setIsChecking(false);
          return;
        }

        // Check if this user is a customer and whether they are approved.
        // This project already uses customers.status as the approval flag.
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        // If there is no customer record, don't block here (admins may not have a customer row).
        if (customerError || !customer) {
          setIsChecking(false);
          return;
        }

        if (customer.status === false) {
          router.replace("/pending-approval");
          return;
        }

        setIsChecking(false);
      } finally {
        inFlight.current = false;
      }
    };

    checkApproval();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Re-check approval whenever auth state changes
      checkApproval();
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // While checking, render children to avoid a blank screen.
  // The router.replace will take over quickly if needed.
  return <>{isChecking ? children : children}</>;
}
