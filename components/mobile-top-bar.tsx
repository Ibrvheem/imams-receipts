"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import ProfileMenu from "@/components/molecules/profile-menu";

/** Where "back" goes from each inner page. */
function backFor(path: string): { href: string; label: string } | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[0] === "receipts") {
    if (parts[1] === "new" || parts.length === 2) return { href: "/receipts", label: "Receipts" };
    return { href: `/receipts/${parts[1]}`, label: "Receipt" };
  }
  if (parts[0] === "customers") return { href: "/customers", label: "Customers" };
  return { href: `/${parts[0]}`, label: "Back" };
}

/** Phone header: back link on inner pages, the business name on tab pages. */
export function MobileTopBar({ name, email }: { name: string; email: string }) {
  const back = backFor(usePathname());
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-lg md:hidden">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex min-h-11 items-center gap-0.5 pr-3 text-sm text-muted-foreground active:text-foreground"
        >
          <ChevronLeft className="size-5" /> {back.label}
        </Link>
      ) : (
        <span className="truncate px-2 text-xs font-black uppercase tracking-[0.22em]">
          {BUSINESS.name}
        </span>
      )}
      <div className="pr-2">
        <ProfileMenu name={name} email={email} compact />
      </div>
    </header>
  );
}
