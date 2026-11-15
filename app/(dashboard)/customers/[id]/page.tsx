import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerAccents } from "@/components/ui/corner-accents";
import { getCustomer } from "../queries";
import { listReceipts } from "../../receipts/queries";
import { formatNaira } from "../../receipts/_receipt/totals";
import { ReceiptRows } from "../../_components/receipt-rows";
import { Pager } from "../../_components/pager";

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const receipts = await listReceipts({ customerId: id, page: Number(sp.page) || 1 });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{customer.name}</h1>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground tabular-nums"
            >
              <Phone className="size-3.5" /> {customer.phone}
            </a>
          )}
          {customer.address && (
            <p className="text-sm text-muted-foreground">{customer.address}</p>
          )}
        </div>
        <Button asChild className="cta-btn h-11 shrink-0">
          <Link href={`/receipts/new?customer=${customer.id}`}>
            <Plus /> Receipt
          </Link>
        </Button>
      </header>

      <div className="relative grid grid-cols-3 border border-border bg-card">
        <CornerAccents />
        {[
          { label: "Receipts", value: String(customer.receipts) },
          { label: "Total spent", value: formatNaira(customer.spent) },
          { label: "Owes", value: formatNaira(customer.owing), gold: customer.owing > 0 },
        ].map((s, i) => (
          <div key={s.label} className={i < 2 ? "border-r border-border p-3 sm:p-4" : "p-3 sm:p-4"}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`truncate font-semibold tabular-nums sm:text-lg ${s.gold ? "text-gold" : ""}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <ReceiptRows rows={receipts.rows} showCustomer={false} />
      <Pager page={receipts.page} pages={receipts.pages} params={{}} />
    </div>
  );
}
