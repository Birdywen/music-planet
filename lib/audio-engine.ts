// ── Real-sample piano + percussion engine ─────────────────────
// All musical sound comes from real recorded instrument samples
// (FluidR3 GM acoustic grand piano + woodblock). No synthesized
// oscillators are used for the musical voices.

const SAMPLE_BASE = "/audio/piano/";
const PERC_BASE = "/audio/perc/";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let busGain: GainNode | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();

function getCtx(): AudioContext {
  if (!ctx) {
    const AC: typeof AudioContext =
      (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(ctx.destination);
    busGain = ctx.createGain();
    busGain.gain.value = 1;
    busGain.connect(masterGain);
  }
  return ctx;
}

export async function resumeAudio(): Promise<void> {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
}

export function getAudioContext(): AudioContext {
  return getCtx();
}

export function setMasterVolume(v: number): void {
  getCtx();
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function getMasterVolume(): number {
  return masterGain ? masterGain.gain.value : 0.85;
}

async function fetchBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url);
  if (cached) return cached;
  const pending = loading.get(url);
  if (pending) return pending;
  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await getCtx().decodeAudioData(arr);
      buffers.set(url, decoded);
      return decoded;
    } catch {
      return null;
    } finally {
      loading.delete(url);
    }
  })();
  loading.set(url, p);
  return p;
}

export async function preloadSamples(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => fetchBuffer(SAMPLE_BASE + k + ".mp3")));
}

export async function playSampleKey(key: string, opts: { gain?: number; when?: number; duration?: number } = {}): Promise<void> {
  const c = getCtx();
  await resumeAudio();
  const buf = await fetchBuffer(SAMPLE_BASE + key + ".mp3");
  if (!buf) return;
  const t = opts.when ?? c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const peak = opts.gain ?? 0.9;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  if (opts.duration) {
    g.gain.setValueAtTime(peak, t + Math.max(0.05, opts.duration - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);
  }
  src.connect(g);
  g.connect(busGain!);
  src.start(t);
  if (opts.duration) src.stop(t + opts.duration + 0.05);
}

export async function playPercussion(accent: boolean, when?: number): Promise<void> {
  const c = getCtx();
  await resumeAudio();
  const key = accent ? "wb_A2" : "wb_A4";
  const buf = await fetchBuffer(PERC_BASE + key + ".mp3");
  if (!buf) return;
  const t = when ?? c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = accent ? 0.95 : 0.6;
  src.connect(g);
  g.connect(busGain!);
  src.start(t);
}

export async function playSequence(keys: string[], stepMs = 380, gain = 0.85): Promise<void> {
  const c = getCtx();
  await resumeAudio();
  const t0 = c.currentTime + 0.03;
  keys.forEach((k, i) => {
    void playSampleKey(k, { when: t0 + (i * stepMs) / 1000, gain });
  });
}

export function stopAll(): void {
  if (busGain && ctx) {
    busGain.gain.cancelScheduledValues(ctx.currentTime);
    busGain.gain.setValueAtTime(busGain.gain.value, ctx.currentTime);
  }
}

export interface MetronomeHandle {
  stop: () => void;
}

export function startMetronome(bpm: number, beatsPerBar = 4): MetronomeHandle {
  const c = getCtx();
  void resumeAudio();
  const interval = 60 / bpm;
  let beat = 0;
  let next = c.currentTime + 0.1;
  const lookahead = 0.1;
  const timer = window.setInterval(() => {
    while (next < c.currentTime + lookahead) {
      const accent = beat % beatsPerBar === 0;
      void playPercussion(accent, next);
      next += interval;
      beat++;
    }
  }, 25);
  return {
    stop: () => window.clearInterval(timer),
  };
}
