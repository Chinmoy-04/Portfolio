"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AsciiSample } from "@/components/specimen/AsciiSample";
import { profile } from "@/content/profile";
import { domainLabels, heroProjects } from "@/content/projects";
import { siteConfig } from "@/content/site.config";
import type { ParticleField } from "@/engine/particles/ParticleField";
import { scrollToElement } from "@/lib/scroll";

/*
  The hero (PLAN.md, section 7.4). One tall section with a sticky layer that
  holds the particle canvas, the headline, one text block per chapter and the
  progress rail. Scroll is measured in "spans": span 0 is the opening
  (siteConfig.openingHeightVh tall), span 1 + i is chapter i
  (siteConfig.chapterHeightVh tall).

  Each chapter has four beats over its span:
    gather   0 to 0.35   particles stream into the emblem, text fades in
    hold     0.35 to 0.7 emblem complete and slowly turning
    release  0.7 to 0.9  emblem loosens, text fades out
    drift    0.9 to 1    back to chaos; the next emblem is swapped in unseen
  After the last chapter the field thins out and the quiet field behind the
  project list takes over.

  The headline and chapter text are real HTML, server rendered. The engine is
  imported after mount, in its own chunk. Without WebGL the static ASCII
  poster stays up and the text still plays.
*/

const chapters = heroProjects;
const OPENING_VH = siteConfig.openingHeightVh;
const CHAPTER_VH = siteConfig.chapterHeightVh;
const TOTAL_VH = OPENING_VH + chapters.length * CHAPTER_VH;

/** Scroll progress (0 to 1) to spans: the opening is span 0, chapter i is span 1 + i. */
function toSpans(progress: number) {
  const vh = progress * TOTAL_VH;
  return vh < OPENING_VH ? vh / OPENING_VH : 1 + (vh - OPENING_VH) / CHAPTER_VH;
}

const GATHER = 0.35;
const HOLD = 0.7;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0 below a, 1 above b, smooth in between */
const ramp = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Morph progress for a chapter at local position u (0 to 1). */
function morph(u: number) {
  if (u < GATHER) return u / GATHER;
  if (u < HOLD) return 1;
  return 1 - (u - HOLD) / (1 - HOLD);
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const tickRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field: ParticleField | null = null;
    let emblem = -1;
    let spans = 0;
    let active = -2;

    /* Everything visible is a function of one number: scroll position in spans. */
    const apply = (s: number) => {
      spans = s;

      const opening = openingRef.current;
      if (opening) {
        const o = 1 - ramp(0.3, 0.8, s);
        opening.style.opacity = String(o);
        opening.style.transform = `translateY(${(1 - o) * -24}px)`;
      }

      const current = Math.min(chapters.length - 1, Math.floor(s) - 1);
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const u = s - (1 + i);
        const o = u < 0 || u > 1 ? 0 : ramp(0.08, 0.3, u) * (1 - ramp(0.7, 0.86, u));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * (u < 0.5 ? 24 : -24)}px)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });

      if (current !== active) {
        active = current;
        tickRefs.current.forEach((tick, i) => {
          if (!tick) return;
          if (i === current) tick.setAttribute("aria-current", "step");
          else tick.removeAttribute("aria-current");
        });
      }

      if (!field) return;
      const index = Math.max(0, current);
      if (index !== emblem) {
        emblem = index;
        field.setEmblem(index);
      }

      const u = current < 0 ? 0 : clamp01(s - (1 + current));
      const progress = current < 0 ? 0 : reduce ? 1 : morph(u);
      field.setProgress(progress);

      // Emblem on alternate sides on wide screens, above the text on narrow ones.
      const view = field.viewExtent();
      const wide = window.innerWidth >= 1024;
      const side = index % 2 === 0 ? 1 : -1;
      field.setLayout(
        wide
          ? {
              x: side * view.width * 0.46,
              y: -0.05,
              scale: Math.min(1.35, view.height * 0.72, view.width * 0.4),
            }
          : {
              x: 0,
              y: view.height * 0.32,
              scale: Math.min(1.35, view.width * 0.8, view.height * 0.5),
            },
      );
      field.setLayout({ rotation: reduce ? 0 : (u - 0.5) * side * -0.7 });

      // The field thins out over the last chapter's drift, ready for the hand-off.
      const last = s - chapters.length;
      field.setOpacity(1 - 0.65 * ramp(0.75, 1, last));
    };

    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(toSpans(self.progress)),
      onRefresh: (self) => apply(toSpans(self.progress)),
    });
    apply(toSpans(trigger.progress));

    // Render only while the sticky layer is on screen. The first report usually
    // arrives before the field exists, so it is kept and applied once it does.
    let onScreen = true;
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      field?.setRunning(onScreen);
    });
    visibility.observe(sticky);

    let cancelled = false;
    (async () => {
      const [{ detectTier, isTier, TIERS }, { loadEmblem }, { ParticleField }, { DEFAULT_ASCII }] =
        await Promise.all([
          import("@/engine/quality"),
          import("@/engine/particles/emblem"),
          import("@/engine/particles/ParticleField"),
          import("@/engine/ascii/AsciiPass"),
        ]);
      const forced = new URLSearchParams(window.location.search).get("tier");
      const tier = isTier(forced) ? forced : detectTier();

      const css = getComputedStyle(document.documentElement);
      const display = css.getPropertyValue("--font-archivo").trim();
      const mono = css.getPropertyValue("--font-jetbrains").trim();
      const clouds = await Promise.all(
        chapters.map((p) =>
          loadEmblem(
            { emblem: p.hero!.emblem, name: p.name, accentRegion: p.hero!.accentRegion },
            TIERS[tier].particles,
            { fontFamily: display },
          ),
        ),
      );
      await document.fonts.load(`500 12px ${mono}`);
      if (cancelled) return;

      const finePointer = window.matchMedia("(pointer: fine)").matches;
      field = new ParticleField({
        canvas,
        tier,
        clouds,
        ink: css.getPropertyValue("--text").trim(),
        accent: css.getPropertyValue("--accent").trim(),
        ascii: DEFAULT_ASCII,
        asciiEmblems: chapters.map((p) => p.hero!.emblem.kind !== "text"),
        asciiFont: mono,
        pointer: finePointer && !reduce,
      });
      field.setRunning(onScreen);
      emblem = -1;
      apply(spans);
      if (posterRef.current) posterRef.current.style.opacity = "0";
    })().catch((e: unknown) => {
      // The poster stays up; the hero text still plays without the canvas.
      console.warn("Hero field unavailable:", e);
    });

    return () => {
      cancelled = true;
      trigger.kill();
      visibility.disconnect();
      field?.dispose();
    };
  }, []);

  /* A keyboard user tabbing into a hidden chapter is scrolled to it. */
  const reveal = (slug: string, el: HTMLElement | null) => {
    if (!el || Number(el.style.opacity) > 0.5) return;
    const anchor = document.getElementById(`chapter-${slug}`);
    if (anchor) scrollToElement(anchor);
  };

  const [first, ...rest] = profile.name.split(" ");

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Introduction"
      className="relative"
      style={{ height: `calc(${TOTAL_VH}vh + 100dvh)` }}
    >
      {/* Chapter anchors for the progress rail, placed mid-hold. */}
      {chapters.map((p, i) => (
        <div
          key={p.slug}
          id={`chapter-${p.slug}`}
          aria-hidden="true"
          className="absolute left-0 h-px w-px"
          style={{ top: `${OPENING_VH + (i + 0.55) * CHAPTER_VH}vh` }}
        />
      ))}

      <div ref={stickyRef} data-cursor="field" className="sticky top-0 h-[100dvh] overflow-hidden">
        <div
          ref={posterRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[var(--nav-h)] bottom-1/3 flex items-center justify-center opacity-70 transition-opacity duration-700 lg:justify-end lg:pr-[var(--gutter)]"
        >
          <AsciiSample className="text-[7px] sm:text-[9px] lg:text-[11px] xl:text-[12px]" />
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        <div className="relative mx-auto h-full max-w-[1400px] px-[var(--gutter)]">
          <div ref={openingRef} className="absolute inset-x-[var(--gutter)] bottom-12 lg:bottom-16">
            <h1 className="hero-name">
              {first}
              <br />
              {rest.join(" ")}
            </h1>
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <p className="max-w-[34ch] text-lg leading-snug lg:text-xl">{profile.roleLine}</p>
              {/* "View projects" lives in the pinned top bar, so the hero does not repeat it. */}
              <p className="type-mono text-muted max-w-[44ch] lg:text-right">
                <span className="text-accent">Open to Werkstudent and internship roles.</span>
                <br />
                {profile.location}
              </p>
            </div>
          </div>

          {chapters.map((p, i) => (
            <article
              key={p.slug}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
              aria-labelledby={`chapter-title-${p.slug}`}
              className={`pointer-events-none absolute right-[var(--gutter)] bottom-12 left-[var(--gutter)] opacity-0 lg:top-1/2 lg:bottom-auto lg:w-[min(34rem,40%)] lg:-translate-y-1/2 ${
                // Odd chapters sit on the right, clear of the progress rail.
                i % 2 === 0 ? "lg:right-auto" : "lg:right-[calc(var(--gutter)+4rem)] lg:left-auto"
              }`}
            >
              <p className="type-label text-muted">
                <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                {" / "}
                {String(chapters.length).padStart(2, "0")}
                <span className="ml-4">{domainLabels[p.domain]}</span>
                <span className="ml-4">{p.year}</span>
              </p>
              <h2 id={`chapter-title-${p.slug}`} className="type-h1 mt-4">
                {p.name}
              </h2>
              <p className="mt-5 max-w-[42ch] text-lg leading-snug">{p.oneLine}</p>
              <a
                href={`#p-${p.slug}`}
                onFocus={() => reveal(p.slug, chapterRefs.current[i])}
                className="link type-label mt-8 inline-block"
              >
                Read the project <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>

        {siteConfig.features.progressRail && (
          <nav
            aria-label="Chapters"
            className="absolute top-1/2 right-[var(--gutter)] z-[var(--z-rail)] hidden -translate-y-1/2 md:block"
          >
            <ol className="flex flex-col items-end gap-3">
              {chapters.map((p, i) => (
                <li key={p.slug}>
                  <a
                    ref={(el) => {
                      tickRefs.current[i] = el;
                    }}
                    href={`#chapter-${p.slug}`}
                    className="rail-tick type-label group flex items-center gap-3 py-1"
                  >
                    <span className="rail-label">{p.name}</span>
                    <span aria-hidden="true" className="rail-bar" />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
}
