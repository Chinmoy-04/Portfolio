/*
  Site-wide switches. Change a value here, nothing else.
*/

export type IntroVariant = "counter" | "name" | "none";
export type EnterGate = "before" | "after" | "none";
export type AccentName = "amber" | "green" | "blue";

export const siteConfig = {
  /** Public address. Update when a custom domain is attached. */
  url: "https://chinmoybora.vercel.app",

  /** Accent colour. Locked to amber on 17 Nov 2026 (Phase 0 checkpoint). */
  accent: "amber" as AccentName,

  /** Opening shown on first load. Locked to counter on 20 Nov 2026 (Phase 6 checkpoint). Overridable with ?intro=counter|name|none. */
  intro: "counter" as IntroVariant,

  /**
   * The counter opening's Enter button, which is also the click browsers need
   * before they play sound. "before": the counter waits at 0 for it. "after":
   * it appears at 100. "none": no button. Overridable with ?enter=.
   * Locked to "after" on 20 Nov 2026.
   */
  enterGate: "after" as EnterGate,

  /** Longest the loading counter may run, in milliseconds. */
  introMaxMs: 3000,

  /** Scroll height of the hero's opening (the name), in viewport heights. */
  openingHeightVh: 100,

  /** Scroll height of each hero chapter, in viewport heights. */
  chapterHeightVh: 200,

  features: {
    customCursor: true,
    progressRail: true,
    sound: true,
    analytics: true,
  },
} as const;
