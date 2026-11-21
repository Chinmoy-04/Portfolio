import { type EnterGate, type IntroVariant, siteConfig } from "@/content/site.config";

const VARIANTS: IntroVariant[] = ["counter", "name", "none"];
const GATES: EnterGate[] = ["before", "after", "none"];

/**
 * Inline script for the home page, run before first paint:
 *  - <html data-hero="live"> when the browser has WebGL 2 (three.js needs it).
 *    Without it, or with ?webgl=0, the attribute stays off and CSS lays the
 *    hero out as the name over a static poster, followed by the project list. That is
 *    also what a visitor without JavaScript gets.
 *  - <html data-intro> picks the opening from ?intro= or siteConfig.intro.
 *    The static hero always uses "none": the other two need the field.
 *  - <html data-enter="before|after"> when the counter waits on an Enter
 *    button (?enter= or siteConfig.enterGate). CSS then stretches the counter's
 *    safety cap, so a slow page still gets its button. Never set on phones,
 *    which have no sound and so no need for the click.
 *
 * Self-contained, because it is also sent as text (introScript).
 */
function pickIntro(variants: string[], gates: string[], intro: string, gate: string) {
  const q = new URLSearchParams(location.search);
  const d = document.documentElement;
  const live = !!window.WebGL2RenderingContext && q.get("webgl") !== "0";
  let v = q.get("intro") ?? "";
  if (live) d.dataset.hero = "live";
  if (!live || variants.indexOf(v) < 0) v = live ? intro : "none";
  d.dataset.intro = v;
  let g = q.get("enter") ?? "";
  if (gates.indexOf(g) < 0) g = gate;
  if (matchMedia("(max-width:639px)").matches) g = "none";
  if (v === "counter" && g !== "none") d.dataset.enter = g;
}

const pickArgs = (intro: IntroVariant, gate: EnterGate) =>
  [VARIANTS, GATES, intro, gate].map((a) => JSON.stringify(a)).join(",");

export const introScript = `(${pickIntro.toString()})(${pickArgs(siteConfig.intro, siteConfig.enterGate)})`;

/**
 * Client navigation into the home page does not run inline scripts, so the
 * attributes were never set and the hero would fall back to static. Picks
 * them now, without an opening: that is for the first load only.
 */
export function ensureIntro() {
  if (document.documentElement.dataset.intro !== undefined) return;
  pickIntro(VARIANTS, GATES, "none", "none");
}

/** The opening picked by introScript. Client only. */
export function introVariant(): IntroVariant {
  const v = document.documentElement.dataset.intro as IntroVariant | undefined;
  return v && VARIANTS.includes(v) ? v : siteConfig.intro;
}

/** The Enter button picked by introScript, or "none". Client only. */
export function enterGate(): EnterGate {
  const v = document.documentElement.dataset.enter as EnterGate | undefined;
  return v && GATES.includes(v) ? v : "none";
}

/** True when introScript found WebGL 2 and the hero runs the particle field. Client only. */
export function heroLive(): boolean {
  return document.documentElement.dataset.hero === "live";
}
