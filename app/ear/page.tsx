"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ear, Mic, MicOff, Music, Play, RefreshCw, Target } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Staff } from "@/components/staff";
import { Feedback, ScorePill, StarBurst } from "@/components/game-ui";
import { useProgress } from "@/components/providers";
import { playSampleKey, playSequence, resumeAudio } from "@/lib/audio-engine";
import { makeNote, MELODIES, sampleKeyFromMidi, shuffle, type Melody } from "@/lib/music";
import { readPitch } from "@/lib/pitch-detect";
import { cn } from "@/lib/utils";

type Tab = "listen" | "sing";

const ROOT = 60;

export default function EarPage() {
  const { addStars, recordStreak } = useProgress();
  const [tab, setTab] = useState<Tab>("listen");

  const [melody, setMelody] = useState<Melody>(MELODIES[0]);
  const [options, setOptions] = useState<Melody[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const newRound = useCallback(() => {
    const correct = shuffle(MELODIES)[0];
    const others = shuffle(MELODIES.filter((m) => m.id !== correct.id)).slice(0, 2);
    setMelody(correct);
    setOptions(shuffle([correct, ...others]));
    setStatus("idle");
    setAnswered(false);
  }, []);

  useEffect(() => {
    if (tab === "listen") newRound();
  }, [tab, newRound]);

  const melodyMidis = melody.notes.map((n) => ROOT + n);

  const playMelody = useCallback(async () => {
    await resumeAudio();
    await playSequence(melodyMidis.map(sampleKeyFromMidi), 420, 0.9);
  }, [melodyMidis]);

  const chooseMelody = useCallback(
    (m: Melody) => {
      if (answered) return;
      setAnswered(true);
      if (m.id === melody.id) {
        setStatus("correct");
        setBurstKey((k) => k + 1);
        const ns = streak + 1;
        setStreak(ns);
        recordStreak(ns);
        addStars("ear", 2);
        window.setTimeout(() => newRound(), 1300);
      } else {
        setStatus("wrong");
        setStreak(0);
        window.setTimeout(() => {
          setStatus("idle");
          setAnswered(false);
        }, 900);
      }
    },
    [answered, melody, streak, addStars, recordStreak, newRound]
  );

  const [targetMidi, setTargetMidi] = useState(64);
  const [micOn, setMicOn] = useState(false);
  const [detected, setDetected] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [singStatus, setSingStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [singStreak, setSingStreak] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const holdRef = useRef(0);
  const targetRef = useRef(targetMidi);
  targetRef.current = targetMidi;
  const singStreakRef = useRef(0);
  const correctLockRef = useRef(false);

  const pickTarget = useCallback(() => {
    const pool = [60, 62, 64, 65, 67, 69, 71, 72];
    setTargetMidi((prev) => {
      const others = pool.filter((p) => p !== prev);
      return shuffle(others)[0];
    });
    setSingStatus("idle");
    correctLockRef.current = false;
    holdRef.current = 0;
  }, []);

  const playTarget = useCallback(async () => {
    await resumeAudio();
    await playSequence([sampleKeyFromMidi(targetMidi)], 100, 0.95);
  }, [targetMidi]);

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setMicOn(false);
    setDetected(null);
  }, []);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    const loop = () => {
      analyser.getFloatTimeDomainData(buf);
      const r = readPitch(buf, analyser.context.sampleRate);
      if (r) {
        setDetected(r.midiFloat);
        setCents(r.cents);
        const near = Math.abs(r.midiFloat - targetRef.current);
        if (near <= 0.6) {
          holdRef.current += 1;
          if (holdRef.current > 18 && !correctLockRef.current) {
            correctLockRef.current = true;
            setSingStatus("correct");
            const ns = singStreakRef.current + 1;
            singStreakRef.current = ns;
            setSingStreak(ns);
            recordStreak(ns);
            addStars("ear", 1);
            window.setTimeout(() => pickTarget(), 1200);
          }
        } else {
          holdRef.current = Math.max(0, holdRef.current - 1);
          if (!correctLockRef.current && holdRef.current === 0) setSingStatus("idle");
        }
      } else {
        holdRef.current = Math.max(0, holdRef.current - 1);
        setDetected(null);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [recordStreak, addStars, pickTarget]);

  const startMic = useCallback(async () => {
    try {
      await resumeAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      setMicOn(true);
      analyze();
    } catch {
      setMicOn(false);
    }
  }, [analyze]);

  useEffect(() => () => stopMic(), [stopMic]);

  useEffect(() => {
    if (tab === "sing") pickTarget();
    else stopMic();
  }, [tab, pickTarget, stopMic]);

  const targetNote = makeNote(targetMidi, true);
  const detectedNote = detected !== null ? makeNote(Math.round(detected), true) : null;
  const inTune = detected !== null && Math.abs(detected - targetMidi) <= 0.6;

  return (
    <div className="min-h-screen">
      <TopBar title="视唱练耳" emoji="🎤" />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mb-5 flex justify-center gap-2">
          {([
            { id: "listen", label: "👂 听旋律·猜歌名" },
            { id: "sing", label: "🎤 听音模唱" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-2xl border-2 border-ink px-5 py-2.5 font-display text-base font-extrabold shadow-pop",
                tab === t.id ? "bg-bubble text-white" : "bg-white text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "listen" ? (
          <div className="card-pop relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold text-ink">👂 听旋律，猜猜是哪首？</h2>
                <ScorePill label="连击" value={streak} emoji="🔥" color="var(--tangerine)" />
              </div>

              <button
                type="button"
                onClick={() => void playMelody()}
                className="btn-pop inline-flex items-center gap-2 bg-grape px-6 py-3 font-display text-lg font-extrabold text-white"
              >
                <Play className="h-5 w-5 fill-white" /> 播放旋律
              </button>

              <div className="mt-5 flex justify-center overflow-x-auto">
                <Staff midis={melodyMidis} width={Math.min(560, 160 + melodyMidis.length * 52)} color="var(--bubble)" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {options.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => chooseMelody(m)}
                    className="card-pop flex flex-col items-center gap-1 bg-white p-5 transition-transform hover:-translate-y-1"
                  >
                    <span className="text-4xl">{m.emoji}</span>
                    <span className="font-display text-xl font-extrabold text-ink">{m.title}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{m.hint}</span>
                  </button>
                ))}
              </div>

              <div className="relative mt-6 flex min-h-[54px] items-center justify-center">
                <Feedback status={status} correctText="猜对啦！🎵" wrongText="再听一次，想想看" />
                {status === "correct" && <StarBurst key={burstKey} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-pop relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 bubble-bg opacity-40" />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold text-ink">🎤 听一个音，用声音唱回来</h2>
                <div className="flex gap-2">
                  <ScorePill label="连击" value={singStreak} emoji="🔥" color="var(--tangerine)" />
                  <ScorePill label="你的音" value={detectedNote ? detectedNote.name : "—"} emoji="🎧" color="var(--sky)" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void playTarget()}
                  className="btn-pop inline-flex items-center gap-2 bg-grape px-6 py-3 font-display text-lg font-extrabold text-white"
                >
                  <Play className="h-5 w-5 fill-white" /> 听目标音
                </button>
                {!micOn ? (
                  <button
                    type="button"
                    onClick={() => void startMic()}
                    className="btn-pop inline-flex items-center gap-2 bg-mint px-6 py-3 font-display text-lg font-extrabold text-ink"
                  >
                    <Mic className="h-5 w-5" /> 打开麦克风
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopMic}
                    className="btn-pop inline-flex items-center gap-2 bg-bubble px-6 py-3 font-display text-lg font-extrabold text-white"
                  >
                    <MicOff className="h-5 w-5" /> 关闭麦克风
                  </button>
                )}
                <button
                  type="button"
                  onClick={pickTarget}
                  className="btn-pop inline-flex items-center gap-2 bg-white px-5 py-3 font-display text-base font-extrabold text-ink"
                >
                  <RefreshCw className="h-5 w-5" /> 换个音
                </button>
              </div>

              <div className="mt-7 rounded-3xl border-2 border-ink bg-white p-5 shadow-pop">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-display text-base font-extrabold text-ink">
                    <Target className="h-4 w-4" /> 目标：{targetNote.name} · <span className="text-grape">{targetNote.solfege}</span>
                  </span>
                  <span className={cn("font-display text-base font-extrabold", inTune ? "text-mint" : "text-muted-foreground")}>
                    {detected === null ? "等待声音…" : inTune ? "音准很棒！" : cents > 0 ? `偏高 ${cents} 音分` : `偏低 ${Math.abs(cents)} 音分`}
                  </span>
                </div>

                <div className="relative h-16 overflow-hidden rounded-2xl border-2 border-ink bg-secondary">
                  <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-mint/50" />
                  <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-ink/60" />
                  {detected !== null && (
                    <div
                      className="absolute top-0 h-full w-3 -translate-x-1/2 rounded-full border-2 border-ink bg-bubble transition-all duration-75"
                      style={{ left: `${50 + Math.max(-50, Math.min(50, (detected - targetMidi) * 100))}%` }}
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: 13 }, (_, i) => 60 + i).map((m) => (
                    <div
                      key={m}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl border-2 border-ink font-display text-xs font-extrabold",
                        detected !== null && Math.round(detected) === m
                          ? inTune
                            ? "bg-mint text-ink"
                            : "bg-bubble text-white"
                          : m === targetMidi
                          ? "bg-sunny text-ink"
                          : "bg-white text-ink/50"
                      )}
                    >
                      {makeNote(m, true).solfege}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mt-5 flex min-h-[54px] items-center justify-center">
                <Feedback status={singStatus} correctText="音准完美！🎉" wrongText="" />
                {singStatus === "correct" && <StarBurst key={burstKey} />}
              </div>

              <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-semibold text-muted-foreground">
                <Ear className="h-4 w-4" /> 提示：戴上耳机效果更好；对着麦克风稳定地唱「啊——」或唱名。
                <Music className="h-4 w-4" /> 麦克风仅用于实时音高检测，不会录音保存。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
