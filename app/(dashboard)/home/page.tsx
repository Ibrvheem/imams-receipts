import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerAccents } from "@/components/ui/corner-accents";
import { StaggerItem, StaggerReveal } from "@/components/motion/stagger-reveal";
import { requireUser } from "@/lib/dal";
import { getDashboard } from "../receipts/queries";
import { formatNaira } from "../receipts/_receipt/totals";
import { ReceiptRows } from "../_components/receipt-rows";

function Stat({
  label,
  amount,
  sub,
  href,
  accent = "primary",
}: {
  label: string;
  amount: number;
  sub: string;
  href: string;
  accent?: "primary" | "gold";
}) {
  return (
    <Link
      href={href}
      className="relative flex h-full flex-col gap-1 border border-border bg-card p-4 inset-highlight hover-lift transition-colors hover:border-primary/30"
    >
      <CornerAccents />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={
          accent === "gold"
            ? "truncate text-lg font-semibold tabular-nums text-gold sm:text-xl"
            : "truncate text-lg font-semibold tabular-nums text-primary sm:text-xl"
        }
      >
        {formatNaira(amount)}
      </span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </Link>
  );
}

const count = (n: number, word = "receipt") => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function HomePage() {
  const [user, d] = await Promise.all([requireUser(), getDashboard()]);
  const first = user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{first}</h1>
        </div>
        <Button asChild className="cta-btn h-11">
          <Link href="/receipts/new">
            <Plus /> New receipt
          </Link>
        </Button>
      </header>

      <StaggerReveal className="grid grid-cols-2 gap-3 sm:gap-4">
        <StaggerItem className="h-full">
          <Stat label="Today" amount={d.today.amount} sub={count(d.today.count)} href="/receipts?range=today" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <Stat label="This week" amount={d.week.amount} sub={count(d.week.count)} href="/receipts?range=week" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <Stat label="This month" amount={d.month.amount} sub={count(d.month.count)} href="/receipts?range=month" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <Stat
            label="Owed to you"
            amount={d.owing.amount}
            sub={count(d.owing.count, "unpaid receipt")}
            href="/receipts?status=owing"
            accent="gold"
          />
        </StaggerItem>
      </StaggerReveal>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
            <>
              No receipts yet.{" "}
              <Link href="/receipts/new" className="text-primary underline-offset-4 hover:underline">
                Create your first one
              </Link>
            </>
          }
        />
      </section>
    </div>
  );
}
