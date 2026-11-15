"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Download, Loader2, Pencil, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CornerAccents } from "@/components/ui/corner-accents";
import ControlledInput from "@/components/molecules/controlled-input";
import ControlledTextarea from "@/components/molecules/controlled-textarea";
import ControlledDateTimePicker from "@/components/molecules/controlled-date-picker";
import { BUSINESS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useReceiptForm } from "../_hooks/use-receipt-form";
import { PAYMENT_METHODS } from "../types";
import { formatNaira } from "../totals";
import { ReceiptPreview } from "./receipt-preview";
import { ChipField, OptionalField } from "./form-bits";
import { ItemsEditor } from "./items-editor";
import { Collapse } from "@/components/motion/collapse";

type View = "details" | "preview";

const PAYMENT_STATUS = [
  { label: "Paid in full", value: false },
  { label: "Part payment", value: true },
];

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative bg-card border border-border p-4 sm:p-5 space-y-4">
      <CornerAccents />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ReceiptGenerator() {
  // Phones/tablets show one pane at a time; desktop (lg+) shows both.
  const [view, setView] = useState<View>("details");
  // Receipt number + date are auto-filled, so they start folded away.
  const [editingMeta, setEditingMeta] = useState(false);
  // Which line item is open for editing (accordion); the first starts open.
  const [openItem, setOpenItem] = useState<number | null>(0);
  // Bumped on "New receipt" to re-fold every optional field.
  const [formKey, setFormKey] = useState(0);

  const switchTo = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0 });
  };

  const {
    form,
    items,
    values,
    totals,
    busy,
    canShare,
    download,
    share,
    newReceipt,
  } = useReceiptForm({
    onInvalid: (errors) => {
      setView("details");
      if (errors.date) setEditingMeta(true);
      // Open the first item that needs fixing (the others stay folded).
      const badItem = Array.isArray(errors.items)
        ? errors.items.findIndex(Boolean)
        : -1;
      if (badItem >= 0) setOpenItem(badItem);
      toast.error("Please fill in the highlighted fields.", { id: "invalid" });
      // Wait for the Details pane to show, then bring the first error into view.
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      }, 60);
    },
  });

  const confirmNew = () => {
    if (
      form.formState.isDirty &&
      !window.confirm("Start a new receipt? This one will be cleared.")
    )
      return;
    newReceipt();
    setEditingMeta(false);
    setOpenItem(0);
    setFormKey((k) => k + 1);
    switchTo("details");
  };

  const busyIcon = <Loader2 className="animate-spin" />;
  const showBalance = values.partPayment && totals.balance > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-5 pb-32 lg:max-w-7xl sm:pt-8 lg:pb-12">
      <header className="mb-5 flex items-center justify-between gap-4 lg:mb-8">
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {BUSINESS.name}
          </p>
          <h1 className="text-xl font-semibold sm:text-2xl">
            Receipt generator
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={confirmNew}
            type="button"
            aria-label="New receipt"
          >
            <RotateCcw /> <span className="hidden sm:inline">New receipt</span>
          </Button>
          <div className="hidden gap-2 lg:flex">
            {canShare && (
              <Button variant="outline" onClick={share} disabled={!!busy}>
                {busy === "share" ? busyIcon : <Share2 />} Share
              </Button>
            )}
            <Button onClick={download} disabled={!!busy} className="cta-btn">
              {busy === "download" ? busyIcon : <Download />} Download PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Details / Preview switch — phones and tablets only */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <div
          role="tablist"
          className="grid grid-cols-2 border border-border p-1"
        >
          {(["details", "preview"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => switchTo(v)}
              className={cn(
                "min-h-11 text-sm font-medium capitalize transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Details */}
        <div className={cn(view !== "details" && "hidden lg:block")}>
          <Form {...form}>
            <form
              key={formKey}
              onSubmit={(e) => {
                e.preventDefault();
                download();
              }}
              className="space-y-4 sm:space-y-5"
              noValidate
            >
              {/* Receipt no. (auto, never editable) + date (editable via "Edit date") */}
              <div>
                <div className="flex min-h-11 items-center justify-between gap-3 border border-border px-4 text-sm">
                  <p className="min-w-0 truncate text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {values.receiptNumber || "—"}
                    </span>
                    {" · "}
                    {values.date
                      ? dayjs(values.date).format("D MMM YYYY")
                      : "—"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingMeta((v) => !v)}
                    aria-expanded={editingMeta}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {editingMeta ? (
                      "Done"
                    ) : (
                      <>
                        <Pencil className="size-3.5" /> Edit date
                      </>
                    )}
                  </button>
                </div>
                <Collapse open={editingMeta}>
                  <div className="border border-t-0 border-border p-4">
                    <ControlledDateTimePicker
                      name="date"
                      label="Date"
                      placeholder="Pick a date"
                      showTime={false}
                    />
                  </div>
                </Collapse>
              </div>

              <Panel title="Customer">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ControlledInput
                    name="customerName"
                    label="Name"
                    placeholder="e.g. Aisha Bello"
                    enterKeyHint="next"
                  />
                  <ControlledInput
                    name="customerPhone"
                    label="Phone"
                    placeholder="0803 000 0000"
                    type="tel"
                    inputMode="tel"
                    enterKeyHint="next"
                    optional
                  />
                </div>
                <OptionalField name="customerAddress" addLabel="Add address">
                  {(justOpened) => (
                    <ControlledInput
                      name="customerAddress"
                      label="Address"
                      placeholder="Street, city"
                      autoFocus={justOpened}
                    />
                  )}
                </OptionalField>
              </Panel>

              <Panel title="Items">
                <ItemsEditor
                  items={items}
                  values={values.items}
                  openIndex={openItem}
                  onOpenChange={setOpenItem}
                />
                <div className="space-y-1 border-t border-border pt-3">
                  <OptionalField name="discount" addLabel="Add discount">
                    {(justOpened) => (
                      <ControlledInput
                        name="discount"
                        label="Discount (₦)"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        min={0}
                        autoFocus={justOpened}
                      />
                    )}
                  </OptionalField>
                  <p className="flex items-baseline justify-between pt-1">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatNaira(totals.total)}
                    </span>
                  </p>
                </div>
              </Panel>

              <Panel title="Payment">
                {/* Grouped so the panel's gap doesn't jump as the amount box folds */}
                <div>
                  <ChipField
                    name="partPayment"
                    label="Status"
                    options={PAYMENT_STATUS}
                  />
                  <Collapse
                    open={!!values.partPayment}
                    className="space-y-1 pt-4"
                  >
                    <ControlledInput
                      name="amountPaid"
                      label="Amount paid (₦)"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      min={0}
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
                      Balance due:{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatNaira(totals.balance)}
                      </span>
                    </p>
                  </Collapse>
                </div>
                <ChipField
                  name="paymentMethod"
                  label="Paid by"
                  options={PAYMENT_METHODS}
                />
                <OptionalField name="note" addLabel="Add note">
                  {() => (
                    <ControlledTextarea
                      name="note"
                      label="Note"
                      placeholder="Anything to add to the receipt"
                    />
                  )}
                </OptionalField>
              </Panel>

              <Button
                type="button"
                variant="outline"
                className="w-full lg:hidden"
                onClick={() => switchTo("preview")}
              >
                Preview receipt
              </Button>
            </form>
          </Form>
        </div>

        {/* Preview */}
        <div
          className={cn(
            "space-y-3 lg:sticky lg:top-6 lg:self-start",
            view !== "preview" && "hidden lg:block",
          )}
        >
          <p className="hidden text-xs uppercase tracking-[0.14em] text-muted-foreground lg:block">
            Live preview
          </p>
          <ReceiptPreview receipt={values} />
        </div>
      </div>

      {/* Bottom action bar — phones and tablets only */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {showBalance ? "Balance due" : "Total"}
            </p>
            <p className="truncate text-lg font-semibold tabular-nums">
              {formatNaira(showBalance ? totals.balance : totals.total)}
            </p>
          </div>
          {canShare && (
            <Button
              variant="outline"
              onClick={share}
              disabled={!!busy}
              aria-label="Share receipt"
              className="size-11 px-0!"
            >
              {busy === "share" ? busyIcon : <Share2 />}
            </Button>
          )}
          <Button onClick={download} disabled={!!busy} className="cta-btn">
            {busy === "download" ? busyIcon : <Download />}
            {busy === "download" ? "Preparing…" : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
