"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Music, Play, Sparkles } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { Staff } from "@/components/staff";
import { Feedback, ScorePill, StarBurst } from "@/components/game-ui";
import { useProgress } from "@/components/providers";
import { playSampleKey, playSequence, resumeAudio } from "@/lib/audio-engine";
import { KEYS, SCALES, makeNote, sampleKeyFromMidi, scaleNotes, shuffle, type ScaleDef } from "@/lib/music";
import { cn } from "@/lib/utils";

type Tab = "explore" | "quiz";

const ROOT_MIDI = 60;

export default function ScalesPage() {
  const { addStars, recordStreak } = useProgress();
  const [tab, setTab] = useState<Tab>("explore");
  const [scaleId, setScaleId] = useState("major");
  const [keyIdx, setKeyIdx] = useState(0);

  const [quizScale, setQuizScale] = useState<ScaleDef>(SCALES[0]);
  const [options, setOptions] = useState<ScaleDef[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [streak, setStreak] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [answered, setAnswered] = useState(false);

  const scale = useMemo(() => SCALES.find((s) => s.id === scaleId)!, [scaleId]);
  const key = KEYS[keyIdx];
  const rootMidi = ROOT_MIDI + key.tonicPc;

  const activeMidis = useMemo(() => scaleNotes(rootMidi, scale), [rootMidi, scale]);
  const activeKeys = useMemo(() => activeMidis.map(sampleKeyFromMidi), [activeMidis]);

  const playScale = useCallback(async () => {
    await resumeAudio();
    const up = activeKeys;
    const down = [...activeKeys].reverse().slice(1);
    await playSequence([...up, ...down], 360, 0.85);
  }, [activeKeys]);

  const newQuiz = useCallback(() => {
    const correct = shuffle(SCALES)[0];
    const others = shuffle(SCALES.filter((s) => s.id !== correct.id)).slice(0, 2);
    setQuizScale(correct);
    setOptions(shuffle([correct, ...others]));
    setStatus("idle");
    setAnswered(false);
  }, []);

  useEffect(() => {
    if (tab === "quiz") newQuiz();
  }, [tab, newQuiz]);

  const playQuizScale = useCallback(async () => {
    await resumeAudio();
    const keys = scaleNotes(ROOT_MIDI, quizScale).map(sampleKeyFromMidi);
    await playSequence(keys, 380, 0.85);
  }, [quizScale]);

  const chooseQuiz = useCallback(
    (s: ScaleDef) => {
      if (answered) return;
      setAnswered(true);
      if (s.id === quizScale.id) {
        setStatus("correct");
        setBurstKey((k) => k + 1);
        const ns = streak + 1;
        setStreak(ns);
        recordStreak(ns);
        addStars("scales", 1);
        window.setTimeout(() => newQuiz(), 1200);
      } else {
        setStatus("wrong");
        setStreak(0);
        window.setTimeout(() => {
          setStatus("idle");
          setAnswered(false);
        }, 900);
      }
    },
    [answered, quizScale, streak, addStars, recordStreak, newQuiz]
  );

  return (
    <div className="min-h-screen">
      <TopBar title="调式魔法" emoji="🌈" />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mb-5 flex justify-center gap-2">
          {([
            { id: "explore", label: "🔭 探索调式" },
            { id: "quiz", label: "🎲 听辨挑战" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-2xl border-2 border-ink px-5 py-2.5 font-display text-base font-extrabold shadow-pop",
                tab === t.id ? "bg-mint text-ink" : "bg-white text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "explore" ? (
          <>
            <div className="card-pop mb-5 p-5">
              <h2 className="mb-3 font-display text-lg font-extrabold text-ink">选择调式</h2>
              <div className="flex flex-wrap gap-2">
                {SCALES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScaleId(s.id)}
                    className={cn(
                      "rounded-2xl border-2 border-ink px-4 py-2 font-display text-sm font-extrabold shadow-pop",
                      scaleId === s.id ? "bg-mint text-ink" : "bg-white text-ink"
                    )}
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <h2 className="mb-3 mt-4 font-display text-lg font-extrabold text-ink">选择调号（主音）</h2>
              <div className="flex flex-wrap gap-2">
                {KEYS.map((k, i) => (
                  <button
                    key={k.name}
                    type="button"
                    onClick={() => setKeyIdx(i)}
                    className={cn(
                      "rounded-2xl border-2 border-ink px-4 py-2 font-display text-sm font-extrabold shadow-pop",
                      keyIdx === i ? "bg-sky text-ink" : "bg-white text-ink"
                    )}
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-pop relative overflow-hidden p-6">
              <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-2xl font-extrabold text-ink">
                      {scale.emoji} {key.name} · {scale.name}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      <Sparkles className="mr-1 inline h-4 w-4 text-tangerine" />
                      {scale.flavor}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void playScale()}
                    className="btn-pop inline-flex items-center gap-2 bg-grape px-6 py-3 font-display text-lg font-extrabold text-white"
                  >
                    <Play className="h-5 w-5 fill-white" /> 听音阶
                  </button>
                </div>

                <div className="mt-5 flex justify-center">
                  <Staff midis={activeMidis} width={Math.min(520, 120 + activeMidis.length * 56)} color="var(--mint)" />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold text-muted-foreground">
                    <Music className="h-4 w-4" /> 高亮的就是这个调式的音（点琴键试听）
                  </div>
                  <PianoKeyboard
                    startMidi={60}
                    endMidi={84}
                    onKey={(m) => {
                      void resumeAudio();
                      void playSampleKey(sampleKeyFromMidi(m), { gain: 0.9 });
                    }}
                    labelMode="solfege"
                    highlight={activeMidis.filter((m) => m <= 84)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeMidis.slice(0, 7).map((m, i) => (
                    <span key={m} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 font-display text-sm font-extrabold text-ink">
                      {i + 1}. {makeNote(m, true).name} <span className="text-grape">{makeNote(m, true).solfege}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card-pop relative overflow-hidden p-8 text-center">
            <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
            <div className="relative">
              <div className="mb-4 flex justify-center">
                <ScorePill label="连击" value={streak} emoji="🔥" color="var(--tangerine)" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-ink">🎲 听一听，这是哪种调式？</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">从 C 开始，听完整条音阶</p>

              <button
                type="button"
                onClick={() => void playQuizScale()}
                className="btn-pop mt-6 inline-flex items-center gap-2 bg-grape px-8 py-4 font-display text-xl font-extrabold text-white"
              >
                <Play className="h-6 w-6 fill-white" /> 播放音阶
              </button>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {options.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseQuiz(s)}
                    className="card-pop flex flex-col items-center gap-2 bg-white p-6 transition-transform hover:-translate-y-1"
                  >
                    <span className="text-4xl">{s.emoji}</span>
                    <span className="font-display text-xl font-extrabold text-ink">{s.name}</span>
                  </button>
                ))}
              </div>

              <div className="relative mt-6 flex min-h-[54px] items-center justify-center">
                <Feedback status={status} correctText="答对啦！好耳朵" wrongText="再听一遍试试" />
                {status === "correct" && <StarBurst key={burstKey} />}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
