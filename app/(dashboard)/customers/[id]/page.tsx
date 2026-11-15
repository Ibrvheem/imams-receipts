import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomer } from "../queries";
import { listReceipts } from "../../receipts/queries";
import { formatNairaShort } from "../../receipts/_receipt/totals";
import { ReceiptRows } from "../../_components/receipt-rows";
import { Pager } from "../../_components/pager";

/** 0803… → 234803… for wa.me links (Nigerian numbers). */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

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

  const stats = [
    { label: "Receipts", value: String(customer.receipts) },
    { label: "Spent", value: formatNairaShort(customer.spent) },
    { label: "Owes", value: formatNairaShort(customer.owing), gold: customer.owing > 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">{customer.name}</h1>
        {(customer.phone || customer.address) && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {[customer.phone, customer.address].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <div className="grid grid-cols-3 gap-2">
        {customer.phone ? (
          <>
            <Button variant="outline" asChild className="h-12 flex-col gap-0.5 text-xs">
              <a href={`tel:${customer.phone}`}>
                <Phone /> Call
              </a>
            </Button>
            <Button variant="outline" asChild className="h-12 flex-col gap-0.5 text-xs">
              <a href={`https://wa.me/${whatsappNumber(customer.phone)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          </>
        ) : (
          <p className="col-span-2 flex items-center text-sm text-muted-foreground">
            No phone number saved.
          </p>
        )}
        <Button asChild className="cta-btn h-12 flex-col gap-0.5 text-xs">
          <Link href={`/receipts/new?customer=${customer.id}`}>
            <Plus /> New receipt
          </Link>
        </Button>
      </div>

      <div className="relative grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-card">
        {stats.map((s, i) => (
          <div key={s.label} className={i < 2 ? "min-w-0 border-r border-border p-3 sm:p-4" : "min-w-0 p-3 sm:p-4"}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`truncate font-semibold tabular-nums sm:text-lg ${s.gold ? "text-gold" : ""}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Receipts
        </h2>
        <ReceiptRows rows={receipts.rows} showCustomer={false} />
      </section>
      <Pager page={receipts.page} pages={receipts.pages} params={{}} />
    </div>
  );
}
