// Creates the owner account, or resets its password if the email exists.
//   pnpm owner <email> "<name>"      (prompts for the password)
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/password";

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: pnpm owner <email> "<name>"');
    process.exit(1);
  }
  const password =
    process.env.OWNER_PASSWORD ??
    (await createInterface({
      input: process.stdin,
      output: process.stdout,
    }).question("Password (min 8 chars): "));
  if (password.length < 8) throw new Error("Password must be 8+ characters.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name: name || "Owner", passwordHash },
    update: { passwordHash, ...(name ? { name } : {}) },
  });
  // A password change signs out every device.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log(`Owner ready: ${user.email}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
