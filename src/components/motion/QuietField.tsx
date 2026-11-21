"use client";

import { useEffect, useRef } from "react";
import type { BackgroundHandle } from "asciify-engine/kit";

type Rect = { left: number; top: number; width: number; height: number };

/*
  The quiet ASCII field behind Projects, About and Stack (asciify-engine,
  MIT). It fills the viewport behind this region, never reacts to the
  pointer, and goes quiet right behind each line of text inside elements
  marked data-field-clear, so text always sits on calm ground.

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

    // One rect per line of text, so the field keeps flowing between lines
    // and rows instead of going quiet over whole blocks.
    const range = document.createRange();
    const rects = () => {
      const key = `${window.scrollY}|${window.innerWidth}|${window.innerHeight}|${layoutVersion}`;
      if (key === cacheKey) return cache;
      cacheKey = key;
      const next: Rect[] = [];
      region.querySelectorAll<HTMLElement>("[data-field-clear]").forEach((el) => {
        // A closed project panel is clipped to nothing; its text is not shown.
        if (el.closest("[data-open='false']")) return;
        const box = el.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight || box.width === 0) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            if (r.bottom < 0 || r.top > window.innerHeight) continue;
            next.push({ left: r.left, top: r.top, width: r.width, height: r.height });
          }
        }
      });
      cache = next;
      return cache;
    };

    // The library loads after first paint, in its own chunk: the field sits
    // below the fold and the page is complete without it.
    let handle: BackgroundHandle | null = null;
    let cancelled = false;
    import("asciify-engine/kit")
      .then(({ background, drift }) => {
        if (cancelled) return;
        handle = background(host, {
          preset: drift,
          ink: "--field-ink",
          accent: "--muted",
          cursor: false,
          opacity: 0.55,
          clear: rects,
          clearPadding: 6,
          clearSoftness: 20,
          clearStrength: 0.95,
        });
      })
      .catch(() => {
        // No WebGL or the field failed: the page is complete without it.
      });

    return () => {
      cancelled = true;
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
