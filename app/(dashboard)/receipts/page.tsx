import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOfMonth, startOfWeek, todayInLagos } from "@/lib/dates";
import { listReceipts } from "./queries";
import { formatNaira } from "./_receipt/totals";
import { ReceiptRows } from "../_components/receipt-rows";
import { Pager } from "../_components/pager";
import { ReceiptFilters, SearchBox } from "../_components/list-filters";

type Search = { q?: string; status?: string; range?: string; page?: string };

function rangeToDates(range?: string) {
  const today = todayInLagos();
  if (range === "today") return { from: today, to: today };
  if (range === "week") return { from: startOfWeek(today), to: today };
  if (range === "month") return { from: startOfMonth(today), to: today };
  return {};
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const status = sp.status === "paid" || sp.status === "owing" ? sp.status : undefined;
  const result = await listReceipts({
    q: sp.q,
    status,
    ...rangeToDates(sp.range),
    page: Number(sp.page) || 1,
  });
  const filtered = !!(sp.q || status || sp.range);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Receipts</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {result.total} {result.total === 1 ? "receipt" : "receipts"} ·{" "}
            {formatNaira(result.sumTotal)}
            {result.sumBalance > 0 && (
              <span className="text-gold"> · {formatNaira(result.sumBalance)} owed</span>
            )}
          </p>
        </div>
        <Button asChild className="cta-btn h-11">
          <Link href="/receipts/new">
            <Plus /> New
          </Link>
        </Button>
      </header>

      <div className="space-y-3">
        <SearchBox placeholder="Search name, phone or receipt no." />
        <ReceiptFilters />
      </div>

      <ReceiptRows
        rows={result.rows}
        empty={
          filtered ? (
            "No receipts match these filters."
          ) : (
            <>
              No receipts yet.{" "}
              <Link href="/receipts/new" className="text-primary underline-offset-4 hover:underline">
                Create the first one
              </Link>
            </>
          )
        }
      />

      <Pager
        page={result.page}
        pages={result.pages}
        params={{ q: sp.q, status, range: sp.range }}
      />
    </div>
  );
}
