"use client";

import { motion } from "motion/react";

export function CheckCircle({ on, size = 30 }: { on: boolean; size?: number }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
        on ? "border-accent bg-accent text-accent-ink" : "border-border bg-transparent"
      }`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </motion.svg>
    </span>
  );
}
