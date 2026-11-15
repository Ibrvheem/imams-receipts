import { z } from "zod";

export const PAYMENT_METHODS = [
  { label: "Cash", value: "Cash" },
  { label: "Transfer", value: "Bank transfer" },
  { label: "POS", value: "POS" },
  { label: "Other", value: "Other" },
];

// Money fields left blank count as 0 (so they can show a "0" placeholder
// instead of a pre-filled 0 she has to delete first on a phone keyboard).
const optionalAmount = z.preprocess(
  (v) => (v === "" || v == null ? 0 : v),
  z.coerce.number().min(0, "Can't be negative"),
);

export const receiptItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce
    .number({ invalid_type_error: "Enter a quantity" })
    .min(1, "Min 1"),
  unitPrice: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce
      .number({ invalid_type_error: "Enter a price" })
      .min(0, "Can't be negative"),
  ),
});

export const receiptSchema = z.object({
  /** Shown on the preview; the server confirms or replaces it on save. */
  receiptNumber: z.string().trim().min(1, "Receipt number is required"),
  date: z.date({ required_error: "Date is required" }),
  /** Set when she picks a saved customer from the suggestions. */
  customerId: z.string().uuid().optional().or(z.literal("")),
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().optional(),
  customerAddress: z.string().trim().optional(),
  items: z.array(receiptItemSchema).min(1, "Add at least one item"),
  discount: optionalAmount,
  /** false = paid in full (amountPaid is ignored and treated as the total). */
  partPayment: z.boolean().default(false),
  amountPaid: optionalAmount,
  paymentMethod: z.string().min(1, "Payment method is required"),
  note: z.string().trim().optional(),
});

/**
 * What the form sends to the server. The date travels as "YYYY-MM-DD" so a
 * server in another timezone can't shift it by a day.
 */
export const receiptInputSchema = receiptSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
});
export type ReceiptInput = z.infer<typeof receiptInputSchema>;

/** A saved receipt as pages and client components receive it. */
export type ReceiptRecord = {
  id: string;
  number: string;
  /** "YYYY-MM-DD" */
  date: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  partPayment: boolean;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
};

/** Validated receipt — what goes into the PDF. */
export type Receipt = z.infer<typeof receiptSchema>;
/** Raw form values while she is still typing — anything may be blank. */
export type ReceiptDraft = Partial<z.input<typeof receiptSchema>>;
