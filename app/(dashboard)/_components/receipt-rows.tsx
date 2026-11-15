import Link from "next/link";
import dayjs from "dayjs";
import { ChevronRight } from "lucide-react";
import { todayInLagos } from "@/lib/dates";
import { formatNairaShort } from "../receipts/_receipt/totals";
import type { ReceiptRow } from "../receipts/queries";

/** Small text status — quiet when paid, gold when money is owed. */
export function StatusBadge({ balance }: { balance: number }) {
  return balance > 0 ? (
    <span className="text-xs font-medium text-gold tabular-nums whitespace-nowrap">
      Owes {formatNairaShort(balance)}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-win whitespace-nowrap">
      <span className="size-1.5 rounded-full bg-win" aria-hidden /> Paid
    </span>
  );
}

function dayLabel(iso: string, today: string) {
  const d = dayjs(iso);
  const diff = dayjs(today).diff(d, "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7 && diff > 1) return d.format("dddd");
  return d.format(d.year() === dayjs(today).year() ? "ddd, D MMM" : "D MMM YYYY");
}

function Row({ r, title, subtitle }: { r: ReceiptRow; title: string; subtitle: string }) {
  return (
    <li>
      <Link
        href={`/receipts/${r.id}`}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted/70"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-semibold tabular-nums">{formatNairaShort(r.total)}</span>
          <StatusBadge balance={r.balance} />
        </div>
        <ChevronRight className="-mr-1 size-4 shrink-0 text-muted-foreground/60" />
      </Link>
    </li>
  );
}

const LIST = "relative divide-y divide-border overflow-hidden rounded-lg border border-border bg-card";

/**
 * Receipts as tappable rows. `grouped` puts them under day headings
 * (Today, Yesterday, …) — the list is already sorted newest first.
 */
export function ReceiptRows({
  rows,
  empty = "No receipts yet.",
  showCustomer = true,
  grouped = false,
}: {
  rows: ReceiptRow[];
  empty?: React.ReactNode;
  showCustomer?: boolean;
  grouped?: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  const today = todayInLagos();
  const title = (r: ReceiptRow) => (showCustomer ? r.customerName : r.number);

  if (!grouped) {
    return (
      <ul className={LIST}>
        {rows.map((r) => (
          <Row
            key={r.id}
            r={r}
            title={title(r)}
            subtitle={`${showCustomer ? r.number + " · " : ""}${dayLabel(r.date, today)}`}
          />
        ))}
      </ul>
    );
  }

  const groups: { date: string; rows: ReceiptRow[] }[] = [];
  for (const r of rows) {
    const last = groups.at(-1);
    if (last?.date === r.date) last.rows.push(r);
    else groups.push({ date: r.date, rows: [r] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const sum = g.rows.reduce((s, r) => s + r.total, 0);
        return (
          <section key={g.date} className="space-y-2">
            <h3 className="flex items-baseline justify-between px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>{dayLabel(g.date, today)}</span>
              <span className="font-medium normal-case tracking-normal tabular-nums">
                {formatNairaShort(sum)}
              </span>
            </h3>
            <ul className={LIST}>
              {g.rows.map((r) => (
                <Row
                  key={r.id}
                  r={r}
                  title={title(r)}
                  subtitle={showCustomer ? r.number : dayjs(r.date).format("D MMM YYYY")}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
