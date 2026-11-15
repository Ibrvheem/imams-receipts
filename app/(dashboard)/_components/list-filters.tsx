"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Writes filters to the URL so results are linkable and survive refresh. */
function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // new filters → back to page 1
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, set, pending };
}

export function SearchBox({ placeholder }: { placeholder: string }) {
  const { params, set, pending } = useUrlParams();
  const current = params.get("q") ?? "";
  const [value, setValue] = useState(current);

  // Debounce typing into the URL.
  useEffect(() => {
    if (value.trim() === current) return;
    const t = setTimeout(() => set({ q: value.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11"
        // Inline: a global rule sets input padding, beating utility classes.
        style={{ paddingLeft: 36, paddingRight: 40 }}
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : value ? (
          <button type="button" aria-label="Clear search" onClick={() => setValue("")}>
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

const STATUS = [
  { label: "All", value: null },
  { label: "Owing", value: "owing" },
  { label: "Paid", value: "paid" },
] as const;

const RANGES = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
] as const;

const CHIP =
  "min-h-10 shrink-0 border px-3.5 text-sm whitespace-nowrap transition-colors";
const chipState = (on: boolean) =>
  on
    ? "border-primary bg-primary text-primary-foreground"
    : "border-border text-muted-foreground hover:text-foreground active:bg-muted";

/**
 * Status and date filters in one row that scrolls sideways on phones.
 * Tapping the active date chip again clears it.
 */
export function ReceiptFilters() {
  const { params, set } = useUrlParams();
  const status = params.get("status");
  const range = params.get("range");
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <div className="flex w-max items-center gap-1.5">
        <div role="radiogroup" aria-label="Payment status" className="flex gap-1.5">
          {STATUS.map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={(o.value ?? null) === status}
              onClick={() => set({ status: o.value })}
              className={cn(CHIP, chipState((o.value ?? null) === status))}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span aria-hidden className="mx-1.5 h-6 w-px shrink-0 bg-border" />
        <div role="group" aria-label="Date range" className="flex gap-1.5">
          {RANGES.map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={range === o.value}
              onClick={() => set({ range: range === o.value ? null : o.value })}
              className={cn(CHIP, chipState(range === o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
