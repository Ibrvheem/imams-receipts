"use client";

// PDF rendering of the receipt. Only ever loaded via dynamic import, so the
// heavy react-pdf bundle is fetched the first time she downloads/shares.
import {
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { BUSINESS } from "@/lib/config";
import type { Receipt } from "../types";
import {
  PaymentSlipLayout,
  ReceiptLayout,
  styles,
  type LayoutPayment,
  type Primitives,
} from "./receipt-layout";

// Inter (in /public/fonts) includes the ₦ glyph; the built-in PDF fonts don't.
let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  const base = `${window.location.origin}/fonts`;
  Font.register({
    family: "Inter",
    fonts: [
      { src: `${base}/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Inter-Medium.ttf`, fontWeight: 500 },
      { src: `${base}/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Inter-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // Never hyphenate names or item descriptions.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const pdfPrimitives = { View, Text, Image } as unknown as Primitives;

export function ReceiptDocument({
  receipt,
  assetBase,
  payments,
}: {
  receipt: Receipt;
  assetBase: string;
  payments?: LayoutPayment[];
}) {
  return (
    <Document
      title={`Receipt ${receipt.receiptNumber}`}
      author={BUSINESS.name}
      creator={BUSINESS.name}
    >
      <Page size="A4" style={styles.page}>
        <ReceiptLayout
          receipt={receipt}
          P={pdfPrimitives}
          assetBase={assetBase}
          payments={payments}
        />
      </Page>
    </Document>
  );
}

const toFile = (blob: Blob, name: string) =>
  new File([blob], name, { type: "application/pdf" });

export async function buildReceiptPdf(receipt: Receipt, payments?: LayoutPayment[]) {
  registerFonts();
  const blob = await pdf(
    <ReceiptDocument receipt={receipt} assetBase={window.location.origin} payments={payments} />,
  ).toBlob();
  return toFile(blob, `Receipt-${receipt.receiptNumber}.pdf`);
}

export type SlipInput = Omit<
  React.ComponentProps<typeof PaymentSlipLayout>,
  "P" | "assetBase"
>;

export async function buildPaymentSlipPdf(slip: SlipInput) {
  registerFonts();
  const blob = await pdf(
    <Document title={`Payment ${slip.slipNumber}`} author={BUSINESS.name} creator={BUSINESS.name}>
      <Page size="A4" style={styles.page}>
        <PaymentSlipLayout {...slip} P={pdfPrimitives} assetBase={window.location.origin} />
      </Page>
    </Document>,
  ).toBlob();
  return toFile(blob, `Payment-${slip.slipNumber}.pdf`);
}
