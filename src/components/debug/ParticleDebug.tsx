"use client";

import { useEffect, useRef, useState } from "react";
import type { Emblem } from "@/content/projects";
import { projects } from "@/content/projects";
import type { ParticleField, ParticleStats } from "@/engine/particles/ParticleField";

const project = projects.find((p) => p.slug === "subspacead")!;

const EMBLEMS: { id: string; label: string; emblem: Emblem }[] = [
  { id: "svg", label: "SVG emblem", emblem: project.hero!.emblem },
  { id: "text", label: "Text fallback", emblem: { kind: "text" } },
];

/*
  Phase 3 checkpoint: scrub one emblem between chaos and order, and read the
  frame rate. Add ?tier=high|mid|low to force a quality tier. The three.js
  engine is imported on demand, so it lands in its own chunk.
*/
export function ParticleDebug() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [emblemId, setEmblemId] = useState(EMBLEMS[0].id);
  const [stats, setStats] = useState<ParticleStats | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const emblem = EMBLEMS.find((e) => e.id === emblemId)!.emblem;
      const cloud = await loadEmblem(
        { emblem, name: project.name, accentRegion: project.hero?.accentRegion },
        TIERS[tier].particles,
        { fontFamily: css.getPropertyValue("--font-archivo").trim() },
      );
      if (cancelled) return;

      field = new ParticleField({
        canvas,
        tier,
        clouds: [cloud],
        ink: css.getPropertyValue("--text").trim(),
        accent: css.getPropertyValue("--accent").trim(),
        onStats: setStats,
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
        <p className="type-label text-muted">Phase 3 debug. Not part of the public site.</p>
        <h1 className="type-h2 mt-2">Particle engine: {project.name}</h1>
      </header>

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
              {EMBLEMS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
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
