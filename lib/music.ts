// ── Music theory core for 音乐小星球 ──────────────────────────────

export const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const SOLFEGE = ["do", "di", "re", "ri", "mi", "fa", "fi", "sol", "si", "la", "li", "ti"];
export const SOLFEGE_CN = ["do", "升do", "re", "升re", "mi", "fa", "升fa", "sol", "升sol", "la", "升la", "ti"];
export const SAMPLE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export const IS_BLACK_KEY = [false, true, false, true, false, false, true, false, true, false, true, false];

export function midiFromName(name: string): number {
  const m = name.match(/^([A-G])(#|b)?(-?\d+)$/);
  if (!m) throw new Error("bad note name: " + name);
  const letter = m[1];
  const accidental = m[2] || "";
  const octave = parseInt(m[3], 10);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let semi = base[letter];
  if (accidental === "#") semi += 1;
  if (accidental === "b") semi -= 1;
  return (octave + 1) * 12 + semi;
}

export function nameFromMidi(midi: number, preferFlat = false): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const names = preferFlat ? FLAT_NAMES : SHARP_NAMES;
  return names[pc] + octave;
}

export function sampleKeyFromMidi(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return SAMPLE_NAMES[pc] + octave;
}

export function frequencyFromMidi(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface Note {
  midi: number;
  name: string;
  solfege: string;
  solfegeCn: string;
  isBlack: boolean;
}

export function makeNote(midi: number, preferFlat = false): Note {
  const pc = ((midi % 12) + 12) % 12;
  return {
    midi,
    name: nameFromMidi(midi, preferFlat),
    solfege: SOLFEGE[pc],
    solfegeCn: SOLFEGE_CN[pc],
    isBlack: IS_BLACK_KEY[pc],
  };
}

export interface ScaleDef {
  id: string;
  name: string;
  emoji: string;
  intervals: number[];
  flavor: string;
}

export const SCALES: ScaleDef[] = [
  { id: "major", name: "大调", emoji: "☀️", intervals: [0, 2, 4, 5, 7, 9, 11], flavor: "明亮、开心，像阳光" },
  { id: "minor", name: "自然小调", emoji: "🌙", intervals: [0, 2, 3, 5, 7, 8, 10], flavor: "柔和、有点忧伤" },
  { id: "penta", name: "五声音阶", emoji: "🎋", intervals: [0, 2, 4, 7, 9], flavor: "中国风，怎么弹都好听" },
  { id: "dorian", name: "多利亚调式", emoji: "🪄", intervals: [0, 2, 3, 5, 7, 9, 10], flavor: "神秘又温柔" },
  { id: "lydian", name: "利底亚调式", emoji: "🌈", intervals: [0, 2, 4, 6, 7, 9, 11], flavor: "梦幻、飞翔的感觉" },
  { id: "blues", name: "蓝调音阶", emoji: "🎷", intervals: [0, 3, 5, 6, 7, 10], flavor: "酷酷的爵士味" },
];

export function scaleNotes(rootMidi: number, scale: ScaleDef): number[] {
  return scale.intervals.map((i) => rootMidi + i);
}

export interface KeySig {
  name: string;
  tonicPc: number;
  mode: "major" | "minor";
}

export const KEYS: KeySig[] = [
  { name: "C 大调", tonicPc: 0, mode: "major" },
  { name: "G 大调", tonicPc: 7, mode: "major" },
  { name: "D 大调", tonicPc: 2, mode: "major" },
  { name: "F 大调", tonicPc: 5, mode: "major" },
  { name: "a 小调", tonicPc: 9, mode: "minor" },
];

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface RhythmCell {
  id: string;
  label: string;
  beats: number;
  icon: string;
  pattern: number[];
}

export const RHYTHM_CELLS: RhythmCell[] = [
  { id: "q", label: "四分音符 ta", beats: 1, icon: "🍎", pattern: [0] },
  { id: "qq", label: "两个八分 ti-ti", beats: 1, icon: "🍒🍒", pattern: [0, 0.5] },
  { id: "h", label: "二分音符 ta-a", beats: 2, icon: "🍉", pattern: [0] },
  { id: "e4", label: "四个十六分 tiri-tiri", beats: 1, icon: "🫐🫐🫐🫐", pattern: [0, 0.25, 0.5, 0.75] },
  { id: "rest", label: "四分休止 嘘", beats: 1, icon: "🤫", pattern: [] },
  { id: "dotted", label: "附点节奏 tum-ti", beats: 1, icon: "🍍", pattern: [0, 0.75] },
];

export interface Melody {
  id: string;
  title: string;
  emoji: string;
  hint: string;
  notes: number[];
}

export const MELODIES: Melody[] = [
  { id: "m1", title: "小星星", emoji: "⭐", hint: "一闪一闪亮晶晶", notes: [0, 0, 7, 7, 9, 9, 7] },
  { id: "m2", title: "生日歌", emoji: "🎂", hint: "祝你生日快乐", notes: [0, 0, 2, 0, 5, 4] },
  { id: "m3", title: "玛丽小羊羔", emoji: "🐑", hint: "Mary had a little lamb", notes: [4, 2, 0, 2, 4, 4, 4] },
  { id: "m4", title: "两只老虎", emoji: "🐯", hint: "两只老虎跑得快", notes: [0, 2, 4, 0, 0, 2, 4, 0] },
  { id: "m5", title: "欢乐颂", emoji: "🎉", hint: "贝多芬第九交响曲", notes: [4, 4, 5, 7, 7, 5, 4, 2] },
  { id: "m6", title: "上行音阶", emoji: "🪜", hint: "do re mi fa sol la ti do", notes: [0, 2, 4, 5, 7, 9, 11, 12] },
];
