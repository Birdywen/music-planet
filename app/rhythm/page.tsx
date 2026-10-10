"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hand, Play, RefreshCw, Square } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Feedback, ScorePill, StarBurst } from "@/components/game-ui";
import { useProgress } from "@/components/providers";
import { getAudioContext, playPercussion, resumeAudio, startMetronome, type MetronomeHandle } from "@/lib/audio-engine";
import { RHYTHM_CELLS, type RhythmCell, shuffle } from "@/lib/music";
import { cn } from "@/lib/utils";

interface PatternDef {
  id: string;
  name: string;
  emoji: string;
  cells: RhythmCell[];
}

const C = (id: string) => RHYTHM_CELLS.find((c) => c.id === id)!;

const PATTERNS: PatternDef[] = [
  { id: "p1", name: "稳稳的四拍", emoji: "🐢", cells: [C("q"), C("q"), C("q"), C("q")] },
  { id: "p2", name: "小兔子跑跑", emoji: "🐰", cells: [C("qq"), C("qq"), C("q"), C("q")] },
  { id: "p3", name: "长音与短音", emoji: "🦒", cells: [C("h"), C("q"), C("q")] },
  { id: "p4", name: "十六分音符雨", emoji: "🌧️", cells: [C("e4"), C("e4"), C("qq"), C("q")] },
  { id: "p5", name: "摇一摇附点", emoji: "🍍", cells: [C("dotted"), C("q"), C("q"), C("q")] },
  { id: "p6", name: "呼吸与停顿", emoji: "😮‍💨", cells: [C("q"), C("rest"), C("qq"), C("h")] },
];

const BARS = 2;
const BEATS_PER_BAR = 4;
const TOTAL_BEATS = BARS * BEATS_PER_BAR;

interface Onset {
  beat: number;
  accent: boolean;
  hit: boolean;
}

export default function RhythmPage() {
  const { addStars, recordStreak } = useProgress();
  const [patternId, setPatternId] = useState("p1");
  const [bpm, setBpm] = useState(80);
  const [playing, setPlaying] = useState(false);
  const [tapping, setTapping] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<{ hits: number; total: number } | null>(null);
  const [burstKey, setBurstKey] = useState(0);

  const pattern = useMemo(() => PATTERNS.find((p) => p.id === patternId)!, [patternId]);

  const onsets = useMemo<Onset[]>(() => {
    const list: Onset[] = [];
    for (let bar = 0; bar < BARS; bar++) {
      let b = bar * BEATS_PER_BAR;
      for (const cell of pattern.cells) {
        for (const off of cell.pattern) {
          const at = b + off;
          list.push({ beat: at, accent: Math.abs(at % BEATS_PER_BAR) < 1e-6, hit: false });
        }
        b += cell.beats;
      }
    }
    return list;
  }, [pattern]);

  const beatDur = 60 / bpm;
  const totalDur = TOTAL_BEATS * beatDur;

  const metroRef = useRef<MetronomeHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const onsetsRef = useRef<Onset[]>([]);
  const hitsRef = useRef(0);
  const [hits, setHits] = useState(0);

  const stopAll = useCallback(() => {
    metroRef.current?.stop();
    metroRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setTapping(false);
    setBeat(-1);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const loopRef = useRef(0);
  const tick = useCallback(() => {
    const c = getAudioContext();
    const elapsed = c.currentTime - startRef.current;
    if (elapsed < 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const loopElapsed = elapsed % totalDur;
    const currentBeat = Math.floor(loopElapsed / beatDur);
    setBeat(currentBeat);
    const loopCount = Math.floor(elapsed / totalDur);
    if (loopCount > loopRef.current) {
      loopRef.current = loopCount;
    }
    if (elapsed >= totalDur * BARS) {
      const total = onsetsRef.current.length;
      setResult({ hits: hitsRef.current, total });
      const ratio = total ? hitsRef.current / total : 0;
      if (ratio >= 0.85) {
        setStatus("correct");
        setBurstKey((k) => k + 1);
        const ns = streak + 1;
        setStreak(ns);
        recordStreak(ns);
        addStars("rhythm", 2);
      } else {
        setStatus("wrong");
        setStreak(0);
      }
      stopAll();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [beatDur, totalDur, streak, recordStreak, addStars, stopAll]);

  const startTap = useCallback(async () => {
    await resumeAudio();
    stopAll();
    setResult(null);
    setStatus("idle");
    hitsRef.current = 0;
    setHits(0);
    onsetsRef.current = onsets.map((o) => ({ ...o }));
    loopRef.current = 0;
    const c = getAudioContext();
    startRef.current = c.currentTime + 0.25;
    metroRef.current = startMetronome(bpm, BEATS_PER_BAR);
    setTapping(true);
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [onsets, bpm, stopAll, tick]);

  const tap = useCallback(() => {
    if (!tapping) return;
    const c = getAudioContext();
    const elapsed = c.currentTime - startRef.current;
    if (elapsed < -0.2) return;
    void playPercussion(false);
    let best = -1;
    let bestDiff = Infinity;
    onsetsRef.current.forEach((o, i) => {
      if (o.hit) return;
      const diff = Math.abs(elapsed - o.beat * beatDur);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    });
    if (best >= 0 && bestDiff <= 0.22) {
      onsetsRef.current[best].hit = true;
      hitsRef.current += 1;
      setHits(hitsRef.current);
    }
  }, [tapping, beatDur]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (tapping) tap();
        else void startTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tapping, tap, startTap]);

  const listenPattern = useCallback(async () => {
    await resumeAudio();
    stopAll();
    setResult(null);
    setStatus("idle");
    const c = getAudioContext();
    const t0 = c.currentTime + 0.2;
    onsets.forEach((o) => {
      void playPercussion(o.accent, t0 + o.beat * beatDur);
    });
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), (TOTAL_BEATS * beatDur + 0.6) * 1000);
  }, [onsets, beatDur, stopAll]);

  const randomPattern = () => {
    const others = shuffle(PATTERNS.filter((p) => p.id !== patternId));
    setPatternId(others[0].id);
    setResult(null);
    setStatus("idle");
  };

  return (
    <div className="min-h-screen">
      <TopBar title="节奏拍拍" emoji="🥁" />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="card-pop mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-extrabold text-ink">速度</span>
            <input
              type="range"
              min={50}
              max={130}
              step={5}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="h-2 w-40 cursor-pointer accent-tangerine"
              aria-label="速度"
            />
            <span className="rounded-full bg-secondary px-3 py-1 font-display text-sm font-extrabold text-ink">{bpm} BPM</span>
          </div>
          <div className="flex gap-2">
            <ScorePill label="命中" value={`${hits}/${onsets.length}`} emoji="🎯" color="var(--mint)" />
            <ScorePill label="连击" value={streak} emoji="🔥" color="var(--tangerine)" />
          </div>
        </div>

        <div className="card-pop mb-5 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold text-ink">
              {pattern.emoji} {pattern.name}
            </h2>
            <button type="button" onClick={randomPattern} className="btn-pop inline-flex items-center gap-1 bg-white px-4 py-2 font-display text-sm font-extrabold text-ink">
              <RefreshCw className="h-4 w-4" /> 换个节奏
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {pattern.cells.map((cell, i) => (
              <div key={i} className="flex flex-col items-center gap-1 rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-pop">
                <span className="text-2xl">{cell.icon}</span>
                <span className="font-display text-xs font-extrabold text-muted-foreground">{cell.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-pop relative overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
          <div className="relative">
            <div className="mb-5 flex justify-center gap-3">
              {Array.from({ length: BEATS_PER_BAR }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid h-14 w-14 place-items-center rounded-2xl border-3 border-ink font-display text-xl font-extrabold transition-all",
                    beat % BEATS_PER_BAR === i && playing ? "scale-110 bg-tangerine text-ink" : "bg-white text-ink/40"
                  )}
                  style={{ borderWidth: 3 }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void listenPattern()}
                disabled={playing && tapping}
                className="btn-pop inline-flex items-center gap-2 bg-white px-5 py-3 font-display text-base font-extrabold text-ink"
              >
                <Play className="h-5 w-5" /> 试听节奏
              </button>
              {!tapping ? (
                <button
                  type="button"
                  onClick={() => void startTap()}
                  className="btn-pop inline-flex items-center gap-2 bg-tangerine px-6 py-3 font-display text-lg font-extrabold text-ink"
                >
                  <Hand className="h-5 w-5" /> 开始跟拍
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopAll}
                  className="btn-pop inline-flex items-center gap-2 bg-bubble px-6 py-3 font-display text-lg font-extrabold text-white"
                >
                  <Square className="h-5 w-5 fill-white" /> 停止
                </button>
              )}
            </div>

            {tapping && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  tap();
                }}
                className="mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full border-4 border-ink bg-sunny font-display text-2xl font-extrabold text-ink shadow-pop transition-transform active:translate-y-1"
              >
                👏 拍！
              </button>
            )}

            {!tapping && (
              <p className="mt-5 text-sm font-semibold text-muted-foreground">
                点「开始跟拍」，跟着木鱼声在正确的位置按拍子（也可以按空格键）
              </p>
            )}

            <div className="relative mt-4 flex min-h-[54px] items-center justify-center">
              <Feedback status={status} correctText="节奏感超棒！" wrongText="再稳一点就好啦" />
              {status === "correct" && <StarBurst key={burstKey} />}
            </div>

            {result && (
              <p className="font-display text-lg font-extrabold text-ink">
                命中 {result.hits} / {result.total} 拍
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
