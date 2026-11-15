"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./stagger-reveal";

const DURATION = 0.2;

/**
 * Height + opacity collapse for form sections (200ms strong ease-out).
 * Interruptible: toggling mid-animation retargets from the current height.
 * Reduced motion: height snaps, only a short fade remains.
 * Clips only while animating, so focus rings aren't cut off when open.
 */
export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  /** Applied inside the clipped area — put spacing (e.g. "pt-4") here, not on siblings. */
  className?: string;
}) {
  // Content already open on first render appears without animating (and
  // so never clips); anything opened later starts clipped.
  const [openOnMount] = useState(open);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <CollapseBody
          key="collapse"
          animateIn={!openOnMount}
          className={className}
        >
          {children}
        </CollapseBody>
      )}
    </AnimatePresence>
  );
}

/**
 * The animated body on its own, for lists: render inside your own
 * <AnimatePresence initial={false}> with a stable key per item so items
 * expand in when added and collapse out when removed.
 */
export function CollapseBody({
  animateIn,
  className,
  children,
}: {
  animateIn: boolean;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [clip, setClip] = useState(animateIn);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{
        height: { duration: reduce ? 0 : DURATION, ease: EASE_OUT },
        opacity: { duration: reduce ? 0.15 : DURATION, ease: EASE_OUT },
      }}
      onAnimationStart={() => setClip(true)}
      onAnimationComplete={() => setClip(false)}
      style={{ overflow: clip ? "hidden" : "visible" }}
    >
      <div className={className}>{children}</div>
    </motion.div>
  );
}
