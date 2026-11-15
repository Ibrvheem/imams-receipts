"use client";

// On-screen receipt: the shared layout rendered with divs at true A4 size (in
// pt), then scaled to fit whatever width the screen gives it. Same layout as
// the PDF, so what she sees is what she downloads.
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { ReceiptDraft } from "../types";
import {
  A4,
  ReceiptLayout,
  styles,
  type LayoutPayment,
  type Primitives,
  type Style,
} from "./receipt-layout";

const UNITLESS = new Set([
  "fontWeight",
  "lineHeight",
  "flex",
  "flexGrow",
  "flexShrink",
  "opacity",
]);
const SHORTHANDS: Record<string, [string, string]> = {
  paddingHorizontal: ["paddingLeft", "paddingRight"],
  paddingVertical: ["paddingTop", "paddingBottom"],
  marginHorizontal: ["marginLeft", "marginRight"],
  marginVertical: ["marginTop", "marginBottom"],
};

/** react-pdf style (numbers = pt) → CSS. */
function toCss(style?: Style | (Style | false | undefined)[]): CSSProperties {
  const list = Array.isArray(style) ? style : [style];
  const out: Record<string, string | number> = {};
  for (const st of list) {
    if (!st) continue;
    for (const [key, raw] of Object.entries(st)) {
      const value =
        typeof raw === "number" && !UNITLESS.has(key) ? `${raw}pt` : raw;
      if (key === "fontFamily") {
        out.fontFamily = "'Inter Receipt', sans-serif";
      } else if (SHORTHANDS[key]) {
        SHORTHANDS[key].forEach((k) => (out[k] = value));
      } else {
        out[key] = value;
      }
      // react-pdf draws a border from width alone; CSS also needs a style.
      const border = key.match(/^border(Top|Right|Bottom|Left)?Width$/);
      if (border) out[`border${border[1] ?? ""}Style`] = "solid";
    }
  }
  return out as CSSProperties;
}

const htmlPrimitives: Primitives = {
  View: ({ style, children }) => (
    <div style={{ display: "flex", flexDirection: "column", ...toCss(style) }}>
      {children}
    </div>
  ),
  Text: ({ style, children }) => <div style={toCss(style)}>{children}</div>,
  // eslint-disable-next-line @next/next/no-img-element
  Image: ({ style, src }) => <img src={src} alt="" style={toCss(style)} />,
};

const pageCss: CSSProperties = {
  ...toCss(styles.page),
  position: "relative",
  width: `${A4.width}pt`,
  minHeight: `${A4.height}pt`,
  letterSpacing: "normal",
  overflowWrap: "anywhere",
};

export function ReceiptPreview({
  receipt,
  payments,
}: {
  receipt: ReceiptDraft;
  payments?: LayoutPayment[];
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      // Hidden (e.g. the Details tab is showing) — keep the last fit.
      if (outer.current.clientWidth === 0) return;
      const scale = Math.min(
        1,
        outer.current.clientWidth / inner.current.offsetWidth,
      );
      setFit({ scale, height: inner.current.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className="mx-auto w-full overflow-hidden rounded-md bg-white shadow-[0_24px_64px_oklch(0_0_0/0.5)]"
      style={{
        maxWidth: `${A4.width}pt`,
        height: fit?.height,
        visibility: fit ? "visible" : "hidden",
      }}
    >
      <div
        ref={inner}
        style={{
          ...pageCss,
          transform: `scale(${fit?.scale ?? 1})`,
          transformOrigin: "top left",
        }}
      >
        <ReceiptLayout receipt={receipt} P={htmlPrimitives} payments={payments} />
      </div>
    </div>
  );
}
