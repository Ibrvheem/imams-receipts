"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Loader2, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, type ReceiptRecord } from "../_receipt/types";
import { formatNaira } from "../_receipt/totals";
import { paymentSlipFile, receiptFile } from "../_receipt/documents";
import type { usePdfActions } from "../_receipt/_hooks/use-receipt-pdf";
import { recordPayment } from "../service";

const CHIP = "min-h-10 rounded-md border px-3 text-sm transition-colors";

/**
 * Bottom sheet to record money received. After saving it offers the updated
 * receipt (default) or a slip for just this payment.
 */
export function RecordPayment({
  receipt,
  pdf,
  showTrigger,
}: {
  receipt: ReceiptRecord;
  pdf: ReturnType<typeof usePdfActions>;
  showTrigger: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(receipt.paymentMethod);
  const [saving, setSaving] = useState(false);
  // Set once saved: the sheet switches to "share it" mode.
  const [saved, setSaved] = useState<{ paymentId: string; balance: number } | null>(null);

  const balance = receipt.balance;
  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value > 0;
  const tooMuch = valid && value > balance + 0.005;
  const remaining = Math.max(balance - (valid ? value : 0), 0);

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setAmount("");
      setSaved(null);
      setMethod(receipt.paymentMethod);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || tooMuch) return;
    setSaving(true);
    try {
      const result = await recordPayment(receipt.id, value, method);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSaved({ paymentId: result.paymentId, balance: result.balance });
    } catch {
      toast.error("Couldn't record the payment. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // The page refreshes with the new payment after saving; until it arrives
  // the documents can't include it yet.
  const ready = !!saved && receipt.payments.some((p) => p.id === saved.paymentId);
  const busy = (key: string) => pdf.busy?.key === key;

  return (
    <Sheet open={open} onOpenChange={reset}>
      {showTrigger && (
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-full border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
        >
          <Wallet /> Record payment
        </Button>
      </SheetTrigger>
      )}
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg gap-0 rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {saved ? (
          <div className="space-y-4 px-4 pt-6 pb-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-win" />
              <div>
                <SheetTitle className="text-lg">Payment saved</SheetTitle>
                <SheetDescription>
                  {formatNaira(value)} by {method}.{" "}
                  {saved.balance > 0 ? (
                    <>
                      Balance now{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatNaira(saved.balance)}
                      </span>
                      .
                    </>
                  ) : (
                    <span className="text-win">Fully paid.</span>
                  )}
                </SheetDescription>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Send the customer:</p>
              <Button
                className="cta-btn h-12 w-full"
                disabled={!ready || !!pdf.busy}
                onClick={() =>
                  pdf.canShare
                    ? pdf.share("receipt", () => receiptFile(receipt))
                    : pdf.download("receipt", () => receiptFile(receipt))
                }
              >
                {!ready || busy("receipt") ? <Loader2 className="animate-spin" /> : <Share2 />}
                Updated receipt
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full"
                disabled={!ready || !!pdf.busy}
                onClick={() => {
                  const build = () => paymentSlipFile(receipt, saved.paymentId);
                  return pdf.canShare
                    ? pdf.share(saved.paymentId, build)
                    : pdf.download(saved.paymentId, build);
                }}
              >
                {busy(saved.paymentId) ? <Loader2 className="animate-spin" /> : <FileText />}
                Slip for this payment only
              </Button>
              <Button variant="ghost" className="h-11 w-full" onClick={() => reset(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-2">
              <SheetTitle className="text-lg">Record payment</SheetTitle>
              <SheetDescription>
                Balance due{" "}
                <span className="font-medium text-foreground tabular-nums">{formatNaira(balance)}</span>
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={submit} className="space-y-4 px-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Amount received (₦)</span>
                <Input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="done"
                  min={0}
                  placeholder="0"
                  value={amount}
                  aria-invalid={tooMuch || undefined}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-xl font-semibold tabular-nums"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  className={cn(CHIP, "border-border text-muted-foreground hover:text-foreground active:bg-muted")}
                >
                  Full balance
                </button>
                {balance >= 2 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(balance / 2)))}
                    className={cn(CHIP, "border-border text-muted-foreground hover:text-foreground active:bg-muted")}
                  >
                    Half
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Paid by</p>
                <div role="radiogroup" aria-label="Paid by" className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={method === m.value}
                      onClick={() => setMethod(m.value)}
                      className={cn(
                        CHIP,
                        "px-1",
                        method === m.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {tooMuch ? (
                  <span className="text-loss">That&apos;s more than the {formatNaira(balance)} balance.</span>
                ) : valid && value >= balance - 0.005 ? (
                  <span className="text-win">Receipt will be marked paid in full.</span>
                ) : (
                  <>
                    Still owed after this:{" "}
                    <span className="font-medium text-foreground tabular-nums">{formatNaira(remaining)}</span>
                  </>
                )}
              </p>
              <Button type="submit" disabled={!valid || tooMuch || saving} className="cta-btn h-12 w-full">
                {saving ? <Loader2 className="animate-spin" /> : null} Save payment
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
