// Fast, optimistic gate: no session cookie → sign-in. The real check (is the
// session valid?) happens in lib/dal.ts on every page and Server Action.
// Also keeps the session cookie fresh while she uses the app.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-config";

const publicRoutes = [
  "/sign-in",
  "/terms-of-service",
  "/privacy-policy",
  "/cookie-policy",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    // Re-issue the cookie on every page visit so the browser keeps it for
    // another 30 days (the server-side expiry slides in lib/dal.ts).
    const response = NextResponse.next();
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  }
  if (isPublic) return NextResponse.next();
  const signIn = new URL("/sign-in", request.url);
  if (pathname !== "/") signIn.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next internals and files with an extension (fonts, icons).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
