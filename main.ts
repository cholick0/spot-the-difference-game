// Spot the Difference — the hand-in program (Node 22, standard library only).
//
// This repository holds a static browser game under game/ and its screenshots
// under screenshots/. This program copies both into the grader's output
// directory and writes /output/dossier.json with the vendored make.fun
// library, so the gate and the judge can read exactly what was submitted.
//
// Run it locally the same way the grader does, with the output directory
// overridden by an environment variable:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, dereference: true });
}

function fail(message) {
  throw new Error(`spot-the-difference hand-in: ${message}`);
}

// The game itself: plain static files, nothing to build.
const gameDir = join(repoRoot, 'game');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
copyTree(gameDir, join(outputDir, 'game'));

// The screenshots: 3 or 4 images, each at most 256 KiB, checked here so a
// bad screenshot fails loudly instead of silently failing the gate.
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort();
if (shots.length < 3 || shots.length > 4) fail(`expected 3 or 4 screenshots, found ${shots.length}`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) fail(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
}
copyTree(shotsDir, join(outputDir, 'screenshots'));

// The dossier the judge reads, built from exactly the files just copied.
mkdirSync(outputDir, { recursive: true });
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
