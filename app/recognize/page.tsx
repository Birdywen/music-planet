"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ear, Play, RefreshCw, Target } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { Staff } from "@/components/staff";
import { Feedback, ScorePill, StarBurst } from "@/components/game-ui";
import { useProgress } from "@/components/providers";
import { playSampleKey, resumeAudio } from "@/lib/audio-engine";
import { IS_BLACK_KEY, makeNote, sampleKeyFromMidi, shuffle } from "@/lib/music";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3;

const LEVELS: Record<Level, { label: string; desc: string; pool: () => number[] }> = {
  1: { label: "入门", desc: "白键 C4–C5", pool: () => [60, 62, 64, 65, 67, 69, 71, 72] },
  2: {
    label: "进阶",
    desc: "白键 C4–C6",
    pool: () => {
      const out: number[] = [];
      for (let m = 60; m <= 84; m++) if (!IS_BLACK_KEY[m % 12]) out.push(m);
      return out;
    },
  },
  3: { label: "高手", desc: "含黑键 C4–C5", pool: () => Array.from({ length: 13 }, (_, i) => 60 + i) },
};

export default function RecognizePage() {
  const { addStars, recordStreak, progress } = useProgress();
  const [level, setLevel] = useState<Level>(1);
  const [target, setTarget] = useState<number>(64);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [showStaff, setShowStaff] = useState(false);
  const [locked, setLocked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const pool = useMemo(() => LEVELS[level].pool(), [level]);

  const newTarget = useCallback(() => {
    setTarget((prev) => {
      const options = shuffle(pool);
      return options[0] === prev && options.length > 1 ? options[1] : options[0];
    });
    setStatus("idle");
    setWrongMidi(null);
    setLocked(false);
  }, [pool]);

  useEffect(() => {
    newTarget();
    setRound(0);
    setStreak(0);
  }, [level, newTarget]);

  const playTarget = useCallback(async () => {
    await resumeAudio();
    void playSampleKey(sampleKeyFromMidi(target), { gain: 0.95 });
  }, [target]);

  const handleKey = useCallback(
    async (midi: number) => {
      if (locked) return;
      await resumeAudio();
      void playSampleKey(sampleKeyFromMidi(midi), { gain: 0.9 });
      if (midi === target) {
        setLocked(true);
        setStatus("correct");
        setWrongMidi(null);
        setBurstKey((k) => k + 1);
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        recordStreak(nextStreak);
        addStars("recognize", 1);
        setRound((r) => r + 1);
        window.setTimeout(() => newTarget(), 1100);
      } else {
        setStatus("wrong");
        setWrongMidi(midi);
        setStreak(0);
        window.setTimeout(() => {
          setStatus("idle");
          setWrongMidi(null);
        }, 700);
      }
    },
    [locked, target, streak, addStars, recordStreak, newTarget]
  );

  const targetNote = makeNote(target, true);

  return (
    <div className="min-h-screen">
      <TopBar title="认音闯关" emoji="🎹" />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <div className="card-pop mb-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {([1, 2, 3] as Level[]).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={cn(
                    "rounded-2xl border-2 border-ink px-4 py-2 font-display text-sm font-extrabold shadow-pop transition-colors",
                    level === lv ? "bg-grape text-white" : "bg-white text-ink"
                  )}
                >
                  {LEVELS[lv].label}
                  <span className="ml-2 text-[10px] font-bold opacity-80">{LEVELS[lv].desc}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <ScorePill label="连击" value={streak} emoji="🔥" color="var(--tangerine)" />
              <ScorePill label="本关" value={round} emoji="🎯" color="var(--mint)" />
              <ScorePill label="总星" value={progress.stars} emoji="⭐" color="var(--sunny)" />
            </div>
          </div>
        </div>

        <div className="card-pop relative overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute inset-0 bubble-bg opacity-50" />
          <div className="relative">
            <p className="font-display text-lg font-extrabold text-ink">🎧 听一听，然后在键盘上找到这个音</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void playTarget()}
                className="btn-pop inline-flex items-center gap-2 bg-grape px-6 py-3 font-display text-lg font-extrabold text-white"
              >
                <Play className="h-5 w-5 fill-white" /> 再听一次
              </button>
              <button
                type="button"
                onClick={() => setShowStaff((s) => !s)}
                className="btn-pop inline-flex items-center gap-2 bg-white px-5 py-3 font-display text-base font-extrabold text-ink"
              >
                <Target className="h-5 w-5" /> {showStaff ? "隐藏五线谱" : "五线谱提示"}
              </button>
              <button
                type="button"
                onClick={() => newTarget()}
                className="btn-pop inline-flex items-center gap-2 bg-secondary px-5 py-3 font-display text-base font-extrabold text-ink"
              >
                <RefreshCw className="h-5 w-5" /> 换一个
              </button>
            </div>

            {showStaff && (
              <div className="mt-5 flex justify-center">
                <Staff midis={[target]} width={280} />
              </div>
            )}

            <div className="relative mt-5 flex min-h-[54px] items-center justify-center">
              <Feedback status={status} correctText="耳朵真厉害！" wrongText="不是这个音，再听听～" />
              {status === "correct" && <StarBurst key={burstKey} />}
            </div>

            {status === "correct" && (
              <div className="mt-2 animate-pop-in font-display text-2xl font-extrabold text-ink">
                {targetNote.name} · 唱名 <span className="text-grape">{targetNote.solfege}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 card-pop p-4">
          <div className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold text-muted-foreground">
            <Ear className="h-4 w-4" /> 点击琴键作答
          </div>
          <PianoKeyboard
            startMidi={60}
            endMidi={84}
            onKey={(m) => void handleKey(m)}
            labelMode="solfege"
            correct={status === "correct" ? [target] : []}
            wrong={wrongMidi !== null ? [wrongMidi] : []}
            disabled={locked}
          />
        </div>
      </main>
    </div>
  );
}
