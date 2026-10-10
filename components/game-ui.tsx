"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeedbackProps {
  status: "idle" | "correct" | "wrong";
  correctText?: string;
  wrongText?: string;
}

export function Feedback({ status, correctText = "太棒了！", wrongText = "再试一次哦" }: FeedbackProps) {
  return (
    <AnimatePresence mode="wait">
      {status !== "idle" && (
        <motion.div
          key={status}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2 font-display text-lg font-extrabold shadow-pop",
            status === "correct" ? "bg-mint text-ink" : "bg-bubble text-white"
          )}
          style={{ borderWidth: 3, borderColor: "var(--ink)", borderStyle: "solid" }}
        >
          <span className="text-2xl">{status === "correct" ? "🎉" : "🤔"}</span>
          {status === "correct" ? correctText : wrongText}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Floating stars burst used to reward a correct answer. */
export function StarBurst({ count = 6, color = "#ffd166" }: { count?: number; color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="animate-rise-note absolute text-2xl"
          style={{
            left: `${15 + i * (70 / count)}%`,
            bottom: 0,
            animationDelay: `${i * 0.07}s`,
            color,
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

interface ScorePillProps {
  label: string;
  value: string | number;
  emoji: string;
  color?: string;
}

export function ScorePill({ label, value, emoji, color = "var(--sky)" }: ScorePillProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-white px-3 py-1.5 shadow-pop">
      <span className="grid h-8 w-8 place-items-center rounded-xl text-lg" style={{ background: color }}>
        {emoji}
      </span>
      <div className="leading-none">
        <div className="font-display text-lg font-extrabold text-ink">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
