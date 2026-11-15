// Builds the PDFs for a saved receipt. react-pdf is loaded only when called.
import type { ReceiptRecord } from "./types";
import { recordToReceipt } from "./records";

/** The receipt itself, with its payment history. */
export async function receiptFile(record: ReceiptRecord) {
  const { buildReceiptPdf } = await import("./_components/receipt-pdf");
  return buildReceiptPdf(recordToReceipt(record), record.payments);
}

/** Slip numbers: the receipt number plus the payment's position, e.g. …-1001-P2. */
export const slipNumber = (record: ReceiptRecord, paymentId: string) =>
  `${record.number}-P${record.payments.findIndex((p) => p.id === paymentId) + 1}`;

/** Proof of a single payment: amount, method, and the balance after it. */
export async function paymentSlipFile(record: ReceiptRecord, paymentId: string) {
  const index = record.payments.findIndex((p) => p.id === paymentId);
  if (index < 0) throw new Error("Payment not found");
  const payment = record.payments[index];
  const paidToDate = record.payments
    .slice(0, index + 1)
    .reduce((sum, p) => sum + p.amount, 0);
  const { buildPaymentSlipPdf } = await import("./_components/receipt-pdf");
  return buildPaymentSlipPdf({
    slipNumber: slipNumber(record, paymentId),
    receiptNumber: record.number,
    customerName: record.customerName,
    customerPhone: record.customerPhone,
    payment,
    total: record.total,
    paidToDate: Math.round(paidToDate * 100) / 100,
  });
}
