"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Download, Loader2, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReceiptRecord } from "../_receipt/types";
import { formatNaira } from "../_receipt/totals";
import { paymentSlipFile, slipNumber } from "../_receipt/documents";
import type { usePdfActions } from "../_receipt/_hooks/use-receipt-pdf";
import { deletePayment } from "../service";

/** Every payment towards this receipt, each with its own slip. */
export function PaymentList({
  receipt,
  pdf,
}: {
  receipt: ReceiptRecord;
  pdf: ReturnType<typeof usePdfActions>;
}) {
  const [removing, setRemoving] = useState<string | null>(null);
  if (!receipt.payments.length) return null;

  const remove = async (id: string, amount: number) => {
    if (!window.confirm(`Remove the ${formatNaira(amount)} payment? The balance goes back up.`)) return;
    setRemoving(id);
    const result = await deletePayment(id).catch(() => ({ success: false as const, message: "" }));
    if (!result.success) toast.error(result.message || "Couldn't remove the payment.");
    else toast.success("Payment removed");
    setRemoving(null);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Payments
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNaira(receipt.amountPaid)} of {formatNaira(receipt.total)}
        </span>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {receipt.payments.map((p) => {
          const busy = pdf.busy?.key === p.id || removing === p.id;
          const build = () => paymentSlipFile(receipt, p.id);
          return (
            <li key={p.id} className="flex min-h-14 items-center gap-3 py-2 pr-1 pl-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium tabular-nums">{formatNaira(p.amount)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {dayjs(p.date).format("D MMM YYYY")} · {p.method}
                  {p.initial && " · at purchase"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" aria-label="Payment options" className="size-11 px-0!" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Slip {slipNumber(receipt, p.id)}
                  </DropdownMenuLabel>
                  {pdf.canShare && (
                    <DropdownMenuItem className="min-h-11" onSelect={() => void pdf.share(p.id, build)}>
                      <Share2 /> Share payment slip
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="min-h-11" onSelect={() => void pdf.download(p.id, build)}>
                    <Download /> Download payment slip
                  </DropdownMenuItem>
                  {!p.initial && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        className="min-h-11"
                        onSelect={() => void remove(p.id, p.amount)}
                      >
                        <Trash2 /> Remove payment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
