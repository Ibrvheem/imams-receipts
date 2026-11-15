import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MS, sessionCookieOptions } from "@/lib/session-config";

export { SESSION_COOKIE };

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Starts a session and sets the cookie. Server Actions only. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_MS) },
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

/**
 * Pushes a session's expiry forward while she's using the app. Writes at most
 * about once a day per session (only when more than a day has been used up).
 */
export async function extendSession(sessionId: string, expiresAt: Date) {
  const remaining = expiresAt.getTime() - Date.now();
  if (remaining > SESSION_MS - 86_400_000) return;
  await prisma.session
    .update({ where: { id: sessionId }, data: { expiresAt: new Date(Date.now() + SESSION_MS) } })
    .catch(() => {
      // Not fatal: she stays signed in until the current expiry either way.
    });
}

/** Ends the current session. Server Actions only. */
export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}
