// Fast, optimistic gate: no session cookie → sign-in. The real check (is the
// session valid?) happens in lib/dal.ts on every page and Server Action.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session";

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
  if (isPublic || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const signIn = new URL("/sign-in", request.url);
  if (pathname !== "/") signIn.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next internals and files with an extension (fonts, icons).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
