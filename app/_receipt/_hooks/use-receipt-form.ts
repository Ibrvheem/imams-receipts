"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
import { receiptSchema, type Receipt, type ReceiptDraft } from "../types";
import { computeTotals, generateReceiptNumber } from "../totals";

type FormValues = z.input<typeof receiptSchema>;
type Action = "download" | "share";

export const EMPTY_ITEM = { description: "", quantity: 1, unitPrice: "" };

const DEFAULTS: DefaultValues<FormValues> = {
  receiptNumber: "",
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

// Phones that can share files get a Share button (WhatsApp, email, …).
let shareSupport: boolean | undefined;
function canShareFiles() {
  if (shareSupport === undefined) {
    try {
      const probe = new File([""], "probe.pdf", { type: "application/pdf" });
      shareSupport = !!navigator.canShare?.({ files: [probe] });
    } catch {
      shareSupport = false;
    }
  }
  return shareSupport;
}
const noSubscribe = () => () => {};

function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useReceiptForm({
  onInvalid,
}: { onInvalid?: (errors: FieldErrors<FormValues>) => void } = {}) {
  const form = useForm<FormValues, unknown, Receipt>({
    resolver: zodResolver(receiptSchema),
    defaultValues: DEFAULTS,
  });

  const items = useFieldArray({ control: form.control, name: "items" });
  const values = useWatch({ control: form.control }) as ReceiptDraft;
  const totals = computeTotals(values);
  const [busy, setBusy] = useState<Action | null>(null);
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, () => false);

  // Date and receipt number depend on the client clock / randomness, so set
  // them after mount to keep server and client render identical.
  useEffect(() => {
    const now = new Date();
    if (!form.getValues("date")) form.setValue("date", now);
    if (!form.getValues("receiptNumber"))
      form.setValue("receiptNumber", generateReceiptNumber(now));

    // Warm up the PDF code in the background so the first tap is quick.
    const warm = setTimeout(() => void import("../_components/receipt-pdf"), 1500);
    return () => clearTimeout(warm);
  }, [form]);

  const newReceipt = () => {
    const now = new Date();
    form.reset({ ...DEFAULTS, items: [EMPTY_ITEM], date: now, receiptNumber: generateReceiptNumber(now) });
  };

  const run = (action: Action) =>
    form.handleSubmit(
      async (receipt) => {
        setBusy(action);
        try {
          // react-pdf is heavy — load it only when a PDF is actually needed.
          const { buildReceiptPdf } = await import("../_components/receipt-pdf");
          const file = await buildReceiptPdf(receipt);
          if (action === "share") {
            const share = () =>
              navigator.share({ files: [file], title: file.name }).catch((error) => {
                // She closed the share sheet — not an error.
                if ((error as Error)?.name !== "AbortError") throw error;
              });
            try {
              await share();
            } catch (error) {
              // Safari only allows sharing straight after a tap; building the
              // PDF can take too long. Offer a fresh tap instead.
              if ((error as Error)?.name !== "NotAllowedError") throw error;
              toast("Receipt is ready", {
                action: { label: "Share", onClick: () => void share() },
                duration: 15000,
              });
            }
          } else {
            saveFile(file);
            toast.success("Receipt downloaded");
          }
        } catch (error) {
          console.error(error);
          toast.error("Couldn't create the PDF. Please try again.");
        } finally {
          setBusy(null);
        }
      },
      (errors) => onInvalid?.(errors),
    )();

  return {
    form,
    items,
    values,
    totals,
    busy,
    canShare,
    download: () => run("download"),
    share: () => run("share"),
    newReceipt,
  };
}
