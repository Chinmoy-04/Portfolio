import type Lenis from "lenis";

/*
  One place that knows whether smooth scrolling is on. Components call
  scrollToElement and never touch Lenis directly, so the site behaves the
  same with Lenis (desktop) and without it (touch, reduced motion).

  The gap under the fixed top bar comes only from `scroll-padding-top` on
  <html> (globals.css). Both Lenis and native scrolling read it, so no extra
  offset is added here, and sections must not set their own scroll-margin.
*/

let instance: Lenis | null = null;
/** Set while something holds the page still (the hero's Enter button); lifts it. */
let hold: (() => void) | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis() {
  return instance;
}

/** A scroll request lifts the hold first, so a link never lands on a frozen page. */
export function setScrollHold(release: (() => void) | null) {
  hold = release;
}

export function scrollToElement(el: HTMLElement, { immediate = false } = {}) {
  hold?.();
  if (instance) {
    instance.scrollTo(el, { immediate });
  } else {
    el.scrollIntoView({ block: "start", behavior: immediate ? "instant" : "auto" });
  }
}
