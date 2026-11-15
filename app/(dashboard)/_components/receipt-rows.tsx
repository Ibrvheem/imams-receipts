import Link from "next/link";
import dayjs from "dayjs";
import { ChevronRight } from "lucide-react";
import { CornerAccents } from "@/components/ui/corner-accents";
import { formatNaira } from "../receipts/_receipt/totals";
import type { ReceiptRow } from "../receipts/queries";

export function StatusBadge({ balance }: { balance: number }) {
  return balance > 0 ? (
    <span className="border border-gold/20 bg-gold/10 px-2 py-0.5 text-xs text-gold tabular-nums whitespace-nowrap">
      Owes {formatNaira(balance)}
    </span>
  ) : (
    <span className="border border-win/20 bg-win/10 px-2 py-0.5 text-xs text-win whitespace-nowrap">
      Paid
    </span>
  );
}

/** Receipts as tappable rows — one layout that works from phone to desktop. */
export function ReceiptRows({
  rows,
  empty = "No receipts yet.",
  showCustomer = true,
}: {
  rows: ReceiptRow[];
  empty?: React.ReactNode;
  showCustomer?: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="relative border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <ul className="relative divide-y divide-border border border-border bg-card">
      <CornerAccents />
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            href={`/receipts/${r.id}`}
            className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {showCustomer ? r.customerName : r.number}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {showCustomer && `${r.number} · `}
                {dayjs(r.date).format("D MMM YYYY")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-semibold tabular-nums">{formatNaira(r.total)}</span>
              <StatusBadge balance={r.balance} />
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
