// Download the real instrument samples used by 音乐小星球.
// Run:  node scripts/fetch-samples.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const PIANO_BASE =
  "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/";
const PERC_BASE = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/woodblock-mp3/";

function pianoNames() {
  const names = ["A0", "Bb0", "B0"];
  for (let o = 1; o <= 7; o++) {
    for (const n of ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]) {
      names.push(`${n}${o}`);
    }
  }
  names.push("C8");
  return names;
}

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log("skip", dest);
    return true;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error("fail", url, res.status);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log("ok  ", dest);
  return true;
}

async function main() {
  const pianoDir = join(root, "public/audio/piano");
  const percDir = join(root, "public/audio/perc");
  await mkdir(pianoDir, { recursive: true });
  await mkdir(percDir, { recursive: true });

  let ok = 0;
  for (const n of pianoNames()) {
    if (await download(PIANO_BASE + n + ".mp3", join(pianoDir, n + ".mp3"))) ok++;
  }
  for (const n of ["A2", "A3", "A4", "A5"]) {
    await download(PERC_BASE + n + ".mp3", join(percDir, `wb_${n}.mp3`));
  }
  console.log(`\nDone. ${ok} piano samples ready.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
