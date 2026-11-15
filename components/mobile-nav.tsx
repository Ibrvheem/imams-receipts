"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, ReceiptText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/receipts/new", label: "New", icon: Plus, primary: true },
  { href: "/customers", label: "Customers", icon: Users },
] as const;

/** Form pages have their own bottom save bar, so the tabs step aside. */
export const isFormPage = (path: string) =>
  path === "/receipts/new" || path.endsWith("/edit");

function isActive(path: string, href: string) {
  if (href === "/receipts/new") return path === href;
  if (href === "/receipts") return path.startsWith("/receipts") && path !== "/receipts/new";
  return path === href || path.startsWith(href + "/");
}

/** Phone tab bar. Rendered at the end of the page so its spacer reserves room. */
export function MobileNav() {
  const path = usePathname();
  if (isFormPage(path)) return null;

  return (
    <>
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {TABS.map(({ href, label, icon: Icon, ...tab }) => {
            const active = isActive(path, href);
            const primary = "primary" in tab;
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
                  {primary ? (
                    <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground shadow-[0_6px_20px_oklch(0_0_0/0.45)] transition-transform active:scale-95">
                      <Icon className="size-5" strokeWidth={2.4} />
                    </span>
                  ) : (
                    <>
                      {/* Active marker along the top edge */}
                      <span
                        className={cn(
                          "absolute top-0 h-0.5 w-8 bg-primary transition-opacity duration-200",
                          active ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                      {label}
                    </>
                  )}
                  {primary && <span className="sr-only">New receipt</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
