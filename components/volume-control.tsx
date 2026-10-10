"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/components/providers";

export function VolumeControl() {
  const { volume, setVolume } = useAudio();
  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-ink/80 bg-white/90 px-3 py-1.5 shadow-pop">
      <button
        type="button"
        aria-label={volume === 0 ? "开启声音" : "静音"}
        onClick={() => setVolume(volume === 0 ? 0.85 : 0)}
        className="grid h-6 w-6 place-items-center"
      >
        {volume === 0 ? <VolumeX className="h-4 w-4 text-ink" /> : <Volume2 className="h-4 w-4 text-ink" />}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label="音量"
        className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-secondary accent-grape"
      />
    </div>
  );
}
