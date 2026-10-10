"use client";

import Link from "next/link";
import { Home, Star } from "lucide-react";
import { useAudio, useProgress } from "@/components/providers";
import { VolumeControl } from "@/components/volume-control";
import { Mascot } from "@/components/mascot";

export function TopBar({ title, emoji }: { title: string; emoji: string }) {
  const { progress } = useProgress();
  const { ready } = useAudio();
  return (
    <header className="sticky top-0 z-30 mb-6 border-b-4 border-ink/10 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink bg-white shadow-pop transition-transform group-hover:-rotate-6">
            <Home className="h-5 w-5 text-ink" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg font-extrabold text-ink">
              {emoji} {title}
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground">音乐小星球 · Music Planet</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border-2 border-ink/80 bg-sunny px-3 py-1.5 shadow-pop sm:flex">
            <Star className="h-4 w-4 fill-ink text-ink" />
            <span className="font-display text-sm font-extrabold text-ink">{progress.stars}</span>
          </div>
          <VolumeControl />
          <div className="hidden md:block">
            <Mascot size={44} className={ready ? "animate-floaty" : ""} />
          </div>
        </div>
      </div>
    </header>
  );
}
