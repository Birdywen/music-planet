"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Play, RefreshCw } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Feedback, ScorePill } from "@/components/game-ui";
import { useProgress } from "@/components/providers";
import { playSampleKey, resumeAudio } from "@/lib/audio-engine";
import { makeNote, randInt, sampleKeyFromMidi } from "@/lib/music";
import { cn } from "@/lib/utils";

interface Pair {
  low: number;
  high: number;
}

export default function PitchPage() {
  const { addStars, recordStreak } = useProgress();
  const [pair, setPair] = useState<Pair>({ low: 60, high: 67 });
  const [order, setOrder] = useState<[number, number]>([60, 67]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gap, setGap] = useState(4);

  const makePair = useCallback((g: number) => {
    const root = randInt(60, 76);
    const low = root;
    const high = Math.min(84, root + g);
    setPair({ low, high });
    const first = Math.random() < 0.5;
    setOrder(first ? [low, high] : [high, low]);
    setStatus("idle");
    setAnswered(false);
  }, []);

  useEffect(() => {
    makePair(gap);
  }, [makePair, gap]);

  const playPair = useCallback(async () => {
    await resumeAudio();
    void playSampleKey(sampleKeyFromMidi(order[0]), { gain: 0.9 });
    window.setTimeout(() => void playSampleKey(sampleKeyFromMidi(order[1]), { gain: 0.9 }), 750);
  }, [order]);

  const answer = useCallback(
    (choice: "first" | "second") => {
      if (answered) return;
      setAnswered(true);
      const firstIsHigher = order[0] > order[1];
      const correct = (choice === "first" && firstIsHigher) || (choice === "second" && !firstIsHigher);
      if (correct) {
        setStatus("correct");
        const ns = streak + 1;
        setStreak(ns);
        recordStreak(ns);
        addStars("pitch", 1);
        window.setTimeout(() => makePair(gap), 1000);
      } else {
        setStatus("wrong");
        setStreak(0);
        window.setTimeout(() => {
          setStatus("idle");
          setAnswered(false);
        }, 900);
      }
    },
    [answered, order, streak, addStars, recordStreak, makePair, gap]
  );

  const playOne = (midi: number) => {
    void resumeAudio();
    void playSampleKey(sampleKeyFromMidi(midi), { gain: 0.9 });
  };

  const gaps: { label: string; value: number; emoji: string }[] = [
    { label: "很近", value: 2, emoji: "🐣" },
    { label: "中等", value: 4, emoji: "🐰" },
    { label: "很远", value: 7, emoji: "🦒" },
    { label: "超远", value: 12, emoji: "🦕" },
  ];

  return (
    <div className="min-h-screen">
      <TopBar title="音高精灵" emoji="🎈" />
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="card-pop mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {gaps.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGap(g.value)}
                className={cn(
                  "rounded-2xl border-2 border-ink px-3 py-2 font-display text-sm font-extrabold shadow-pop",
                  gap === g.value ? "bg-sky text-ink" : "bg-white text-ink"
                )}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
          <ScorePill label="连击" value={streak} emoji="🔥" color="var(--tangerine)" />
        </div>

        <div className="card-pop relative overflow-hidden p-8 text-center">
          <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-ink">🎈 哪个音更高呢？</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">先听两个音，再选一选</p>

            <button
              type="button"
              onClick={() => void playPair()}
              className="btn-pop mt-6 inline-flex items-center gap-2 bg-grape px-8 py-4 font-display text-xl font-extrabold text-white"
            >
              <Play className="h-6 w-6 fill-white" /> 播放两个音
            </button>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => answer("first")}
                className="card-pop group flex flex-col items-center gap-1 bg-white p-6 transition-transform hover:-translate-y-1"
              >
                <ArrowUp className="h-10 w-10 text-mint transition-transform group-hover:-translate-y-1" />
                <span className="font-display text-xl font-extrabold text-ink">第 1 个更高</span>
                <span className="mt-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">选它</span>
              </button>
              <button
                type="button"
                onClick={() => answer("second")}
                className="card-pop group flex flex-col items-center gap-1 bg-white p-6 transition-transform hover:-translate-y-1"
              >
                <ArrowDown className="h-10 w-10 text-bubble transition-transform group-hover:translate-y-1" />
                <span className="font-display text-xl font-extrabold text-ink">第 2 个更高</span>
                <span className="mt-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">选它</span>
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => playOne(order[0])}
                className="btn-pop bg-secondary px-4 py-2 font-display text-sm font-extrabold text-ink"
              >
                🔊 只听第 1 个
              </button>
              <button
                type="button"
                onClick={() => playOne(order[1])}
                className="btn-pop bg-secondary px-4 py-2 font-display text-sm font-extrabold text-ink"
              >
                🔊 只听第 2 个
              </button>
              <button
                type="button"
                onClick={() => makePair(gap)}
                className="btn-pop inline-flex items-center gap-1 bg-white px-4 py-2 font-display text-sm font-extrabold text-ink"
              >
                <RefreshCw className="h-4 w-4" /> 换一组
              </button>
            </div>

            <div className="mt-6 flex min-h-[54px] items-center justify-center">
              <Feedback status={status} correctText="对啦！耳朵很灵敏" wrongText="再听一遍，比比看" />
            </div>

            {answered && (
              <p className="mt-2 font-display text-lg font-extrabold text-ink">
                {makeNote(order[0], true).name} 和 {makeNote(order[1], true).name}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
