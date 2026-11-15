"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { Receipt } from "../types";

type Action = "download" | "share";

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

/** Download / share a saved receipt as a PDF. */
export function useReceiptPdf(receipt: Receipt) {
  const [busy, setBusy] = useState<Action | null>(null);
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, () => false);

  // Warm up the PDF code in the background so the first tap is quick.
  useEffect(() => {
    const warm = setTimeout(() => void import("../_components/receipt-pdf"), 800);
    return () => clearTimeout(warm);
  }, []);

  const run = async (action: Action) => {
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
  };

  return {
    busy,
    canShare,
    download: () => run("download"),
    share: () => run("share"),
  };
}
