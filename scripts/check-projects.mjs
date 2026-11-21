/*
  Checks src/content/projects.ts before a build, so a broken entry fails here
  with a clear message instead of silently in the browser.

    npm run check:projects        (also runs before every `npm run build`)

  Generator ids are checked by TypeScript, not here.
*/
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { projects } from "../src/content/projects.ts";

const root = join(import.meta.dirname, "..");
const errors = [];
const seen = new Set();

for (const p of projects) {
  const at = `"${p.slug}"`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug))
    errors.push(`${at}: slug must be lowercase words joined by hyphens`);
  if (seen.has(p.slug)) errors.push(`${at}: slug is used by more than one project`);
  seen.add(p.slug);

  const emblem = p.hero?.emblem;
  if (emblem?.kind !== "svg") continue;

  const file = join(root, "public", emblem.src);
  if (!emblem.src.startsWith("/") || !existsSync(file)) {
    errors.push(`${at}: emblem ${emblem.src} not found (expected public${emblem.src})`);
    continue;
  }
  const svg = readFileSync(file, "utf8");

  const viewBox = svg.match(/<svg\b[^>]*\bviewBox="([^"]+)"/);
  const [, , w, h] = viewBox
    ? viewBox[1]
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    : [];
  if (!viewBox) errors.push(`${at}: ${emblem.src} has no viewBox`);
  else if (w !== h) errors.push(`${at}: ${emblem.src} viewBox is ${w}×${h}, it must be square`);

  const accent = p.hero.accentRegion;
  if (accent && !new RegExp(`\\bid="${accent}"`).test(svg))
    errors.push(`${at}: accentRegion "${accent}" has no matching id="${accent}" in ${emblem.src}`);
}

if (errors.length) {
  console.error(`projects.ts has ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `projects.ts OK: ${projects.length} projects, ${projects.filter((p) => p.hero).length} in the hero.`,
  );
}
