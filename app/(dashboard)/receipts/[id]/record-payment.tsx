"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
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
import { formatNaira, formatNairaShort } from "../_receipt/totals";
import { recordPayment } from "../service";

/** Bottom sheet to collect (part of) the balance without editing the receipt. */
export function RecordPayment({ id, balance }: { id: string; balance: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value > 0;
  const remaining = Math.max(balance - (valid ? value : 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const result = await recordPayment(id, value);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(
        result.balance > 0
          ? `Payment recorded · ${formatNairaShort(result.balance)} still owed`
          : "Payment recorded · fully paid",
      );
      setOpen(false);
      setAmount("");
    } catch {
      toast.error("Couldn't record the payment. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-full border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
        >
          <Wallet /> Record payment
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg gap-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:border"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Record payment</SheetTitle>
          <SheetDescription>
            Balance due <span className="font-medium text-foreground tabular-nums">{formatNaira(balance)}</span>
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
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-xl font-semibold tabular-nums"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAmount(String(balance))}
              className="min-h-10 border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
            >
              Full balance
            </button>
            {balance >= 2 && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(balance / 2)))}
                className="min-h-10 border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
              >
                Half
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {valid && value >= balance ? (
              <span className="text-win">Receipt will be marked paid in full.</span>
            ) : (
              <>
                Still owed after this:{" "}
                <span className="font-medium text-foreground tabular-nums">{formatNaira(remaining)}</span>
              </>
            )}
          </p>
          <Button type="submit" disabled={!valid || saving} className="cta-btn h-12 w-full">
            {saving ? <Loader2 className="animate-spin" /> : null} Save payment
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
