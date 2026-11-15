"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, ReceiptText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Places only — the main action (New receipt) gets its own floating button.
const TABS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/customers", label: "Customers", icon: Users },
] as const;

/** Form pages have their own bottom save bar, so the tabs step aside. */
export const isFormPage = (path: string) =>
  path === "/receipts/new" || path.endsWith("/edit");

const isActive = (path: string, href: string) =>
  path === href || path.startsWith(href + "/");

/** Phone tab bar + New receipt button. The spacer reserves room at the page end. */
export function MobileNav() {
  const path = usePathname();
  if (isFormPage(path)) return null;

  return (
    <>
      <div aria-hidden className="h-[calc(5.5rem+env(safe-area-inset-bottom))] md:hidden" />

      <Link
        href="/receipts/new"
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex h-12 items-center gap-2 rounded-full bg-primary pr-5 pl-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_oklch(0_0_0/0.45),0_2px_6px_oklch(0_0_0/0.3)] transition-transform duration-150 ease-out active:scale-95 md:hidden"
      >
        <Plus className="size-5" strokeWidth={2.4} /> New receipt
      </Link>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {/* Active marker along the top edge */}
                  <span
                    className={cn(
                      "absolute top-0 h-0.5 w-10 rounded-full bg-primary transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
