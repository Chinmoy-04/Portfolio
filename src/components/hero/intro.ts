import { type IntroVariant, siteConfig } from "@/content/site.config";

const VARIANTS: IntroVariant[] = ["counter", "name", "none"];

/**
 * Inline script for the home page: picks the opening before first paint from
 * ?intro= or siteConfig.intro, and writes it to <html data-intro>. CSS uses it
 * to show the counter on the first painted frame.
 */
export const introScript = `(function(){var v=new URLSearchParams(location.search).get("intro");if(${JSON.stringify(VARIANTS)}.indexOf(v)<0)v=${JSON.stringify(siteConfig.intro)};document.documentElement.dataset.intro=v})()`;

/** The opening picked by introScript. Client only. */
export function introVariant(): IntroVariant {
  const v = document.documentElement.dataset.intro as IntroVariant | undefined;
  return v && VARIANTS.includes(v) ? v : siteConfig.intro;
}
