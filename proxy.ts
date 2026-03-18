import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/app/utils/supabase/middleware";

const ADMIN_PREFIXES = ["/dashboard", "/management", "/admin", "/pricing-management"];

const AUTH_EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/unauthorized",
  "/403",
  "/api",
  "/_next",
  "/favicon.ico",
];

const isExcludedPath = (pathname: string): boolean => {
  return AUTH_EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const isAdminPath = (pathname: string): boolean => {
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const copyCookies = (from: NextResponse, to: NextResponse): NextResponse => {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const { response, user, supabase } = await updateSession(request);

  if (isExcludedPath(pathname)) {
    return response;
  }

  if (!isAdminPath(pathname)) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  const { data: userRecord, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || userRecord?.role !== "ADMIN") {
    return copyCookies(response, NextResponse.redirect(new URL("/unauthorized", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
