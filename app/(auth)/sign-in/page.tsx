import { SignInForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { VisualPanel } from "../_components/visual-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in (valid session) → straight to the app.
  if (await getCurrentUser()) redirect("/home");
  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-svh grid md:grid-cols-[1.05fr_0.95fr] bg-background overflow-hidden">
      <VisualPanel />

      {/* Form panel */}
      <div
        className="relative flex items-center justify-center md:border-l-2 md:border-border"
        style={{ background: "var(--bg-deep)" }}
      >
        {/* Blueprint grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <SignInForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
