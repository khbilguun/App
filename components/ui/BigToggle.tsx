"use client";

import { motion } from "motion/react";
import { CheckCircle } from "./CheckCircle";

export function BigToggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={on}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChange(!on)}
      className="flex min-h-[60px] w-full items-center gap-4 px-4 py-3 text-left"
    >
      <CheckCircle on={on} />
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
    </motion.button>
  );
}
