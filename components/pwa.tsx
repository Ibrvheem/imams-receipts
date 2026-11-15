"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Registers the service worker (production only — it would cache dev builds). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not fatal: the app works the same, just without the offline page.
    });
  }, []);
  return null;
}

type InstallEvent = Event & { prompt: () => Promise<void> };

const DISMISS_KEY = "install-hint-dismissed";
const noSubscribe = () => () => {};

function readEnv() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISS_KEY) === "1";
  } catch {}
  return `${standalone ? 1 : 0}${ios ? 1 : 0}${dismissed ? 1 : 0}`;
}

/**
 * Small card on Home suggesting she installs the app. Android/desktop Chrome:
 * an Install button. iPhone (no install prompt): Share → Add to Home Screen.
 */
export function InstallHint() {
  const env = useSyncExternalStore(noSubscribe, readEnv, () => "100");
  const [standalone, ios, wasDismissed] = env.split("").map((c) => c === "1");
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // show our own button instead of the mini-infobar
      setPromptEvent(e as InstallEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || wasDismissed || dismissed || (!promptEvent && !ios)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 pr-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Install the app</p>
        {promptEvent ? (
          <p className="text-muted-foreground">Open it from your home screen, full screen.</p>
        ) : (
          <p className="text-muted-foreground">
            Tap <Share className="inline size-3.5 -translate-y-px" aria-label="Share" /> then{" "}
            <span className="text-foreground">Add to Home Screen</span>.
          </p>
        )}
      </div>
      {promptEvent && (
        <Button
          size="sm"
          className="h-9 shrink-0"
          onClick={async () => {
            await promptEvent.prompt();
            setPromptEvent(null);
          }}
        >
          <Download /> Install
        </Button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute top-1 right-1 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
