import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "session";
const MAX_AGE_DAYS = 30;

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Starts a session and sets the cookie. Server Actions only. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 86_400_000);
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
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
