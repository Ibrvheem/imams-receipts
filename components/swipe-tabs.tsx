"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion/stagger-reveal";

/** Tab pages in left-to-right order (matches the phone tab bar). */
const ORDER = ["/home", "/receipts", "/customers"];

// Direction of the swipe that started the current navigation (1 = to the
// right-hand tab, -1 = left). Module scope survives the route change.
let pendingDirection = 0;

const IGNORE =
  "input, textarea, select, [contenteditable], [role=dialog], [data-no-swipe], [data-radix-popper-content-wrapper]";

/** True if the touch began inside something that scrolls sideways itself. */
function insideHorizontalScroller(el: Element | null) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth) {
      return true;
    }
  }
  return false;
}

/**
 * Phones: swipe left/right on a tab page to move to the neighbouring tab.
 * Wraps the page content so the new page slides in from the swipe side.
 */
export function SwipeTabs({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const index = ORDER.indexOf(pathname);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    if (index < 0) return;
    const phone = window.matchMedia("(max-width: 767px)");

    const onStart = (e: TouchEvent) => {
      start.current = null;
      if (!phone.matches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Leave the screen edges to the browser's own back/forward gesture.
      if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) return;
      const target = e.target as Element;
      if (target.closest(IGNORE) || insideHorizontalScroller(target)) return;
      start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    };

    const onEnd = (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - s.x;
      const dy = touch.clientY - s.y;
      // A deliberate, mostly-horizontal flick — not a scroll.
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - s.t > 600) return;
      const direction = dx < 0 ? 1 : -1; // finger moves left → next tab
      const next = ORDER[index + direction];
      if (!next) return;
      pendingDirection = direction;
      router.push(next);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [index, router]);

  return (
    <PageEnter key={pathname} reduce={!!reduce}>
      {children}
    </PageEnter>
  );
}

/** Mounts once per page; slides in only if a swipe started the navigation. */
function PageEnter({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  const [direction] = useState(() => pendingDirection);
  useEffect(() => {
    pendingDirection = 0;
  }, []);
  return (
    <motion.div
      className="flex flex-1 flex-col gap-4"
      initial={direction ? { opacity: 0, x: reduce ? 0 : direction * 28 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
