import { CanvasTexture, NearestFilter } from "three";

/*
  Glyph atlas (docs/PLAN.md, section 7.2). Every glyph is drawn once into one row
  of cells, each exactly one character cell in device pixels, so the post pass
  can copy texels one to one and the glyphs stay crisp.
*/

/** Glyph 0 is always a space, so the darkest cells print nothing. */
export function glyphList(charset: string): string[] {
  return [" ", ...Array.from(charset).filter((c) => c.trim() !== "")];
}

export function bakeAtlas(
  glyphs: string[],
  cellW: number,
  cellH: number,
  fontFamily: string,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = glyphs.length * cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  // Largest size that fits the cell height, then shrunk if a wide glyph overflows.
  let size = cellH * 0.9;
  ctx.font = `500 ${size}px ${fontFamily}, monospace`;
  const widest = Math.max(...glyphs.map((g) => ctx.measureText(g).width));
  if (widest > cellW * 0.95) size *= (cellW * 0.95) / widest;

  ctx.font = `500 ${size}px ${fontFamily}, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  glyphs.forEach((g, i) => ctx.fillText(g, i * cellW + cellW / 2, cellH / 2));

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}
