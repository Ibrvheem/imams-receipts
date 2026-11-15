"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

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

export type PdfBuilder = () => Promise<File>;

/**
 * Download / share PDFs. `busy` holds the key of the document being built
 * ("receipt", or a payment id for slips) and the action.
 */
export function usePdfActions() {
  const [busy, setBusy] = useState<{ key: string; action: Action } | null>(null);
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, () => false);

  // Warm up the PDF code in the background so the first tap is quick.
  useEffect(() => {
    const warm = setTimeout(() => void import("../_components/receipt-pdf"), 800);
    return () => clearTimeout(warm);
  }, []);

  const run = async (key: string, action: Action, build: PdfBuilder) => {
    setBusy({ key, action });
    try {
      const file = await build();
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
          toast(`${file.name.replace(/\.pdf$/, "")} is ready`, {
            action: { label: "Share", onClick: () => void share() },
            duration: 15000,
          });
        }
      } else {
        saveFile(file);
        toast.success("Downloaded");
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
    download: (key: string, build: PdfBuilder) => run(key, "download", build),
    share: (key: string, build: PdfBuilder) => run(key, "share", build),
  };
}
