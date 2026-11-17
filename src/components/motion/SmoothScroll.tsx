"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToElement, setLenis } from "@/lib/scroll";
import "lenis/dist/lenis.css";

/*
  Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger (phase 5)
  reads the same scroll position every frame.

  Off on touch screens (native momentum is better there) and under
  prefers-reduced-motion. In both cases the page scrolls natively and every
  anchor still works.
*/
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({ lerp: 0.1, respectReducedMotion: true });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Same-page anchor links: glide to the target, offset for the top bar,
    // and still update the URL and fire hashchange (project rows listen).
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href*='#']");
      if (!link || link.target) return;

      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) {
        return;
      }
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      const oldURL = location.href;
      history.pushState(null, "", url.hash);
      window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: location.href }));
      scrollToElement(target);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
