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
  { label: "Paid", value: "paid" },
  { label: "Owing", value: "owing" },
] as const;

const RANGES = [
  { label: "Any time", value: null },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
] as const;

function Chips<T extends string | null>({
  options,
  active,
  onPick,
  label,
}: {
  options: readonly { label: string; value: T }[];
  active: string | null;
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5 overflow-x-auto">
      {options.map((o) => {
        const selected = (o.value ?? null) === active;
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onPick(o.value)}
            className={cn(
              "min-h-10 shrink-0 border px-3 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReceiptFilters() {
  const { params, set } = useUrlParams();
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
      <Chips
        label="Payment status"
        options={STATUS}
        active={params.get("status")}
        onPick={(v) => set({ status: v })}
      />
      <Chips
        label="Date range"
        options={RANGES}
        active={params.get("range")}
        onPick={(v) => set({ range: v })}
      />
    </div>
  );
}
