// Data access layer: the real auth check. Every page and Server Action that
// touches data calls requireUser(); proxy.ts only does a fast cookie check.
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, extendSession, hashToken } from "@/lib/session";

export type CurrentUser = { id: string; email: string; name: string };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  // Using the app keeps her signed in (sliding expiry).
  await extendSession(session.id, session.expiresAt);
  return session.user;
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
});
