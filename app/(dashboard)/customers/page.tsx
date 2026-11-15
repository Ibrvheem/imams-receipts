import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listCustomers } from "./queries";
import { formatNairaShort } from "../receipts/_receipt/totals";

import { Pager } from "../_components/pager";
import { SearchBox } from "../_components/list-filters";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const result = await listCustomers({ q: sp.q, page: Number(sp.page) || 1 });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Saved automatically from your receipts.
        </p>
      </header>

      <SearchBox placeholder="Search name or phone" />

      {result.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          {sp.q ? "No customers match that search." : "No customers yet. They're added when you save a receipt."}
        </div>
      ) : (
        <ul className="relative divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {result.rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted/70"
              >
                <span
                  aria-hidden
                  className={`flex size-10 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                    c.owing > 0 ? "border-gold/30 bg-gold/10 text-gold" : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {[c.phone, `${c.receipts} receipt${c.receipts === 1 ? "" : "s"}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-semibold tabular-nums">{formatNairaShort(c.spent)}</span>
                  {c.owing > 0 && (
                    <span className="text-xs text-gold tabular-nums">Owes {formatNairaShort(c.owing)}</span>
                  )}
                </div>
                <ChevronRight className="-mr-1 size-4 shrink-0 text-muted-foreground/60" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pager page={result.page} pages={result.pages} params={{ q: sp.q }} />
    </div>
  );
}
