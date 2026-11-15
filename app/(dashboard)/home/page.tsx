import Link from "next/link";
import { ArrowRight, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaggerItem, StaggerReveal } from "@/components/motion/stagger-reveal";
import { requireUser } from "@/lib/dal";
import { getDashboard } from "../receipts/queries";
import { formatNairaShort } from "../receipts/_receipt/totals";
import { ReceiptRows } from "../_components/receipt-rows";
import { InstallHint } from "@/components/pwa";

const count = (n: number, word = "receipt") => `${n} ${word}${n === 1 ? "" : "s"}`;

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(new Date()),
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function SmallStat({ label, amount, sub, href }: { label: string; amount: number; sub: string; href: string }) {
  return (
    <Link
      href={href}
      className="relative flex h-full flex-col gap-0.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 active:bg-muted/60"
    >
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate text-lg font-semibold tabular-nums">{formatNairaShort(amount)}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </Link>
  );
}

export default async function HomePage() {
  const [user, d] = await Promise.all([requireUser(), getDashboard()]);
  const first = user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-7">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="truncate text-2xl font-semibold">{first}</h1>
        </div>
        <Button asChild className="cta-btn hidden h-11 md:inline-flex">
          <Link href="/receipts/new">
            <Plus /> New receipt
          </Link>
        </Button>
      </header>

      <InstallHint />

      <StaggerReveal className="grid grid-cols-2 gap-3">
        {/* Today — the number she checks most */}
        <StaggerItem className="col-span-2">
          <Link
            href="/receipts?range=today"
            className="relative flex items-end justify-between gap-4 rounded-lg border border-border bg-card p-5 inset-highlight transition-colors active:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sales today</p>
              <p className="truncate text-3xl font-semibold tabular-nums">{formatNairaShort(d.today.amount)}</p>
              <p className="text-sm text-muted-foreground">{count(d.today.count)}</p>
            </div>
            <ArrowRight className="mb-1 size-5 shrink-0 text-muted-foreground" />
          </Link>
        </StaggerItem>
        <StaggerItem className="h-full">
          <SmallStat label="This week" amount={d.week.amount} sub={count(d.week.count)} href="/receipts?range=week" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <SmallStat label="This month" amount={d.month.amount} sub={count(d.month.count)} href="/receipts?range=month" />
        </StaggerItem>
      </StaggerReveal>

      {d.owing.count > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Owed to you
            </h2>
            <span className="text-sm font-semibold text-gold tabular-nums">
              {formatNairaShort(d.owing.amount)}
            </span>
          </div>
          <ul className="relative divide-y divide-border overflow-hidden rounded-lg border border-gold/25 bg-gold/5">
            {d.debtors.map((x) => (
              <li key={`${x.customerId}-${x.name}`}>
                <Link
                  href={x.customerId ? `/customers/${x.customerId}` : `/receipts?status=owing&q=${encodeURIComponent(x.name)}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors active:bg-gold/10"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{x.name}</span>
                    <span className="block text-xs text-muted-foreground">{count(x.receipts, "unpaid receipt")}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-gold tabular-nums">{formatNairaShort(x.amount)}</span>
                  <ChevronRight className="-mr-1 size-4 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            ))}
            {d.owing.count > d.debtors.reduce((s, x) => s + x.receipts, 0) && (
              <li>
                <Link href="/receipts?status=owing" className="flex min-h-12 items-center justify-center gap-1 text-sm text-muted-foreground">
                  See all unpaid <ArrowRight className="size-4" />
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent receipts
          </h2>
          {d.recent.length > 0 && (
            <Link href="/receipts" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              See all <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        <ReceiptRows
          rows={d.recent}
          empty={
            <div className="space-y-3">
              <p>No receipts yet.</p>
              <Button asChild className="cta-btn h-11">
                <Link href="/receipts/new">
                  <Plus /> Create your first receipt
                </Link>
              </Button>
            </div>
          }
        />
      </section>
    </div>
  );
}
