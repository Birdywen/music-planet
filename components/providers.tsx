"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { preloadSamples, setMasterVolume, resumeAudio } from "@/lib/audio-engine";

// ── Audio context ────────────────────────────────────────────
interface AudioState {
  ready: boolean;
  volume: number;
  unlock: () => Promise<void>;
  setVolume: (v: number) => void;
}

const AudioCtx = createContext<AudioState | null>(null);

const WARMUP = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"];

// ── Progress context ─────────────────────────────────────────
interface Progress {
  stars: number;
  bestStreak: number;
  sessions: number;
  byMode: Record<string, number>;
  badges: string[];
}

const DEFAULT_PROGRESS: Progress = { stars: 0, bestStreak: 0, sessions: 0, byMode: {}, badges: [] };

interface ProgressState {
  progress: Progress;
  addStars: (mode: string, n: number) => void;
  recordStreak: (n: number) => void;
  reset: () => void;
}

const ProgressCtx = createContext<ProgressState | null>(null);

const BADGES: { id: string; label: string; emoji: string; test: (p: Progress) => boolean }[] = [
  { id: "first", label: "初次登台", emoji: "🌟", test: (p) => p.stars >= 1 },
  { id: "star10", label: "十星达人", emoji: "✨", test: (p) => p.stars >= 10 },
  { id: "star50", label: "音乐小能手", emoji: "🏅", test: (p) => p.stars >= 50 },
  { id: "star120", label: "金耳朵", emoji: "👑", test: (p) => p.stars >= 120 },
  { id: "streak5", label: "连击五连", emoji: "🔥", test: (p) => p.bestStreak >= 5 },
  { id: "streak10", label: "十连击", emoji: "⚡", test: (p) => p.bestStreak >= 10 },
];

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [volume, setVol] = useState(0.85);
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mp-progress");
      if (raw) setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(raw) });
      const v = localStorage.getItem("mp-volume");
      if (v) {
        const n = parseFloat(v);
        setVol(n);
        setMasterVolume(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((p: Progress) => {
    try {
      localStorage.setItem("mp-progress", JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  const unlock = useCallback(async () => {
    await resumeAudio();
    await preloadSamples(WARMUP);
    setReady(true);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVol(v);
    setMasterVolume(v);
    try {
      localStorage.setItem("mp-volume", String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const addStars = useCallback(
    (mode: string, n: number) => {
      setProgress((prev) => {
        const next: Progress = {
          ...prev,
          stars: prev.stars + n,
          sessions: prev.sessions + 1,
          byMode: { ...prev.byMode, [mode]: (prev.byMode[mode] || 0) + n },
        };
        next.badges = BADGES.filter((b) => b.test(next)).map((b) => b.id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const recordStreak = useCallback(
    (n: number) => {
      setProgress((prev) => {
        if (n <= prev.bestStreak) return prev;
        const next: Progress = { ...prev, bestStreak: n };
        next.badges = BADGES.filter((b) => b.test(next)).map((b) => b.id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    persist(DEFAULT_PROGRESS);
  }, [persist]);

  const audioValue = useMemo<AudioState>(() => ({ ready, volume, unlock, setVolume }), [ready, volume, unlock, setVolume]);
  const progressValue = useMemo<ProgressState>(() => ({ progress, addStars, recordStreak, reset }), [progress, addStars, recordStreak, reset]);

  return (
    <AudioCtx.Provider value={audioValue}>
      <ProgressCtx.Provider value={progressValue}>{children}</ProgressCtx.Provider>
    </AudioCtx.Provider>
  );
}

export function useAudio(): AudioState {
  const c = useContext(AudioCtx);
  if (!c) throw new Error("useAudio must be used within Providers");
  return c;
}

export function useProgress(): ProgressState {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error("useProgress must be used within Providers");
  return c;
}

export { BADGES };
