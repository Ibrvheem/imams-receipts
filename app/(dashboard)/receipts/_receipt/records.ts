// Converters between a saved receipt and the form / PDF shape.
import dayjs from "dayjs";
import type { Receipt, ReceiptRecord } from "./types";

/** "YYYY-MM-DD" → local-midnight Date (what the date picker expects). */
export const fromISODate = (iso: string) => dayjs(iso).toDate();
/** Date → "YYYY-MM-DD" in her local calendar. */
export const toISODate = (date: Date) => dayjs(date).format("YYYY-MM-DD");

/** Saved receipt → form values / PDF input. */
export function recordToReceipt(r: ReceiptRecord): Receipt {
  return {
    receiptNumber: r.number,
    date: fromISODate(r.date),
    customerId: r.customerId ?? "",
    customerName: r.customerName,
    customerPhone: r.customerPhone ?? "",
    customerAddress: r.customerAddress ?? "",
    items: r.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    discount: r.discount,
    partPayment: r.partPayment,
    amountPaid: r.partPayment ? r.amountPaid : 0,
    paymentMethod: r.paymentMethod,
    note: r.note ?? "",
  };
}
