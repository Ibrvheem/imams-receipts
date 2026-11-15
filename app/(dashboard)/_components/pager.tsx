import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Prev / next links that keep the current search and filters. */
export function Pager({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `?${s}` : "?";
  };
  const link = (p: number, disabled: boolean, children: React.ReactNode, label: string) =>
    disabled ? (
      <span aria-disabled className={cn(BTN, "pointer-events-none opacity-40")}>
        {children}
      </span>
    ) : (
      <Link href={href(p)} aria-label={label} className={BTN}>
        {children}
      </Link>
    );
  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pages">
      {link(page - 1, page <= 1, <><ChevronLeft className="size-4" /> Prev</>, "Previous page")}
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {page} of {pages}
      </span>
      {link(page + 1, page >= pages, <>Next <ChevronRight className="size-4" /></>, "Next page")}
    </nav>
  );
}

const BTN =
  "inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-3 text-sm transition-colors hover:bg-muted";
