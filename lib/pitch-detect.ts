// ── Microphone pitch detection (autocorrelation) ────────────

export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const v = buf[i];
    rms += v * v;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.012) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  SIZE = trimmed.length;
  if (SIZE < 128) return -1;

  const c = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    let sum = 0;
    for (let j = 0; j < SIZE - i; j++) sum += trimmed[j] * trimmed[j + i];
    c[i] = sum;
  }

  let d = 0;
  while (d < SIZE - 1 && c[d] > c[d + 1]) d++;

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;

  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1500) return -1;
  return freq;
}

export function freqToMidiFloat(f: number): number {
  return 69 + 12 * Math.log2(f / 440);
}

export interface PitchReadout {
  freq: number;
  midiFloat: number;
  nearestMidi: number;
  cents: number;
}

export function readPitch(buf: Float32Array, sampleRate: number): PitchReadout | null {
  const f = autoCorrelate(buf, sampleRate);
  if (f < 0) return null;
  const midiFloat = freqToMidiFloat(f);
  const nearestMidi = Math.round(midiFloat);
  return { freq: f, midiFloat, nearestMidi, cents: Math.round((midiFloat - nearestMidi) * 100) };
}
