import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/app/utils/supabase/middleware";
import { isAdminRoutePath, isProxyAuthExcludedPath } from "@/app/lib/admin-route-prefixes";

const copyCookies = (from: NextResponse, to: NextResponse): NextResponse => {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const { response, user, supabase } = await updateSession(request);

  if (isProxyAuthExcludedPath(pathname)) {
    return response;
  }

  if (!isAdminRoutePath(pathname)) {
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
