"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { signInPayload, type SignInPayload } from "./types";

export async function SignIn(payload: SignInPayload) {
  const parsed = signInPayload.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: "Enter your email and password." };
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  // Same message either way — don't reveal which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, message: "Wrong email or password." };
  }
  await createSession(user.id);
  return { success: true, message: `Welcome back, ${user.name}.` };
}
