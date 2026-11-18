"use client";

import { useEffect, useRef, useState } from "react";
import { type Emblem, heroProjects, type Project } from "@/content/projects";
import { type AsciiSettings, DEFAULT_ASCII } from "@/engine/ascii/AsciiPass";
import type { ParticleField, ParticleStats } from "@/engine/particles/ParticleField";

/*
  Alternative emblems per project slug, kept so a project can switch later.
  SVG options live in public/emblems/options/<slug>-<option>.svg; generator
  options are ids from engine/particles/generators.ts. Each uses the same
  accent as the project's current emblem.
*/
const OPTIONS: Record<string, string[]> = {
  subspacead: ["bottle", "screw", "patches"],
  shopcrew: ["bag", "grid", "store"],
  paintops: ["sedan", "suv", "front"],
  "rag-eval-engine": ["bars", "radar", "page"],
  "air-gesture-controller": ["swipe", "pi"],
  "lightrag-local": ["tree", "laptop", "rings"],
  "german-air": ["outline", "lungs", "chart"],
};

const GENERATOR_OPTIONS: Record<string, string[]> = {
  "rag-eval-engine": ["score-gauge"],
  "air-gesture-controller": ["hand-skeleton"],
};

type Choice = { id: string; label: string; project: Project; emblem: Emblem };

const GROUPS: { project: Project; choices: Choice[] }[] = heroProjects.map((project) => ({
  project,
  choices: [
    { id: `${project.slug}:current`, label: "Current", project, emblem: project.hero!.emblem },
    ...(OPTIONS[project.slug] ?? []).map((option) => ({
      id: `${project.slug}:${option}`,
      label: `Option: ${option}`,
      project,
      emblem: { kind: "svg", src: `/emblems/options/${project.slug}-${option}.svg` } as Emblem,
    })),
    ...(GENERATOR_OPTIONS[project.slug] ?? []).map((id) => ({
      id: `${project.slug}:${id}`,
      label: `Generator: ${id}`,
      project,
      emblem: { kind: "generator", id } as Emblem,
    })),
    { id: `${project.slug}:text`, label: "Text fallback", project, emblem: { kind: "text" } },
  ],
}));

const CHOICES = GROUPS.flatMap((g) => g.choices);

type NumberKey = {
  [K in keyof AsciiSettings]: AsciiSettings[K] extends number ? K : never;
}[keyof AsciiSettings];

const SLIDERS: { key: NumberKey; label: string; min: number; max: number; step: number }[] = [
  { key: "cellWidth", label: "Cell width px", min: 4, max: 16, step: 1 },
  { key: "cellHeight", label: "Cell height px", min: 6, max: 24, step: 1 },
  { key: "gain", label: "Gain", min: 0.5, max: 10, step: 0.1 },
  { key: "fade", label: "Fade faint glyphs", min: 0, max: 1, step: 0.05 },
  { key: "haze", label: "Faint brightness", min: 0, max: 3, step: 0.05 },
  { key: "smoothMs", label: "Smoothing ms", min: 0, max: 600, step: 10 },
  { key: "hold", label: "Glyph hold", min: 0, max: 0.5, step: 0.05 },
  { key: "radius", label: "Pull radius px", min: 0, max: 240, step: 1 },
  { key: "strength", label: "Pull strength", min: 0, max: 2, step: 0.05 },
  { key: "cap", label: "Pull cap px", min: 0, max: 80, step: 1 },
  { key: "recoveryMs", label: "Recovery ms", min: 100, max: 5000, step: 50 },
  { key: "memoryMs", label: "Trail memory ms", min: 100, max: 4000, step: 50 },
  { key: "trail", label: "Trail density", min: 0, max: 1, step: 0.01 },
];

/* Faint to dense. Blocks are outside the loaded font subset and use a fallback face. */
const CHARSETS: { label: string; chars: string }[] = [
  { label: "Plan default", chars: ".:-+*=%@#&" },
  { label: "Classic short", chars: ".:-=+*#%@" },
  { label: "Soft dots", chars: "·.:•oO0@" },
  { label: "Binary", chars: ".:01" },
  { label: "Crosses", chars: "·.+×xX#" },
  { label: "Lines", chars: ".,-~=#" },
  { label: "Letters", chars: ".,:;i1tfLCG08@" },
  {
    label: "Long ramp",
    chars: ".'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  },
  { label: "Blocks", chars: "░▒▓█" },
];

/*
  Phase 3 and 4 checkpoint: scrub one emblem between chaos and order, print it
  through the ASCII pass, and tune the look. Add ?tier=high|mid|low to force a
  quality tier. The three.js engine is imported on demand, so it lands in its
  own chunk.
*/
export function ParticleDebug() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [emblemId, setEmblemId] = useState(CHOICES[0].id);
  const choice = CHOICES.find((c) => c.id === emblemId)!;
  const step = (by: number) => {
    const i = CHOICES.findIndex((c) => c.id === emblemId);
    setEmblemId(CHOICES[(i + by + CHOICES.length) % CHOICES.length].id);
  };
  const [stats, setStats] = useState<ParticleStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asciiOn, setAsciiOn] = useState(true);
  const [ascii, setAscii] = useState<AsciiSettings>(DEFAULT_ASCII);
  const asciiRef = useRef<AsciiSettings | null>(DEFAULT_ASCII);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let field: ParticleField | null = null;

    (async () => {
      const [{ detectTier, isTier, TIERS }, { loadEmblem }, { ParticleField }] = await Promise.all([
        import("@/engine/quality"),
        import("@/engine/particles/emblem"),
        import("@/engine/particles/ParticleField"),
      ]);
      const forced = new URLSearchParams(window.location.search).get("tier");
      const tier = isTier(forced) ? forced : detectTier();

      const css = getComputedStyle(document.documentElement);
      const { emblem, project } = CHOICES.find((c) => c.id === emblemId)!;
      const cloud = await loadEmblem(
        { emblem, name: project.name, accentRegion: project.hero?.accentRegion },
        TIERS[tier].particles,
        { fontFamily: css.getPropertyValue("--font-archivo").trim() },
      );
      const mono = css.getPropertyValue("--font-jetbrains").trim();
      await document.fonts.load(`500 12px ${mono}`);
      if (cancelled) return;

      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      field = new ParticleField({
        canvas,
        tier,
        clouds: [cloud],
        ink: css.getPropertyValue("--text").trim(),
        accent: css.getPropertyValue("--accent").trim(),
        onStats: setStats,
        ascii: asciiRef.current ?? undefined,
        asciiEmblems: [emblem.kind !== "text"],
        asciiFont: mono,
        pointer: finePointer && !reduced,
      });
      field.setProgress(progressRef.current);
      fieldRef.current = field;
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
      field?.dispose();
      fieldRef.current = null;
    };
  }, [emblemId]);

  const updateAscii = (next: AsciiSettings | null) => {
    asciiRef.current = next;
    fieldRef.current?.setAscii(next);
  };

  const tune = (patch: Partial<AsciiSettings>) => {
    const next = { ...ascii, ...patch };
    setAscii(next);
    if (asciiOn) updateAscii(next);
  };

  const toggleAscii = (on: boolean) => {
    setAsciiOn(on);
    updateAscii(on ? ascii : null);
  };

  const scrub = (value: number) => {
    progressRef.current = value;
    setProgress(value);
    fieldRef.current?.setProgress(value);
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-cursor="field"
        className="absolute inset-0 h-full w-full"
      />

      <header className="absolute top-0 left-0 px-[var(--gutter)] pt-6">
        <p className="type-label text-muted">Phase 4 debug. Not part of the public site.</p>
        <h1 className="type-h2 mt-2">Particle engine: {choice.project.name}</h1>
      </header>

      <aside className="border-line bg-bg/80 type-mono text-muted absolute top-6 right-[var(--gutter)] w-72 border p-4 text-xs backdrop-blur-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={asciiOn}
            onChange={(e) => toggleAscii(e.target.checked)}
            className="accent-accent"
          />
          ASCII pass
        </label>
        {choice.emblem.kind === "text" && (
          <p className="mt-2">Text emblems always print as points.</p>
        )}

        <fieldset disabled={!asciiOn} className="mt-3 space-y-2 disabled:opacity-40">
          <label className="block">
            Charset
            <select
              value={CHARSETS.find((c) => c.chars === ascii.charset)?.chars ?? ""}
              onChange={(e) => e.target.value && tune({ charset: e.target.value })}
              className="border-line bg-bg text-text mt-1 block w-full border px-2 py-1"
            >
              <option value="">Custom</option>
              {CHARSETS.map((c) => (
                <option key={c.label} value={c.chars}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              aria-label="Charset"
              value={ascii.charset}
              onChange={(e) => e.target.value.trim() && tune({ charset: e.target.value })}
              className="border-line bg-bg text-text mt-1 block w-full border px-2 py-1"
            />
          </label>
          {SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={key} className="block">
              <span className="flex justify-between">
                {label}
                <span className="text-text">{ascii[key]}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={ascii[key]}
                onChange={(e) => tune({ [key]: Number(e.target.value) })}
                className="accent-accent block w-full"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(JSON.stringify(ascii, null, 2))}
          className="border-line text-text hover:border-accent mt-3 w-full border px-2 py-1"
        >
          Copy values
        </button>
      </aside>

      <div className="border-line bg-bg/80 absolute inset-x-0 bottom-0 border-t px-[var(--gutter)] py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="type-label text-muted w-14">Chaos</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => scrub(Number(e.target.value))}
            aria-label="Morph progress, chaos to order"
            className="accent-accent h-2 flex-1"
          />
          <span className="type-label text-muted w-14 text-right">Order</span>
        </div>

        <div className="type-mono text-muted mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            Emblem
            <select
              value={emblemId}
              onChange={(e) => setEmblemId(e.target.value)}
              className="border-line bg-bg text-text border px-2 py-1"
            >
              {GROUPS.map((g) => (
                <optgroup key={g.project.slug} label={g.project.name}>
                  {g.choices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.project.name}: {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="border-line text-text hover:border-accent border px-2 py-1"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="border-line text-text hover:border-accent border px-2 py-1"
            >
              Next
            </button>
          </span>
          <span>progress {progress.toFixed(3)}</span>
          {stats && (
            <>
              <span className={stats.fps > 0 && stats.fps < 55 ? "text-accent" : "text-text"}>
                {stats.fps > 0 ? `${stats.fps} fps` : "measuring…"}
              </span>
              <span>tier {stats.tier}</span>
              <span>{stats.particles.toLocaleString("en")} particles</span>
              <span>quality drops {stats.drops}</span>
            </>
          )}
          {error && <span className="text-accent">Error: {error}</span>}
        </div>
      </div>
    </main>
  );
}
