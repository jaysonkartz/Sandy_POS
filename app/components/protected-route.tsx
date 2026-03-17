"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { USER_ROLES } from "@/app/constants/app-constants";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRoleLoading, setIsRoleLoading] = useState(requireAdmin);
  const [isAuthorized, setIsAuthorized] = useState(!requireAdmin);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      if (loading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      if (!requireAdmin) {
        if (isMounted) {
          setIsAuthorized(true);
          setIsRoleLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsRoleLoading(true);
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = !error && userData?.role === USER_ROLES.ADMIN;

      if (!isMounted) return;

      if (!isAdmin) {
        setIsAuthorized(false);
        router.replace("/unauthorized");
        setIsRoleLoading(false);
        return;
      }

      setIsAuthorized(true);
      setIsRoleLoading(false);
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [user, loading, requireAdmin, router]);

  if (loading || isRoleLoading) {
    return <div>Loading...</div>;
  }

  return user && isAuthorized ? <>{children}</> : null;
}
