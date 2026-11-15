"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReceiptRecord } from "../_receipt/types";
import { formatNaira } from "../_receipt/totals";
import { recordToReceipt } from "../_receipt/records";
import { ReceiptPreview } from "../_receipt/_components/receipt-preview";
import { usePdfActions } from "../_receipt/_hooks/use-receipt-pdf";
import { receiptFile } from "../_receipt/documents";
import { PaymentList } from "./payment-list";
import { deleteReceipt } from "../service";
import { RecordPayment } from "./record-payment";

export function ReceiptView({
  receipt,
  justSaved,
}: {
  receipt: ReceiptRecord;
  /** Arrived here straight after saving (from ?saved=…). */
  justSaved?: "new" | "edit";
}) {
  const router = useRouter();
  const data = useMemo(() => recordToReceipt(receipt), [receipt]);
  const pdf = usePdfActions();
  const { busy, canShare } = pdf;
  const download = () => pdf.download("receipt", () => receiptFile(receipt));
  const share = () => pdf.share("receipt", () => receiptFile(receipt));
  const receiptBusy = busy?.key === "receipt" ? busy.action : null;
  const [deleting, setDeleting] = useState(false);
  const spin = <Loader2 className="animate-spin" />;
  const owing = receipt.balance > 0;

  useEffect(() => {
    if (!justSaved) return;
    toast.success(justSaved === "new" ? `Saved ${receipt.number}` : "Changes saved", {
      id: "saved",
    });
    // Drop ?saved so a refresh doesn't toast again.
    window.history.replaceState(null, "", window.location.pathname);
  }, [justSaved, receipt.number]);

  const remove = async () => {
    if (!window.confirm(`Delete receipt ${receipt.number}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteReceipt(receipt.id);
      toast.success("Receipt deleted");
      router.replace("/receipts");
    } catch {
      toast.error("Couldn't delete. Try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-6 lg:max-w-6xl lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground tabular-nums">
              {receipt.number} · {dayjs(receipt.date).format("D MMM YYYY")}
            </p>
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{receipt.customerName}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="More actions" className="size-11 shrink-0 px-0!">
                {deleting ? spin : <MoreHorizontal />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild className="min-h-11">
                <Link href={`/receipts/${receipt.id}/edit`}>
                  <Pencil /> Edit receipt
                </Link>
              </DropdownMenuItem>
              {receipt.customerId && (
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href={`/customers/${receipt.customerId}`}>
                    <UserRound /> View customer
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11"
                onSelect={() => void remove()}
              >
                <Trash2 /> Delete receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-r border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="truncate text-lg font-semibold tabular-nums">{formatNaira(receipt.total)}</p>
            {owing && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Paid {formatNaira(receipt.amountPaid)}
              </p>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {owing ? "Balance due" : "Status"}
            </p>
            <p className={owing ? "truncate text-lg font-semibold tabular-nums text-gold" : "text-lg font-semibold text-win"}>
              {owing ? formatNaira(receipt.balance) : "Paid in full"}
            </p>
            {!owing && <p className="text-xs text-muted-foreground">{receipt.paymentMethod}</p>}
          </div>
        </div>

        <div className="space-y-2">
          {/* Stays mounted after the balance hits 0 so its "share" step can finish. */}
          <RecordPayment receipt={receipt} pdf={pdf} showTrigger={owing} />
          <div className="flex gap-2">
            <Button onClick={download} disabled={!!busy} className="cta-btn h-12 flex-1">
              {receiptBusy === "download" ? spin : <Download />} Download PDF
            </Button>
            {canShare && (
              <Button
                variant="outline"
                onClick={share}
                disabled={!!busy}
                aria-label="Share receipt"
                className="size-12 shrink-0 px-0!"
              >
                {receiptBusy === "share" ? spin : <Share2 />}
              </Button>
            )}
          </div>
        </div>

        <PaymentList receipt={receipt} pdf={pdf} />
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Receipt
        </h2>
        <ReceiptPreview receipt={data} payments={receipt.payments} />
      </section>
    </div>
  );
}
