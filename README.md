# 🎵 音乐小星球 · Music Planet

一个为小朋友设计的**童趣音乐学习软件**，用有趣的方式学习 **节奏、音高、认音、调式**，并练习 **视唱练耳**。

> 所有声音都来自**真实录制的乐器采样**（FluidR3 GM 三角钢琴 + 木鱼），**不使用任何合成器/振荡器**模拟的音色。

## ✨ 功能

| 模块 | 玩什么 | 学什么 |
| --- | --- | --- |
| 🎹 认音闯关 | 听一个音，在钢琴键盘上找出它 | 音高辨识、唱名、五线谱 |
| 🎈 音高精灵 | 比较两个音，谁更高？ | 音高高低、音程感 |
| 🥁 节奏拍拍 | 跟着木鱼节拍拍手 | 音符时值、节奏型 |
| 🌈 调式魔法 | 探索/听辨各种调式 | 大调、小调、五声、多利亚、利底亚、蓝调 |
| 🎤 视唱练耳 | 听旋律猜歌名 · 听音模唱 | 旋律记忆、音准（麦克风实时检测） |

## 🚀 快速开始

```bash
npm install
npm run dev          # 默认 3000 端口，如被占用会自动/手动换端口
```

打开 http://localhost:3000 。首次点击页面上的「点我开始」按钮即可解锁音频（浏览器策略要求用户交互后才能播放声音）。

## 🔊 音源说明

真实采样文件位于 `public/audio/`：

- `public/audio/piano/*.mp3` — 88 键真实三角钢琴采样（FluidR3 GM soundfont）
- `public/audio/perc/*.mp3` — 真实木鱼采样（节拍器用）

如果仓库中未包含采样（二进制文件），可运行：

```bash
npm run fetch-samples
```

该脚本会从 `gleitz/midi-js-soundfonts` 下载全部 88 个钢琴采样与木鱼采样到正确位置。

## 🏗️ 技术栈

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + shadcn/ui 风格组件 + Framer Motion
- **Web Audio API** 播放真实采样（`decodeAudioData` + `AudioBufferSourceNode`）
- **自相关算法** 实现麦克风实时音高检测（`lib/pitch-detect.ts`）

## 📁 结构

```
app/
  page.tsx            首页（玩法入口、进度、勋章）
  recognize/page.tsx  认音闯关
  pitch/page.tsx      音高精灵
  rhythm/page.tsx     节奏拍拍
  scales/page.tsx     调式魔法
  ear/page.tsx        视唱练耳（含麦克风模唱）
components/           键盘、五线谱、吉祥物、反馈等
lib/
  music.ts            乐理核心（音名、唱名、调式、节奏型、旋律）
  audio-engine.ts     真实采样播放引擎 + 木鱼节拍器
  pitch-detect.ts     麦克风音高检测
```

## 🎨 设计

童趣风格：手绘描边的「贴纸/按钮」视觉、Baloo 2 圆体标题、明亮糖果配色、漂浮的吉祥物「小星」、获得星星时的爆发动效。

## 📄 许可

音源来自 FluidR3 GM soundfont（MIT / CC 授权），仅供学习用途。
