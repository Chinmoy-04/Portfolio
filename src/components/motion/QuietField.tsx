"use client";

import { useEffect, useRef } from "react";
import { background, drift, type BackgroundHandle } from "asciify-engine/kit";

type Rect = { left: number; top: number; width: number; height: number };

/*
  The quiet ASCII field behind Projects, About and Stack (asciify-engine,
  MIT). It fills the viewport behind this region, never reacts to the
  pointer, and goes quiet right behind every element marked data-field-clear
  so text always sits on calm ground.

  The library itself pauses off screen, holds a still frame under reduced
  motion, and leaves the page untouched without WebGL2.
*/
export function QuietField({ regionRef }: { regionRef: React.RefObject<HTMLElement | null> }) {
  const canvasHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = canvasHost.current;
    const region = regionRef.current;
    if (!host || !region) return;

    // Clear rects are viewport coordinates, so they change with scroll and
    // layout. Return the same array until one of those moves.
    let cache: Rect[] = [];
    let cacheKey = "";
    let layoutVersion = 0;
    const observer = new ResizeObserver(() => {
      layoutVersion++;
    });
    observer.observe(region);

    const rects = () => {
      const key = `${window.scrollY}|${window.innerWidth}|${window.innerHeight}|${layoutVersion}`;
      if (key === cacheKey) return cache;
      cacheKey = key;
      const next: Rect[] = [];
      region.querySelectorAll<HTMLElement>("[data-field-clear]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return;
        next.push({ left: r.left, top: r.top, width: r.width, height: r.height });
      });
      cache = next;
      return cache;
    };

    let handle: BackgroundHandle | null = null;
    try {
      handle = background(host, {
        preset: drift,
        ink: "--field-ink",
        accent: "--muted",
        cursor: false,
        opacity: 0.55,
        clear: rects,
        clearPadding: 18,
        clearSoftness: 48,
        clearStrength: 0.95,
      });
    } catch {
      // No WebGL or the field failed: the page is complete without it.
    }

    return () => {
      observer.disconnect();
      handle?.destroy();
    };
  }, [regionRef]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div ref={canvasHost} className="sticky top-0 h-[100dvh] w-full" />
    </div>
  );
}
