import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { ParticleDebug, type SvgOptions } from "@/components/debug/ParticleDebug";
import { heroProjects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Particle debug",
  robots: { index: false },
};

/**
  Finds public/emblems/options/<slug>-<option>.svg for each hero project. Read
  at build time, since the page is static. A file goes to the longest slug it
  starts with, so "rag-eval-engine-bars" is not an option of a project "rag".
*/
function svgOptions(): SvgOptions {
  const options: SvgOptions = Object.fromEntries(heroProjects.map((p) => [p.slug, []]));
  const slugs = heroProjects.map((p) => p.slug).sort((a, b) => b.length - a.length);
  for (const file of readdirSync(join(process.cwd(), "public/emblems/options"))) {
    const slug = slugs.find((s) => file.startsWith(`${s}-`));
    if (slug && file.endsWith(".svg")) options[slug].push(file.slice(slug.length + 1, -4));
  }
  return options;
}

export default function ParticleDebugPage() {
  return <ParticleDebug svgOptions={svgOptions()} />;
}
