// The ONE receipt layout. It is rendered twice with different primitives:
//   - receipt-pdf.tsx     → @react-pdf/renderer's View/Text/Image (the download)
//   - receipt-preview.tsx → plain divs styled in `pt` (the on-screen preview)
// so the preview is always exactly what the PDF will look like.
// Keep this file free of @react-pdf imports — it ships in the main bundle.
import type { ComponentType, ReactNode } from "react";
import dayjs from "dayjs";
import { BUSINESS } from "@/lib/config";
import type { ReceiptDraft } from "../types";
import { computeTotals, formatNaira, lineTotal, num } from "../totals";

export type Style = Record<string, string | number>;
type StyleProp = Style | (Style | false | undefined)[];

export type Primitives = {
  View: ComponentType<{
    style?: StyleProp;
    fixed?: boolean;
    wrap?: boolean;
    children?: ReactNode;
  }>;
  Text: ComponentType<{
    style?: StyleProp;
    fixed?: boolean;
    children?: ReactNode;
  }>;
  Image: ComponentType<{ style?: StyleProp; src: string }>;
};

/** A4 in points — react-pdf's unit, and CSS's `pt`. */
export const A4 = { width: 595.28, height: 841.89 };

const INK = "#111111";
const MUTED = "#6b6b6b";
const RULE = "#e2e2e2";
const SOFT = "#f5f5f5";
const GREEN = "#127a3e";
const AMBER = "#a35a00";

// All numbers are points. Only use properties both react-pdf and CSS support.
export const styles = {
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: INK,
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 84, // room for the fixed footer
    lineHeight: 1.4,
  },
  row: { flexDirection: "row" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
  },
  logo: { width: 44, height: 44, marginRight: 12, objectFit: "contain" },
  bizName: { fontSize: 16, fontWeight: 700 },
  muted: { color: MUTED },
  headerRight: { alignItems: "flex-end" },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: 2, lineHeight: 1.15 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  metaLabel: { color: MUTED, marginRight: 8 },
  metaValue: { fontWeight: 500 },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 18,
  },
  label: {
    fontSize: 7.5,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  customer: { fontSize: 11, fontWeight: 600 },
  th: {
    flexDirection: "row",
    backgroundColor: SOFT,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
  },
  cIdx: { width: 22, color: MUTED },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 40, textAlign: "right" },
  cPrice: { width: 90, textAlign: "right" },
  cAmt: { width: 95, textAlign: "right", fontWeight: 500 },
  totals: { marginTop: 14, marginLeft: "auto", width: 230 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginVertical: 4,
    borderTopWidth: 1.5,
    borderTopColor: INK,
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
    fontSize: 11.5,
    fontWeight: 700,
  },
  strong: { fontWeight: 600 },
  status: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1.25,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  paid: { color: GREEN, borderColor: GREEN },
  partial: { color: AMBER, borderColor: AMBER },
  note: { marginTop: 26, padding: 10, backgroundColor: SOFT },
  placeholder: { color: "#b5b5b5" },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    textAlign: "center",
    color: MUTED,
    fontSize: 8.5,
    paddingTop: 10,
    borderTopWidth: 0.75,
    borderTopColor: RULE,
  },
  // Faint diagonal mark behind everything, on every page.
  watermarkWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 44,
    fontWeight: 700,
    letterSpacing: 2,
    color: INK,
    opacity: 0.045,
    transform: "rotate(-30deg)",
  },
  watermarkLogo: { width: 300, height: 300, objectFit: "contain", opacity: 0.06 },
} satisfies Record<string, Style>;

const s = styles;

export function ReceiptLayout({
  receipt,
  P,
  assetBase = "",
}: {
  receipt: ReceiptDraft;
  P: Primitives;
  /** Prefix for /public assets (react-pdf needs an absolute URL). */
  assetBase?: string;
}) {
  const { View, Text, Image } = P;
  const totals = computeTotals(receipt);
  const items = receipt.items ?? [];
  const contact = [BUSINESS.phone, BUSINESS.email]
    .filter(Boolean)
    .join("  ·  ");
  const isPaid = totals.balance === 0;
  const dash = <Text style={s.placeholder}>—</Text>;

  return (
    <>
      <View style={s.header}>
        <View style={s.row}>
          {BUSINESS.logo ? (
            // Primitive, not a DOM <img>: the HTML version sets alt="".
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={s.logo} src={`${assetBase}${BUSINESS.logo}`} />
          ) : null}
          <View>
            <Text style={s.bizName}>{BUSINESS.name}</Text>
            {BUSINESS.tagline ? (
              <Text style={s.muted}>{BUSINESS.tagline}</Text>
            ) : null}
            {BUSINESS.address ? (
              <Text style={[s.muted, { marginTop: 4, maxWidth: 220 }]}>
                {BUSINESS.address}
              </Text>
            ) : null}
            {contact ? <Text style={s.muted}>{contact}</Text> : null}
          </View>
        </View>
        <View style={s.headerRight}>
          <Text style={s.title}>RECEIPT</Text>
          <View style={[s.metaRow, { marginTop: 8 }]}>
            <Text style={s.metaLabel}>Receipt no.</Text>
            <Text style={s.metaValue}>{receipt.receiptNumber || "—"}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>
              {receipt.date ? dayjs(receipt.date).format("D MMM YYYY") : "—"}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <View style={{ maxWidth: 280 }}>
          <Text style={s.label}>Received from</Text>
          {receipt.customerName ? (
            <Text style={s.customer}>{receipt.customerName}</Text>
          ) : (
            dash
          )}
          {receipt.customerPhone ? (
            <Text style={s.muted}>{receipt.customerPhone}</Text>
          ) : null}
          {receipt.customerAddress ? (
            <Text style={s.muted}>{receipt.customerAddress}</Text>
          ) : null}
        </View>
        <View style={s.headerRight}>
          <Text style={s.label}>Payment method</Text>
          <Text style={s.metaValue}>{receipt.paymentMethod || "—"}</Text>
        </View>
      </View>

      <View style={s.th} fixed>
        <Text style={{ width: 22 }}>#</Text>
        <Text style={s.cDesc}>Description</Text>
        <Text style={s.cQty}>Qty</Text>
        <Text style={s.cPrice}>Unit price</Text>
        <Text style={[s.cAmt, { fontWeight: 600 }]}>Amount</Text>
      </View>
      {items.map((item, i) => (
        <View style={s.tr} key={i} wrap={false}>
          <Text style={s.cIdx}>{i + 1}</Text>
          {item?.description ? (
            <Text style={s.cDesc}>{item.description}</Text>
          ) : (
            <Text style={[s.cDesc, s.placeholder]}>—</Text>
          )}
          <Text style={s.cQty}>{num(item?.quantity)}</Text>
          <Text style={s.cPrice}>{formatNaira(num(item?.unitPrice))}</Text>
          <Text style={s.cAmt}>{formatNaira(lineTotal(item))}</Text>
        </View>
      ))}

      <View style={s.totals} wrap={false}>
        <View style={s.totalRow}>
          <Text style={s.muted}>Subtotal</Text>
          <Text>{formatNaira(totals.subtotal)}</Text>
        </View>
        {totals.discount > 0 ? (
          <View style={s.totalRow}>
            <Text style={s.muted}>Discount</Text>
            <Text>-{formatNaira(totals.discount)}</Text>
          </View>
        ) : null}
        <View style={s.grand}>
          <Text>Total</Text>
          <Text>{formatNaira(totals.total)}</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={s.muted}>Amount paid</Text>
          <Text>{formatNaira(totals.paid)}</Text>
        </View>
        {totals.balance > 0 ? (
          <View style={s.totalRow}>
            <Text style={s.strong}>Balance due</Text>
            <Text style={s.strong}>{formatNaira(totals.balance)}</Text>
          </View>
        ) : null}
        <Text style={[s.status, isPaid ? s.paid : s.partial]}>
          {isPaid ? "PAID IN FULL" : "PART PAYMENT"}
        </Text>
      </View>

      {receipt.note ? (
        <View style={s.note} wrap={false}>
          <Text style={s.label}>Note</Text>
          <Text>{receipt.note}</Text>
        </View>
      ) : null}

      <Text style={s.footer} fixed>
        Thank you for your patronage — {BUSINESS.name}
      </Text>
      {/* Watermark last, so it lies over everything (incl. shaded boxes) — at
          this opacity text stays readable and it's harder to edit out. Uses
          the logo once one is set in lib/config.ts, otherwise the name. */}
      <View style={s.watermarkWrap} fixed>
        {BUSINESS.logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image style={s.watermarkLogo} src={`${assetBase}${BUSINESS.logo}`} />
        ) : (
          <Text style={s.watermarkText}>{BUSINESS.name.toUpperCase()}</Text>
        )}
      </View>
    </>
  );
}
