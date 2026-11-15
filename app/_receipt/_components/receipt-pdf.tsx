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
import { ReceiptLayout, styles, type Primitives } from "./receipt-layout";

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
}: {
  receipt: Receipt;
  assetBase: string;
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
        />
      </Page>
    </Document>
  );
}

export async function buildReceiptPdf(receipt: Receipt) {
  registerFonts();
  const blob = await pdf(
    <ReceiptDocument receipt={receipt} assetBase={window.location.origin} />,
  ).toBlob();
  return new File([blob], `Receipt-${receipt.receiptNumber}.pdf`, {
    type: "application/pdf",
  });
}
