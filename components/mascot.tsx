"use client";

import { cn } from "@/lib/utils";

interface MascotProps {
  size?: number;
  className?: string;
  mood?: "happy" | "cheer" | "think";
}

/** 小星 — the app mascot: a friendly singing star-cat with headphones. */
export function Mascot({ size = 140, className, mood = "happy" }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn("drop-shadow-[0_8px_0_rgba(27,42,74,0.18)]", className)}
      role="img"
      aria-label="小星"
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#ff9f45" />
        </linearGradient>
        <linearGradient id="hpGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#4cc9f0" />
        </linearGradient>
      </defs>

      <path
        d="M100 12 L124 72 L190 78 L140 122 L156 188 L100 152 L44 188 L60 122 L10 78 L76 72 Z"
        fill="url(#bodyGrad)"
        stroke="#1b2a4a"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <path d="M62 34 L74 6 L92 30 Z" fill="#ffd166" stroke="#1b2a4a" strokeWidth="6" strokeLinejoin="round" />
      <path d="M138 34 L126 6 L108 30 Z" fill="#ffd166" stroke="#1b2a4a" strokeWidth="6" strokeLinejoin="round" />

      <path d="M40 96 Q100 44 160 96" fill="none" stroke="url(#hpGrad)" strokeWidth="12" strokeLinecap="round" />
      <rect x="26" y="88" width="24" height="40" rx="12" fill="#7c4dff" stroke="#1b2a4a" strokeWidth="6" />
      <rect x="150" y="88" width="24" height="40" rx="12" fill="#7c4dff" stroke="#1b2a4a" strokeWidth="6" />

      {mood === "cheer" ? (
        <>
          <path d="M74 104 Q84 96 94 104" fill="none" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
          <path d="M106 104 Q116 96 126 104" fill="none" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="84" cy="106" r="8" fill="#1b2a4a" />
          <circle cx="116" cy="106" r="8" fill="#1b2a4a" />
          <circle cx="87" cy="103" r="3" fill="#fff" />
          <circle cx="119" cy="103" r="3" fill="#fff" />
        </>
      )}
      {mood === "think" ? (
        <path d="M104 128 Q112 132 120 126" fill="none" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
      ) : (
        <path d="M92 124 Q100 138 108 124" fill="none" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
      )}

      <circle cx="66" cy="122" r="8" fill="#ff6fb5" opacity="0.55" />
      <circle cx="134" cy="122" r="8" fill="#ff6fb5" opacity="0.55" />

      <g transform="translate(140 20)">
        <path d="M8 4 L8 34" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="2" cy="36" rx="9" ry="7" fill="#ff6fb5" stroke="#1b2a4a" strokeWidth="5" />
        <path d="M8 4 Q22 8 20 20" fill="none" stroke="#1b2a4a" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
