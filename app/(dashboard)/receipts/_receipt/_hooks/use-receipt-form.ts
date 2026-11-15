"use client";

import { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type DefaultValues,
  type FieldErrors,
} from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  receiptSchema,
  type Receipt,
  type ReceiptDraft,
  type ReceiptRecord,
} from "../types";
import { computeTotals, generateReceiptNumber } from "../totals";
import { recordToReceipt, toISODate } from "../records";
import { saveReceipt, type CustomerSuggestion } from "../../service";

export type FormValues = z.input<typeof receiptSchema>;

export const EMPTY_ITEM = { description: "", quantity: 1, unitPrice: "" };

const DEFAULTS: DefaultValues<FormValues> = {
  receiptNumber: "",
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  items: [EMPTY_ITEM],
  discount: "",
  partPayment: false,
  amountPaid: "",
  paymentMethod: "Cash",
  note: "",
};

const isRedirect = (error: unknown) =>
  typeof (error as { digest?: unknown })?.digest === "string" &&
  (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");

/** A saved receipt as form values (zero amounts left blank, so they fold). */
function toFormValues(record: ReceiptRecord): DefaultValues<FormValues> {
  const r = recordToReceipt(record);
  return {
    ...r,
    discount: r.discount || "",
    amountPaid: r.partPayment ? r.amountPaid : "",
  };
}

export function useReceiptForm({
  initial,
  customer,
  onInvalid,
}: {
  /** Editing an existing receipt. */
  initial?: ReceiptRecord;
  /** New receipt for a saved customer. */
  customer?: CustomerSuggestion;
  onInvalid?: (errors: FieldErrors<FormValues>) => void;
} = {}) {
  const form = useForm<FormValues, unknown, Receipt>({
    resolver: zodResolver(receiptSchema),
    defaultValues: initial
      ? toFormValues(initial)
      : customer
        ? {
            ...DEFAULTS,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone ?? "",
            customerAddress: customer.address ?? "",
          }
        : DEFAULTS,
  });

  const items = useFieldArray({ control: form.control, name: "items" });
  const values = useWatch({ control: form.control }) as ReceiptDraft;
  const totals = computeTotals(values);
  const [saving, setSaving] = useState(false);

  // Date and receipt number depend on the client clock / randomness, so set
  // them after mount to keep server and client render identical.
  useEffect(() => {
    if (initial) return;
    const now = new Date();
    if (!form.getValues("date")) form.setValue("date", now);
    if (!form.getValues("receiptNumber"))
      form.setValue("receiptNumber", generateReceiptNumber(now));
  }, [form, initial]);

  const save = form.handleSubmit(
    async (receipt) => {
      setSaving(true);
      try {
        // On success the server redirects to the saved receipt; it only
        // returns when the save failed.
        const result = await saveReceipt(
          { ...receipt, date: toISODate(receipt.date) },
          initial?.id,
        );
        toast.error(result.message);
        setSaving(false);
      } catch (error) {
        // The redirect reaches the client as a rejected promise; Next is
        // already navigating, so keep the button busy until we leave.
        if (isRedirect(error)) return;
        toast.error("Couldn't save. Check your connection and try again.");
        setSaving(false);
      }
    },
    (errors) => onInvalid?.(errors),
  );

  return { form, items, values, totals, saving, save };
}
