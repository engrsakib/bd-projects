// src/components/common/tooltip.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Side = "top" | "bottom" | "left" | "right";

type Props = {
  children: React.ReactNode;          // trigger
  content: React.ReactNode;           // bubble content
  /** Preferred side; actual side auto-adjusts to fit viewport */
  side?: Side;
  /** Gap between trigger and bubble (px) */
  offset?: number;
  /** Desktop content width. Accepts "xs" | "sm" | "md" or a pixel number. */
  width?: "xs" | "sm" | "md" | number;
  className?: string;                 // extra class for the bubble
};

const WIDTH_MAP = {
  xs: 320, // Tailwind max-w-xs ≈ 20rem
  sm: 384, // 24rem
  md: 448, // 28rem
};

function getPixelWidth(width: Props["width"]) {
  if (typeof width === "number") return width;
  if (!width) return WIDTH_MAP.xs;
  return WIDTH_MAP[width] ?? WIDTH_MAP.xs;
}

function computePosition(
  side: Side,
  triggerRect: DOMRect,
  bubbleSize: { w: number; h: number },
  offset: number,
  viewportPadding = 8,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Candidate positions
  const variants: Side[] = [
    side,
    ...(side !== "bottom" ? (["bottom"] as Side[]) : []),
    ...(side !== "top" ? (["top"] as Side[]) : []),
    ...(side !== "right" ? (["right"] as Side[]) : []),
    ...(side !== "left" ? (["left"] as Side[]) : []),
  ];

  for (const s of variants) {
    let top = 0;
    let left = 0;

    if (s === "top") {
      top = triggerRect.top - bubbleSize.h - offset;
      left = triggerRect.left + triggerRect.width / 2 - bubbleSize.w / 2;
    } else if (s === "bottom") {
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - bubbleSize.w / 2;
    } else if (s === "left") {
      top = triggerRect.top + triggerRect.height / 2 - bubbleSize.h / 2;
      left = triggerRect.left - bubbleSize.w - offset;
    } else {
      // right
      top = triggerRect.top + triggerRect.height / 2 - bubbleSize.h / 2;
      left = triggerRect.right + offset;
    }

    // Clamp into viewport horizontally/vertically with padding
    const fitsHorizontally = left >= viewportPadding && left + bubbleSize.w <= vw - viewportPadding;
    const fitsVertically = top >= viewportPadding && top + bubbleSize.h <= vh - viewportPadding;

    if ((s === "top" || s === "bottom") ? (fitsHorizontally && top >= viewportPadding && top + bubbleSize.h <= vh - viewportPadding)
                                        : (fitsVertically && left >= viewportPadding && left + bubbleSize.w <= vw - viewportPadding)) {
      return { side: s, top: Math.max(viewportPadding, Math.min(top, vh - viewportPadding - bubbleSize.h)), left: Math.max(viewportPadding, Math.min(left, vw - viewportPadding - bubbleSize.w)) };
    }
  }

  // Fallback: bottom + clamped
  const fbTop = Math.min(vh - viewportPadding - bubbleSize.h, Math.max(viewportPadding, triggerRect.bottom + offset));
  const fbLeft = Math.min(vw - viewportPadding - bubbleSize.w, Math.max(viewportPadding, triggerRect.left + triggerRect.width / 2 - bubbleSize.w / 2));
  return { side: "bottom" as Side, top: fbTop, left: fbLeft };
}

export default function Tooltip({
  children,
  content,
  side = "top",
  offset = 10,
  width = "xs",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; side: Side }>({
    top: 0,
    left: 0,
    side,
  });

  const desktopWidth = getPixelWidth(width);

  // open on hover/focus
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  // mount portal after client hydration
  useEffect(() => setMounted(true), []);

  // Recompute on open/resize/scroll
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) return;

      const rect = trigger.getBoundingClientRect();

      // Temporarily set width to target desktop width so measurements are stable.
      const w = Math.min(desktopWidth, window.innerWidth - 16); // leave a little padding
      const h = bubble.offsetHeight; // content-driven height

      const pos = computePosition(side, rect, { w, h }, offset, 8);
      setCoords(pos);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, side, offset, desktopWidth]);

  const caretBase =
    "absolute w-3 h-3 rotate-45 bg-white border-b border-r"; // caret gets border to match bubble

  const caretStyle: Record<Side, string> = {
    top: "left-1/2 -bottom-[6px] -translate-x-1/2",
    bottom: "left-1/2 -top-[6px] -translate-x-1/2",
    left: "-right-[6px] top-1/2 -translate-y-1/2",
    right: "-left-[6px] top-1/2 -translate-y-1/2",
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      {children}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={bubbleRef}
                initial={{ opacity: 0, y: coords.side === "top" ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.side === "top" ? -6 : 6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role="tooltip"
                aria-hidden={!open}
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  width: Math.min(desktopWidth, window.innerWidth - 16), // full xs width on desktop; clamps on small screens
                  maxWidth: "90vw",
                  zIndex: 9999,
                }}
                className={[
                  // container visuals
                  "bg-white text-secondary shadow-xl border rounded-2xl px-4 py-3",
                  // typography: bigger & comfy line length
                  "text-[13px] md:text-[14px] leading-5",
                  // accent border that matches screenshot vibe
                  "border-primary/40",
                  className,
                ].join(" ")}
              >
                <div className="whitespace-pre-wrap break-words">
                  {content}
                </div>

                {/* caret */}
                <div
                  className={[
                    caretBase,
                    "border-primary/40",
                    caretStyle[coords.side],
                  ].join(" ")}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
