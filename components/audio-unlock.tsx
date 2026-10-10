"use client";

import { Play, Sparkles } from "lucide-react";
import { useAudio } from "@/components/providers";
import { Mascot } from "@/components/mascot";

export function AudioUnlock() {
  const { ready, unlock } = useAudio();
  if (ready) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-mint px-4 py-2 font-display text-sm font-extrabold text-ink shadow-pop">
        <Sparkles className="h-4 w-4" /> 真实钢琴音源已就绪
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void unlock()}
      className="btn-pop group inline-flex items-center gap-3 bg-grape px-6 py-3 font-display text-lg font-extrabold text-white"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white">
        <Play className="h-4 w-4 fill-ink text-ink" />
      </span>
      点我开始，先听一段真实钢琴
      <Mascot size={30} className="group-hover:animate-wiggle" />
    </button>
  );
}
