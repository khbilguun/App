"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

const RAYS = 12;

/** Өдөр бүрэн болоход: нар шиг тэлэх цагираг + цацраг + check. ~1.6 сек. */
export function Celebration({ show, dayNumber, onDone }: { show: boolean; dayNumber: number; onDone: () => void }) {
  useEffect(() => {
    if (!show) return;
    try {
      navigator.vibrate?.([12, 40, 18]);
    } catch {}
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="celebrate"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <div className="relative flex flex-col items-center">
            <div className="relative flex h-40 w-40 items-center justify-center">
              {/* тэлэх цагираг */}
              <motion.span
                className="absolute inset-0 rounded-full border-4 border-accent"
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              {/* нарны цацраг */}
              {Array.from({ length: RAYS }).map((_, i) => {
                const a = (i / RAYS) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-full bg-accent"
                    initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                    animate={{ x: Math.cos(a) * 92, y: Math.sin(a) * 92, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.12, ease: [0.2, 0.7, 0.3, 1] }}
                  />
                );
              })}
              {/* check */}
              <motion.div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    d="M20 6 9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.18 }}
                  />
                </svg>
              </motion.div>
            </div>
            <motion.div
              className="mt-2 text-center"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-[22px] font-bold">Өдөр {dayNumber} бүрэн</div>
              <div className="text-[15px] text-muted">Зун нэг өдрөөр ойртлоо</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
