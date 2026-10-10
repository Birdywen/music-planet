"use client";

import { cn } from "@/lib/utils";
import { IS_BLACK_KEY, makeNote, sampleKeyFromMidi } from "@/lib/music";

export type KeyLabelMode = "none" | "solfege" | "note";

interface PianoKeyboardProps {
  startMidi?: number;
  endMidi?: number;
  onKey: (midi: number) => void;
  labelMode?: KeyLabelMode;
  highlight?: number[];
  correct?: number[];
  wrong?: number[];
  disabled?: boolean;
}

/** Interactive piano keyboard driven by real recorded samples. */
export function PianoKeyboard({
  startMidi = 60,
  endMidi = 84,
  onKey,
  labelMode = "none",
  highlight = [],
  correct = [],
  wrong = [],
  disabled = false,
}: PianoKeyboardProps) {
  const midis: number[] = [];
  for (let m = startMidi; m <= endMidi; m++) midis.push(m);

  const whites = midis.filter((m) => !IS_BLACK_KEY[m % 12]);
  const whiteWidth = 100 / whites.length;

  const label = (m: number) => {
    const n = makeNote(m, true);
    if (labelMode === "solfege") return n.solfege;
    if (labelMode === "note") return n.name.replace(/\d/, "");
    return "";
  };

  return (
    <div className="relative w-full select-none" style={{ height: 190 }}>
      <div className="absolute inset-x-0 bottom-0 top-0 flex">
        {whites.map((m) => {
          const isC = m % 12 === 0;
          const isHi = highlight.includes(m);
          const isOk = correct.includes(m);
          const isNo = wrong.includes(m);
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => onKey(m)}
              className={cn(
                "relative flex-1 rounded-b-xl border-2 border-ink/70 bg-white transition-all",
                "hover:bg-sunny/40 active:translate-y-0.5",
                isHi && "bg-sky/60",
                isOk && "bg-mint/70",
                isNo && "bg-destructive/50",
                disabled && "opacity-70"
              )}
              style={{ marginRight: 2 }}
            >
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-2 text-center font-display text-xs font-extrabold",
                  isC ? "text-grape" : "text-ink/50"
                )}
              >
                {labelMode !== "none" ? label(m) : isC ? makeNote(m, true).name : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {midis
          .filter((m) => IS_BLACK_KEY[m % 12])
          .map((m) => {
            let count = 0;
            for (let x = startMidi; x < m; x++) if (!IS_BLACK_KEY[x % 12]) count++;
            const left = count * whiteWidth;
            const isHi = highlight.includes(m);
            const isOk = correct.includes(m);
            const isNo = wrong.includes(m);
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => onKey(m)}
                className={cn(
                  "pointer-events-auto absolute top-0 z-10 rounded-b-lg border-2 border-ink bg-ink transition-all",
                  "hover:bg-ink/80 active:translate-y-0.5",
                  isHi && "bg-grape",
                  isOk && "bg-mint",
                  isNo && "bg-destructive"
                )}
                style={{ left: `calc(${left}% - ${whiteWidth * 0.32}%)`, width: `${whiteWidth * 0.64}%`, height: "62%" }}
              >
                {labelMode !== "none" && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center font-display text-[10px] font-extrabold text-white/90">
                    {label(m)}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}

export function midiToSampleKey(midi: number): string {
  return sampleKeyFromMidi(midi);
}
