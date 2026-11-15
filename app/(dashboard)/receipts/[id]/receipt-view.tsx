"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Download, Loader2, Pencil, Share2, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CornerAccents } from "@/components/ui/corner-accents";
import type { ReceiptRecord } from "../_receipt/types";
import { formatNaira } from "../_receipt/totals";
import { recordToReceipt } from "../_receipt/records";
import { ReceiptPreview } from "../_receipt/_components/receipt-preview";
import { useReceiptPdf } from "../_receipt/_hooks/use-receipt-pdf";
import { deleteReceipt } from "../service";

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
  const { busy, canShare, download, share } = useReceiptPdf(data);
  const [deleting, setDeleting] = useState(false);
  const spin = <Loader2 className="animate-spin" />;

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
    <div className="mx-auto grid w-full max-w-2xl gap-6 lg:max-w-6xl lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <header>
          <p className="text-sm text-muted-foreground tabular-nums">
            {receipt.number} · {dayjs(receipt.date).format("D MMM YYYY")}
          </p>
          <h1 className="text-xl font-semibold sm:text-2xl">{receipt.customerName}</h1>
        </header>

        <div className="relative grid grid-cols-2 border border-border bg-card">
          <CornerAccents />
          <div className="border-r border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-lg font-semibold tabular-nums">{formatNaira(receipt.total)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {receipt.balance > 0 ? "Balance due" : "Status"}
            </p>
            <p
              className={
                receipt.balance > 0
                  ? "text-lg font-semibold tabular-nums text-gold"
                  : "text-lg font-semibold text-win"
              }
            >
              {receipt.balance > 0 ? formatNaira(receipt.balance) : "Paid in full"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={download} disabled={!!busy} className="cta-btn h-12 col-span-2 sm:col-span-1">
            {busy === "download" ? spin : <Download />} Download PDF
          </Button>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={!!busy} className="h-12 col-span-2 sm:col-span-1">
              {busy === "share" ? spin : <Share2 />} Share
            </Button>
          )}
          <Button variant="outline" asChild className="h-11">
            <Link href={`/receipts/${receipt.id}/edit`}>
              <Pencil /> {receipt.balance > 0 ? "Edit / record payment" : "Edit"}
            </Link>
          </Button>
          <Button variant="destructive" onClick={remove} disabled={deleting} className="h-11">
            {deleting ? spin : <Trash2 />} Delete
          </Button>
        </div>

        {receipt.customerId && (
          <Link
            href={`/customers/${receipt.customerId}`}
            className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <UserRound className="size-4" /> View {receipt.customerName}&apos;s receipts
          </Link>
        )}
      </div>

      <ReceiptPreview receipt={data} />
    </div>
  );
}
