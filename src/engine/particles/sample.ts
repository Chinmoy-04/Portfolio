/*
  Emblem sampling: turns an emblem into a point cloud of exactly `count`
  points (docs/PLAN.md, section 7.1).

  A cloud is a Float32Array of `count * 4` numbers: x, y, z, accent.
  x and y are centred and scaled so the longer side spans -1 to 1, y up.
  accent is 1 for points inside the emblem's accent region, else 0.

  Points come out in random order, so any prefix of a cloud is an even
  subsample of the whole shape. The engine relies on this to drop particles
  for a lower quality tier without sampling again.
*/

export type Cloud = Float32Array;

export type Rng = () => number;

/** Small seeded generator (mulberry32), so a reload gives the same emblem. */
export function makeRng(seed = 1): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RasterOptions = {
  /** Half the thickness given to the flat shape, in the same units as x and y */
  depth?: number;
  /** Share of points placed on the outline, for crisp silhouettes */
  edgeShare?: number;
  seed?: number;
};

/*
  Samples filled pixels of a raster. `shape` decides what is inside the
  emblem; `accent`, when given, flags points that also fall inside it.
*/
export function sampleRaster(
  shape: ImageData,
  accent: ImageData | null,
  count: number,
  { depth = 0.08, edgeShare = 0.35, seed = 1 }: RasterOptions = {},
): Cloud {
  const { width: w, height: h, data } = shape;
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 127;

  const fill: number[] = [];
  const edge: number[] = [];
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const i = y * w + x;
      fill.push(i);
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) {
        edge.push(i);
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (fill.length === 0) throw new Error("Emblem raster is empty");

  const cx = (minX + maxX + 1) / 2;
  const cy = (minY + maxY + 1) / 2;
  const half = Math.max(maxX - minX + 1, maxY - minY + 1) / 2;

  const rng = makeRng(seed);
  const out = new Float32Array(count * 4);
  for (let n = 0; n < count; n++) {
    const pool = edge.length > 0 && rng() < edgeShare ? edge : fill;
    const i = pool[Math.floor(rng() * pool.length)];
    const px = i % w;
    const py = (i - px) / w;
    const isAccent = accent ? accent.data[i * 4 + 3] > 127 : false;

    out[n * 4] = (px + rng() - cx) / half;
    out[n * 4 + 1] = -(py + rng() - cy) / half;
    out[n * 4 + 2] = (rng() * 2 - 1) * depth;
    out[n * 4 + 3] = isAccent ? 1 : 0;
  }
  return out;
}

export function canvas2d(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

async function rasteriseSvg(svgText: string, size: number): Promise<ImageData> {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ctx = canvas2d(size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/*
  SVG emblem. The element whose id matches `accentId` (and everything inside
  it) is the accent region. The SVG should be square; it is drawn to fill a
  square raster.
*/
export async function sampleSvg(
  src: string,
  count: number,
  { accentId, size = 512, ...options }: RasterOptions & { accentId?: string; size?: number } = {},
): Promise<Cloud> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not load emblem ${src} (${res.status})`);
  const text = await res.text();

  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  root.setAttribute("width", String(size));
  root.setAttribute("height", String(size));
  const shape = await rasteriseSvg(new XMLSerializer().serializeToString(root), size);

  let accent: ImageData | null = null;
  if (accentId && doc.getElementById(accentId)) {
    // Same drawing with everything hidden except the accent element.
    const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `* { visibility: hidden; } #${CSS.escape(accentId)}, #${CSS.escape(accentId)} * { visibility: visible; }`;
    root.insertBefore(style, root.firstChild);
    accent = await rasteriseSvg(new XMLSerializer().serializeToString(root), size);
  }

  return sampleRaster(shape, accent, count, options);
}

/** Text emblem: the project name set in type. No accent region. */
export function sampleText(
  text: string,
  count: number,
  {
    fontFamily = "sans-serif",
    fontStretch = "normal",
    align = "center",
    ...options
  }: RasterOptions & {
    fontFamily?: string;
    fontStretch?: CanvasFontStretch;
    /** How lines sit against each other */
    align?: "center" | "left";
  } = {},
): Cloud {
  // "\n" in the text starts a new line; lines are aligned by `align`.
  const lines = text.split("\n");
  const fontPx = 160;
  const linePx = fontPx * 0.95;
  const font = `900 ${fontPx}px ${fontFamily}`;
  const measure = canvas2d(1, 1);
  measure.font = font;
  measure.fontStretch = fontStretch;
  const textWidth = Math.max(...lines.map((line) => measure.measureText(line).width));
  const width = Math.ceil(textWidth) + fontPx;
  const height = Math.ceil(linePx * (lines.length - 1) + fontPx * 1.6);

  const ctx = canvas2d(width, height);
  ctx.font = font;
  ctx.fontStretch = fontStretch;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  const top = height / 2 - (linePx * (lines.length - 1)) / 2;
  const x = align === "left" ? fontPx / 2 : width / 2;
  lines.forEach((line, i) => ctx.fillText(line, x, top + i * linePx));
  return sampleRaster(ctx.getImageData(0, 0, width, height), null, count, {
    edgeShare: 0.25,
    ...options,
  });
}
