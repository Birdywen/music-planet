export interface ModeDef {
  id: string;
  title: string;
  emoji: string;
  color: string;
  desc: string;
  href: string;
}

export const MODES: ModeDef[] = [
  { id: "recognize", title: "认音闯关", emoji: "🎹", color: "var(--grape)", desc: "听声音，在键盘上找出它", href: "/recognize" },
  { id: "pitch", title: "音高精灵", emoji: "🎈", color: "var(--sky)", desc: "比一比，谁的声音更高", href: "/pitch" },
  { id: "rhythm", title: "节奏拍拍", emoji: "🥁", color: "var(--tangerine)", desc: "跟着节拍一起拍手", href: "/rhythm" },
  { id: "scales", title: "调式魔法", emoji: "🌈", color: "var(--mint)", desc: "认识大调、小调与各种调式", href: "/scales" },
  { id: "ear", title: "视唱练耳", emoji: "🎤", color: "var(--bubble)", desc: "听音模唱，做一个小歌唱家", href: "/ear" },
];
