"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

const ALLOWLIST = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/unauthorized",
  "/403",
]);

const ADMIN_PREFIXES = ["/management"];

export default function ApprovalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);
  const inFlight = useRef(false);

  useEffect(() => {
    const isAllowlisted = (path: string) => {
      if (ALLOWLIST.has(path)) return true;
      return false;
    };

    const isAdminArea = (path: string) => ADMIN_PREFIXES.some((p) => path.startsWith(p));

    const checkApproval = async () => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        if (isAllowlisted(pathname) || isAdminArea(pathname)) {
          setIsChecking(false);
          return;
        }

        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes.user;

        if (!user) {
          setIsChecking(false);
          return;
        }

        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

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
      checkApproval();
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return <>{isChecking ? children : children}</>;
}
