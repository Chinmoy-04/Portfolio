"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AsciiSample } from "@/components/specimen/AsciiSample";
import { profile } from "@/content/profile";
import { domainLabels, heroProjects } from "@/content/projects";
import { siteConfig } from "@/content/site.config";
import type { ParticleField } from "@/engine/particles/ParticleField";
import { sound } from "@/engine/sound";
import { scrollToElement } from "@/lib/scroll";
import { enterGate, heroLive, introVariant } from "./intro";

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
  imported after mount, in its own chunk.

  Fallbacks (PLAN.md, section 9):
    static          No WebGL 2, no JavaScript, ?webgl=0, or the field fails to
                    start or loses its context: the page drops <html
                    data-hero="live"> and CSS (globals.css) shows the ASCII
                    poster behind the headline, then the project list. The
                    chapters are hidden. No pinning, no scroll timeline.
    reduced motion  A still frame per chapter: the emblem is shown whole,
                    time stands still in the field, and chapters fade from one
                    to the next instead of morphing.

  Openings (section 7.5), picked before first paint by the script in
  page.tsx, which writes <html data-intro>:
    counter  a 0 to 100 counter that tracks the real loading work, capped at
             siteConfig.introMaxMs. At 100 the digits hand over to particles
             in the same shape, which dissolve into the flowing field; then
             the headline fades in out of the background. Without the field
             it simply fades out and the headline fades in.
    name     only flowing particles at first; then they assemble into the
             name, in the headline's place and size, and the role line fades
             in. Scrolling scatters the name again. CSS (globals.css) hides
             the headline before first paint and shows it after the cap if the
             field never starts.
    none     the headline over the chaos field, immediately

  The counter can wait on an Enter button (siteConfig.enterGate, ?enter=):
    before   the counter shows 0 and waits; Enter starts the count
    after    the counter waits at 100; Enter starts the dissolve
  "Enter" turns sound on, "Enter without sound" turns it off. The click is
  what lets the browser play the opening's sound (engine/sound.ts): a riser
  under the count and a shimmer under the dissolve. Scrolling past the
  opening skips the button. While a button is pending (<html data-enter>, set
  before first paint) the CSS cap that clears the counter is stretched to
  GATE_CAP_MS, so a page whose script stalls still clears; once the button
  shows, the cap is off.
*/

const chapters = heroProjects;
/**
 * Index of the opening's own cloud, packed after the chapter emblems: the name
 * for the name opening, "100" for the counter.
 */
const INTRO_EMBLEM = chapters.length;
/** The headline's two lines: first name, then the rest */
const [first, ...rest] = profile.name.split(" ");
/** The counter never finishes sooner than this, so it reads as a count, not a flash */
const COUNTER_MIN_MS = 1400;
/** How long the particles flow freely before they gather into the name */
const NAME_DELAY_MS = 1200;
const NAME_ASSEMBLE_MS = 1800;
/** Extra brightness for the free-flowing particles in the openings (1 = double) */
const CHAOS_BOOST = 1.6;
/** Extra brightness for the ASCII chaos between the opening and the first chapter */
const ASCII_CHAOS_BOOST = 3;
/** Counter hand-over, in ms from 100: particles dissolve, headline fades in, boost settles */
const DISSOLVE = { start: 400, end: 1700, reveal: 1300, settle: 3200 };
/** Width of the counter's ASCII bar, in characters */
const BAR_CELLS = 32;
const BAR_RAMP = ".:-+*=%@#";
const FIELD_FADE_MS = 900;
/** With an Enter button pending, CSS clears the counter after this anyway (globals.css) */
const GATE_CAP_MS = 12_000;
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
  const nameRef = useRef<HTMLHeadingElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const counterValueRef = useRef<HTMLSpanElement>(null);
  const barFillRef = useRef<HTMLSpanElement>(null);
  const barRestRef = useRef<HTMLSpanElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const tickRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  /** Set by the effect while the Enter button waits; true means with sound */
  const enterRef = useRef<((withSound: boolean) => void) | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !canvas || !heroLive()) return;
    const counter = counterRef.current;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field: ParticleField | null = null;
    let emblem = -1;
    let spans = 0;
    let active = -2;
    let onScreen = true;
    let cancelled = false;

    const intro = introVariant();
    const nameIntro = intro === "name";
    const counterIntro = intro === "counter";
    // The script runs the counter from here on, so CSS stops its timed reveal
    // of the headline and waits for reveal() (globals.css).
    if (counterIntro) document.documentElement.dataset.counterLive = "";
    /** 0 to 1: how far the opening's cloud has formed (the name, or "100") */
    let introT = 0;
    /** 0 to 1: how much of the chaos brightness boost is in play */
    let boost = nameIntro ? 1 : 0;
    /**
     * 0 to 1: the field's brightness behind the opening text. The counter fades
     * it to 0 as the name appears; scrolling towards the first chapter brings
     * the particles back.
     */
    let openingField = 1;
    /** The name opening's name has formed at least once */
    let nameFormed = false;
    /** Where the opening's cloud sits, in scene units, measured from its HTML twin */
    let introLayout = { x: 0, y: 0, scale: 1 };
    /** 0 to 1: field brightness. The counter holds it at 0 until it is done. */
    let fieldIn = intro === "counter" ? 0 : 1;
    let lastProgress = 0;
    let lastEmblem = -1;
    /** Runs step every frame until it returns false or the hero unmounts. */
    const animate = (step: (now: number) => boolean) => {
      const run = (now: number) => {
        if (!cancelled && step(now)) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    };

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
      // The name and counter openings show their own cloud, drawn as plain points
      // (text breaks up in ASCII). Once it has dissolved for good (the counter
      // after its fade-out, the name once formed and scrolled apart) the chaos
      // prints in ASCII like the chapters, all the way to the first emblem.
      const introProgress = introT * (1 - ramp(0.02, 0.45, s));
      const introShown = counterIntro
        ? introT > 0 || openingField > 0
        : nameIntro && (!nameFormed || introProgress > 0);
      const naming = introShown && current < 0;
      const index = naming ? INTRO_EMBLEM : Math.max(0, current);
      if (index !== emblem) {
        emblem = index;
        field.setEmblem(index);
      }

      const u = current < 0 ? 0 : clamp01(s - (1 + current));
      const progress = naming ? introProgress : current < 0 ? 0 : reduce ? 1 : morph(u);
      field.setProgress(progress);

      // Emblem on alternate sides on wide screens, above the text on narrow ones.
      const view = field.viewExtent();
      const wide = window.innerWidth >= 1024;
      const side = index % 2 === 0 ? 1 : -1;
      const above = narrowLayouts[index];
      field.setLayout(
        naming
          ? introLayout
          : wide
            ? {
                x: side * view.width * 0.46,
                y: -0.05,
                scale: Math.min(1.35, view.height * 0.72, view.width * 0.4),
              }
            : (above ?? {
                x: 0,
                y: view.height * 0.32,
                scale: Math.min(1.35, view.width * 0.8, view.height * 0.5),
              }),
      );
      field.setLayout({ rotation: reduce || naming ? 0 : (u - 0.5) * side * -0.7 });

      // The field thins out over the last chapter's drift, ready for the hand-off.
      const last = s - chapters.length;
      const behindOpening = current < 0 ? Math.max(openingField, ramp(0.5, 1, s)) : 1;
      // Under reduced motion each chapter is a still frame; it fades out and
      // the next fades in, so the emblems never swap in plain sight.
      const still = !reduce
        ? 1
        : current < 0
          ? 1 - ramp(0.85, 1, s)
          : ramp(0, 0.15, u) * (current === chapters.length - 1 ? 1 : 1 - ramp(0.85, 1, u));
      const opacity = (1 - 0.65 * ramp(0.75, 1, last)) * fieldIn * behindOpening * still;
      // Spread-out chaos reads as faint specks, so the openings lift it while
      // the particles flow freely, and ease back as a shape forms or settles.
      // In ASCII, scattered particles mostly fall below the first glyph, so the
      // stretch from the opening into the first chapter is lifted too, easing
      // off as the first emblem gathers.
      const lift = naming
        ? CHAOS_BOOST * boost * (1 - progress)
        : ASCII_CHAOS_BOOST * (1 - ramp(0.9, 1.3, s));
      field.setOpacity(opacity * (1 + lift));

      // Sound follows the morph; a tone when an emblem locks into place.
      const locked = progress >= 0.999;
      if (locked && (lastProgress < 0.999 || index !== lastEmblem)) sound.chime(index);
      lastProgress = progress;
      lastEmblem = index;
      sound.update(progress, onScreen ? opacity : 0);
    };

    /* The opening's cloud takes the place and size of its HTML twin's text. */
    const measureIntro = () => {
      const el = nameIntro ? nameRef.current : counterValueRef.current;
      if (!field || !el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const view = field.viewExtent();
      introLayout = {
        x: ((r.left + r.width / 2 - c.left) / c.width - 0.5) * 2 * view.width,
        y: (0.5 - (r.top + r.height / 2 - c.top) / c.height) * 2 * view.height,
        scale: (r.width / c.width) * view.width,
      };
    };
    /*
      Narrow screens: each emblem fills the space between the top bar and its
      chapter's text, whatever the text's length. Measured once per resize
      (offsetTop ignores the fade's transform), never during scroll.
    */
    let narrowLayouts: { x: number; y: number; scale: number }[] = [];
    const measureNarrow = () => {
      narrowLayouts = [];
      if (!field || window.innerWidth >= 1024) return;
      const height = canvas.clientHeight;
      const view = field.viewExtent();
      const toScene = (px: number) => (px / height) * 2 * view.height;
      const nav = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
      const gap = 24;
      chapterRefs.current.forEach((el, i) => {
        const parent = el?.offsetParent as HTMLElement | null;
        if (!el || !parent) return;
        const top = nav + gap;
        const bottom = parent.offsetTop + el.offsetTop - gap;
        if (bottom - top < 80) return;
        const half = Math.min((bottom - top) / 2, canvas.clientWidth * 0.4);
        narrowLayouts[i] = {
          x: 0,
          y: view.height - toScene((top + bottom) / 2),
          scale: Math.min(1.35, toScene(half)),
        };
      });
    };
    /* The canvas changed size: everything placed in scene units is placed again. */
    const onFieldResize = () => {
      measureIntro();
      measureNarrow();
      apply(spans);
    };

    /* Counter opening: real loading work, shown as 0 to 100. */
    let work = 0;
    let fieldReady = false;
    let counterDone = !counterIntro;
    let fading = false;
    const fadeField = () => {
      if (fading || !counterDone || !fieldReady) return;
      fading = true;
      const start = performance.now();
      animate((now) => {
        fieldIn = reduce ? 1 : ramp(0, 1, (now - start) / FIELD_FADE_MS);
        apply(spans);
        return fieldIn < 1;
      });
    };
    /* The headline fades in out of the background (globals.css). */
    const reveal = () => {
      document.documentElement.dataset.introRevealed = "";
    };
    /* At 100: the digits hand over to particles in their shape, which dissolve. */
    const dissolveCounter = () => {
      fading = true;
      measureIntro();
      introT = 1;
      boost = 1;
      fieldIn = 1;
      apply(spans);
      counterRef.current?.classList.add("is-done");
      const start = performance.now();
      let revealed = false;
      animate((now) => {
        const t = now - start;
        introT = 1 - ramp(DISSOLVE.start, DISSOLVE.end, t);
        boost = 1 - ramp(DISSOLVE.end, DISSOLVE.settle, t);
        openingField = 1 - ramp(DISSOLVE.reveal, DISSOLVE.settle, t);
        if (!revealed && t >= DISSOLVE.reveal) {
          revealed = true;
          reveal();
        }
        apply(spans);
        return t < DISSOLVE.settle;
      });
    };
    const drawBar = (amount: number) => {
      const cells = amount * BAR_CELLS;
      const full = Math.floor(cells);
      const edge = full < BAR_CELLS ? BAR_RAMP[Math.floor((cells - full) * BAR_RAMP.length)] : "";
      if (barFillRef.current) barFillRef.current.textContent = "#".repeat(full) + edge;
      if (barRestRef.current) {
        barRestRef.current.textContent = ".".repeat(Math.max(0, BAR_CELLS - full - 1));
      }
    };
    const finishCounter = () => {
      counterDone = true;
      if (fieldReady && !reduce) {
        sound.dissolve();
        dissolveCounter();
      } else {
        // No field yet (or reduced motion): a plain fade, and the particles
        // stay away until scrolling heads for the first chapter.
        openingField = 0;
        counterRef.current?.classList.add("is-done");
        reveal();
        fadeField();
      }
    };
    /** Counts from `start` (ms since navigation); 0 keeps the cap in step with globals.css. */
    const runCounter = (start: number) => {
      let shown = 0;
      animate((now) => {
        const t = now - start;
        const target = Math.min(work, t / COUNTER_MIN_MS);
        shown += Math.max(0, target - shown) * 0.2;
        const finished =
          (work >= 1 && t >= COUNTER_MIN_MS) || t >= siteConfig.introMaxMs || spans > 0.3;
        if (counterValueRef.current) {
          counterValueRef.current.textContent = String(finished ? 100 : Math.floor(shown * 100));
        }
        drawBar(finished ? 1 : shown);
        sound.riser(finished ? 1 : shown);
        if (!finished) return true;
        sound.riserStop();
        if (gate === "after" && spans <= 0.3) waitForEnter(finishCounter);
        else finishCounter();
        return false;
      });
    };
    /* Shows the Enter buttons and runs `next` once one is pressed, or the visitor scrolls on. */
    const waitForEnter = (next: () => void) => {
      const counter = counterRef.current;
      counter?.classList.add("is-gated");
      let waiting = true;
      const go = () => {
        if (!waiting) return;
        waiting = false;
        enterRef.current = null;
        counter?.classList.remove("is-gated");
        next();
      };
      enterRef.current = (withSound) => {
        sound.choose(withSound);
        go();
      };
      animate(() => {
        if (spans > 0.3) go();
        return waiting;
      });
    };
    // Past the stretched cap, CSS has cleared the counter already: no button.
    const gate = counterIntro && performance.now() < GATE_CAP_MS ? enterGate() : "none";
    if (gate === "none") delete document.documentElement.dataset.enter;
    if (!counterDone) {
      if (gate === "before") waitForEnter(() => runCounter(performance.now()));
      else runCounter(0);
    }

    /*
      The field failed to start or lost its context: switch to the static hero
      for the rest of the visit. The page gets much shorter, so the scroll
      trigger and every inline style the timeline wrote are dropped.
    */
    let isStatic = false;
    const goStatic = () => {
      if (isStatic) return;
      isStatic = true;
      cancelled = true;
      const root = document.documentElement;
      delete root.dataset.hero;
      delete root.dataset.enter;
      root.dataset.intro = "none";
      sound.riserStop();
      trigger.kill();
      visibility.disconnect();
      field?.dispose();
      field = null;
      sound.update(0, 0);
      posterRef.current?.style.removeProperty("opacity");
      for (const el of [openingRef.current, ...chapterRefs.current]) {
        el?.style.removeProperty("opacity");
        el?.style.removeProperty("transform");
        el?.style.removeProperty("pointer-events");
      }
      ScrollTrigger.refresh();
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("Hero field lost its WebGL context; showing the static hero.");
      goStatic();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

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
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      field?.setRunning(onScreen);
      apply(spans);
    });
    visibility.observe(sticky);

    (async () => {
      const [{ detectTier, isTier, TIERS }, { loadEmblem }, { ParticleField }, { DEFAULT_ASCII }] =
        await Promise.all([
          import("@/engine/quality"),
          import("@/engine/particles/emblem"),
          import("@/engine/particles/ParticleField"),
          import("@/engine/ascii/AsciiPass"),
        ]);
      // Loading steps for the counter: imports, each cloud, the glyph font, shaders.
      const sources = chapters.map((p) => ({
        emblem: p.hero!.emblem,
        name: p.name,
        accentRegion: p.hero!.accentRegion,
      }));
      if (nameIntro || counterIntro)
        sources.push({
          emblem: { kind: "text" },
          name: nameIntro ? `${first}\n${rest.join(" ")}`.toUpperCase() : "100",
          accentRegion: undefined,
        });
      const steps = sources.length + 3;
      let done = 1;
      const step = () => (work = ++done / steps);
      work = done / steps;
      const forced = new URLSearchParams(window.location.search).get("tier");
      const tier = isTier(forced) ? forced : detectTier();

      const css = getComputedStyle(document.documentElement);
      const display = css.getPropertyValue("--font-archivo").trim();
      const mono = css.getPropertyValue("--font-jetbrains").trim();
      const clouds = await Promise.all(
        sources.map((source, i) =>
          loadEmblem(source, TIERS[tier].particles, {
            fontFamily: display,
            // The opening's text matches its HTML twin: wide cut, lines flush left.
            ...(i === INTRO_EMBLEM && { fontStretch: "expanded", align: "left" }),
          }).then((cloud) => {
            step();
            return cloud;
          }),
        ),
      );
      await document.fonts.load(`500 12px ${mono}`);
      step();
      if (cancelled) return;

      const finePointer = window.matchMedia("(pointer: fine)").matches;
      field = new ParticleField({
        canvas,
        tier,
        clouds,
        ink: css.getPropertyValue("--text").trim(),
        accent: css.getPropertyValue("--accent").trim(),
        // A still frame has nothing to smooth towards, so cells settle at once.
        ascii: reduce ? { ...DEFAULT_ASCII, smoothMs: 0 } : DEFAULT_ASCII,
        asciiEmblems: sources.map((source) => source.emblem.kind !== "text"),
        asciiFont: mono,
        pointer: finePointer && !reduce,
        still: reduce,
        onResize: onFieldResize,
        onReady: () => {
          if (cancelled) return;
          step();
          fieldReady = true;
          fadeField();
          if (nameIntro) assembleName();
        },
      });
      field.setRunning(onScreen);
      // The constructor's first resize runs before `field` is assigned.
      measureNarrow();
      emblem = -1;
      apply(spans);
      if (posterRef.current) posterRef.current.style.opacity = "0";
    })().catch((e: unknown) => {
      if (cancelled) return;
      console.warn("Hero field unavailable; showing the static hero.", e);
      goStatic();
    });

    /* Name opening: the particles gather into the name and the headline steps aside. */
    const assembleName = () => {
      const root = document.documentElement;
      root.dataset.nameLive = "";
      measureIntro();
      const start = performance.now() + (reduce ? 0 : NAME_DELAY_MS);
      animate((now) => {
        introT = reduce ? 1 : clamp01((now - start) / NAME_ASSEMBLE_MS);
        apply(spans);
        if (introT < 1) return true;
        root.dataset.nameFormed = "";
        nameFormed = true;
        return false;
      });
    };

    return () => {
      cancelled = true;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      delete document.documentElement.dataset.nameLive;
      delete document.documentElement.dataset.nameFormed;
      delete document.documentElement.dataset.introRevealed;
      delete document.documentElement.dataset.counterLive;
      // data-enter belongs to the pre-paint script, so it stays for the next mount.
      counter?.classList.remove("is-gated");
      enterRef.current = null;
      sound.riserStop();
      trigger.kill();
      visibility.disconnect();
      field?.dispose();
    };
  }, []);

  /* A keyboard user tabbing into a hidden chapter is scrolled to it. */
  const reveal = (slug: string, el: HTMLElement | null) => {
    if (!el || !heroLive() || Number(el.style.opacity) > 0.5) return;
    const anchor = document.getElementById(`chapter-${slug}`);
    if (anchor) scrollToElement(anchor);
  };

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Introduction"
      className="hero relative"
      style={
        {
          "--hero-h": `calc(${TOTAL_VH}vh + 100dvh)`,
          "--intro-cap": `${siteConfig.introMaxMs + 300}ms`,
          "--gate-cap": `${GATE_CAP_MS}ms`,
        } as React.CSSProperties
      }
    >
      {/* Chapter anchors for the progress rail, placed mid-hold. */}
      {chapters.map((p, i) => (
        <div
          key={p.slug}
          id={`chapter-${p.slug}`}
          aria-hidden="true"
          className="hero-anchor absolute left-0 h-px w-px"
          style={{ top: `${OPENING_VH + (i + 0.55) * CHAPTER_VH}vh` }}
        />
      ))}

      <div
        ref={stickyRef}
        data-cursor="field"
        className="hero-stage sticky top-0 h-[100dvh] overflow-hidden"
      >
        {/* Counter opening. Shown before first paint by CSS when <html data-intro="counter">,
            and faded out by CSS at the cap even if the script never runs. First in the
            stage, so its Enter buttons come right after the top bar in tab order. */}
        <div
          ref={counterRef}
          className="intro-counter bg-bg absolute inset-0 z-[calc(var(--z-rail)+1)] flex-col justify-end px-[var(--gutter)] pb-12 lg:pb-16"
        >
          <div className="mx-auto w-full max-w-[1400px]">
            <p aria-hidden="true" className="intro-count tabular-nums">
              <span ref={counterValueRef}>0</span>
            </p>
            <p aria-hidden="true" className="type-mono mt-6 overflow-hidden whitespace-pre">
              <span ref={barFillRef} className="text-text" />
              <span ref={barRestRef} className="text-dim">
                {".".repeat(BAR_CELLS)}
              </span>
            </p>
            {/* Shown by CSS while the counter waits (.is-gated). */}
            <div className="intro-enter mt-10 flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => enterRef.current?.(true)}
                className="btn btn-primary btn-lg"
              >
                Enter
              </button>
              <button
                type="button"
                onClick={() => enterRef.current?.(false)}
                className="btn btn-ghost btn-lg"
              >
                Enter without sound
              </button>
            </div>
          </div>
        </div>

        <div
          ref={posterRef}
          aria-hidden="true"
          className="hero-poster pointer-events-none absolute inset-x-0 top-[var(--nav-h)] bottom-1/3 flex items-center justify-center opacity-70 transition-opacity duration-700 lg:justify-end lg:pr-[var(--gutter)]"
        >
          <AsciiSample className="text-[7px] sm:text-[9px] lg:text-[11px] xl:text-[12px]" />
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          // Large viewport height: the canvas keeps its size while a phone's
          // address bar slides in and out, so the renderer is not resized mid-scroll.
          className="hero-canvas pointer-events-none absolute inset-x-0 top-0 h-[100lvh] w-full"
        />

        <div className="relative mx-auto h-full max-w-[1400px] px-[var(--gutter)]">
          <div
            ref={openingRef}
            className="hero-opening absolute inset-x-[var(--gutter)] bottom-12 lg:bottom-16"
          >
            <h1 ref={nameRef} className="hero-name transition-opacity duration-700">
              {/* The space keeps the accessible name "Chinmoy Jyoti Bora" across the break. */}
              {first} <br />
              {rest.join(" ")}
            </h1>
            <div className="hero-sub mt-8 flex flex-col gap-6 transition-opacity duration-700 lg:flex-row lg:items-end lg:justify-between">
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
              className={`hero-chapter pointer-events-none absolute right-[var(--gutter)] bottom-12 left-[var(--gutter)] opacity-0 lg:top-1/2 lg:bottom-auto lg:w-[min(34rem,40%)] lg:-translate-y-1/2 ${
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
                // Seven links share the visible text; the label tells them apart.
                aria-label={`Read the project: ${p.name}`}
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
            className="hero-rail absolute top-1/2 right-[var(--gutter)] z-[var(--z-rail)] hidden -translate-y-1/2 md:block"
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
