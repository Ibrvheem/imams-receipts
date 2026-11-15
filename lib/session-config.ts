// Shared by lib/session.ts (server) and proxy.ts. No server-only imports here.

export const SESSION_COOKIE = "session";

/**
 * Sliding sessions: she stays signed in as long as she opens the app at least
 * once every SESSION_DAYS. Every visit pushes the expiry forward again.
 */
export const SESSION_DAYS = 30;
export const SESSION_MS = SESSION_DAYS * 86_400_000;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86_400, // seconds
};
