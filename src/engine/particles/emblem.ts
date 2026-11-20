import type { Emblem } from "@/content/projects";
import { sampleGenerator } from "./generators";
import { type Cloud, sampleSvg, sampleText } from "./sample";

export type EmblemSource = {
  emblem: Emblem;
  /** The project name, used by text emblems */
  name: string;
  accentRegion?: string;
};

/** Samples any emblem kind from projects.ts into a cloud of `count` points. */
export async function loadEmblem(
  { emblem, name, accentRegion }: EmblemSource,
  count: number,
  {
    fontFamily,
    fontStretch,
    align,
  }: { fontFamily?: string; fontStretch?: CanvasFontStretch; align?: "center" | "left" } = {},
): Promise<Cloud> {
  switch (emblem.kind) {
    case "svg":
      return sampleSvg(emblem.src, count, { accentId: accentRegion, depth: emblem.depth });
    case "generator":
      return sampleGenerator(emblem.id, count);
    case "text":
      // The canvas falls back to another face silently if the font is not loaded yet.
      if (fontFamily) await document.fonts.load(`900 160px ${fontFamily}`);
      return sampleText(name, count, { fontFamily, fontStretch, align });
    case "glb":
      throw new Error("GLB emblems are not supported yet");
  }
}
