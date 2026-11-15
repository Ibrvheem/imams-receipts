// Form values can be "", undefined or strings mid-typing — anything
// non-numeric counts as 0.
export const num = (v: unknown) => {
  const n = Number(v);
  return v === "" || v == null || !Number.isFinite(n) ? 0 : n;
};

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export const formatNaira = (value: number) => naira.format(value);

const nairaWhole = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** For lists and stats: drops ".00" on whole amounts (kobo still shows). */
export const formatNairaShort = (value: number) =>
  Number.isInteger(value) ? nairaWhole.format(value) : naira.format(value);

type LineLike = { quantity?: unknown; unitPrice?: unknown } | undefined;

export function lineTotal(item: LineLike) {
  return num(item?.quantity) * num(item?.unitPrice);
}

export function computeTotals(receipt: {
  items?: LineLike[];
  discount?: unknown;
  amountPaid?: unknown;
  partPayment?: boolean;
}) {
  const subtotal = (receipt.items ?? []).reduce(
    (sum, item) => sum + lineTotal(item),
    0,
  );
  const discount = Math.min(num(receipt.discount), subtotal);
  const total = subtotal - discount;
  const paid = receipt.partPayment ? num(receipt.amountPaid) : total;
  const balance = Math.max(total - paid, 0);
  return { subtotal, discount, total, paid, balance };
}

export function generateReceiptNumber(date = new Date()) {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `IBL-${y}${m}${d}-${rand}`;
}
