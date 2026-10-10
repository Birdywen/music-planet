"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, RotateCw, Star } from "lucide-react";
import { MODES } from "@/lib/modes";
import { useProgress } from "@/components/providers";
import { BADGES } from "@/components/providers";
import { Mascot } from "@/components/mascot";
import { AudioUnlock } from "@/components/audio-unlock";
import { VolumeControl } from "@/components/volume-control";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { progress, reset } = useProgress();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <span className="animate-floaty text-2xl">🎵</span> 音乐小星球
        </div>
        <VolumeControl />
      </div>

      <section className="card-pop relative overflow-hidden bg-gradient-to-br from-white via-white to-secondary p-6 sm:p-9">
        <div className="bubble-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-xl text-center sm:text-left">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sunny px-3 py-1 font-display text-xs font-extrabold text-ink">
              <Star className="h-3.5 w-3.5 fill-ink" /> 真实钢琴音源 · 适合小朋友
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              和 <span className="text-grape">小星</span> 一起，
              <br />
              玩着学会音乐！
            </h1>
            <p className="mt-3 text-base font-semibold text-muted-foreground">
              节奏、音高、认音、调式、视唱练耳 —— 每个音符都是真实录制的三角钢琴声音。
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <AudioUnlock />
            </div>
          </div>
          <div className="shrink-0">
            <Mascot size={200} mood={progress.stars > 0 ? "cheer" : "happy"} className="animate-floaty" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card-pop flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">已获得星星</div>
            <div className="font-display text-4xl font-extrabold text-ink">{progress.stars}</div>
          </div>
          <div className="text-5xl">⭐</div>
        </div>
        <div className="card-pop flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">最佳连击</div>
            <div className="font-display text-4xl font-extrabold text-ink">{progress.bestStreak}</div>
          </div>
          <div className="text-5xl">🔥</div>
        </div>
        <div className="card-pop flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">练习次数</div>
            <div className="font-display text-4xl font-extrabold text-ink">{progress.sessions}</div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink bg-white shadow-pop transition-transform hover:-rotate-12"
            aria-label="重置进度"
          >
            <RotateCw className="h-5 w-5 text-ink" />
          </button>
        </div>
      </section>

      <section className="mt-6 card-pop p-5">
        <h2 className="mb-3 font-display text-xl font-extrabold text-ink">🏅 我的勋章</h2>
        <div className="flex flex-wrap gap-3">
          {BADGES.map((b) => {
            const earned = progress.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2 font-display text-sm font-extrabold shadow-pop",
                  earned ? "bg-sunny text-ink" : "bg-muted text-muted-foreground opacity-60"
                )}
              >
                <span className="text-xl">{earned ? b.emoji : "🔒"}</span>
                {b.label}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl font-extrabold text-ink">🎮 选一个玩法开始吧</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m, i) => {
            const earned = progress.byMode[m.id] || 0;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 }}
              >
                <Link href={m.href} className="block h-full">
                  <div className="card-pop group flex h-full flex-col p-6 transition-transform hover:-translate-y-1.5">
                    <div
                      className="mb-3 grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink text-3xl shadow-pop transition-transform group-hover:rotate-6"
                      style={{ background: m.color }}
                    >
                      {m.emoji}
                    </div>
                    <div className="font-display text-2xl font-extrabold text-ink">{m.title}</div>
                    <p className="mt-1 flex-1 text-sm font-semibold text-muted-foreground">{m.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-display text-xs font-extrabold text-ink">
                        <Star className="h-3 w-3 fill-grape text-grape" /> {earned} 星
                      </span>
                      <span className="inline-flex items-center gap-1 font-display text-sm font-extrabold text-grape">
                        开始 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs font-semibold text-muted-foreground">
        音乐小星球 · 音源：FluidR3 GM 真实三角钢琴与木鱼采样 · 为小小音乐家设计 🎹
      </footer>
    </main>
  );
}
