import { canvas2d, type Cloud, makeRng, type Rng, sampleRaster } from "./sample";

/*
  Generator emblems (docs/PLAN.md, section 6). Each one draws its emblem on a
  512 px square canvas twice: once whole, once with only its accent region.
  The two rasters are sampled the same way as SVG emblems, so generators and
  SVGs share one look.

  A generator takes the point count and a seeded random source and returns a
  cloud in the format described in sample.ts. Layout randomness must come
  from `rng`, so a reload gives the same emblem.
*/
export type Generator = (count: number, rng: Rng) => Cloud;

type Part = "shape" | "accent";
type Draw = (ctx: CanvasRenderingContext2D, part: Part) => void;
type Point = [number, number];

const SIZE = 512;

function drawn(draw: Draw, count: number, rng: Rng): Cloud {
  const paint = (part: Part) => {
    const ctx = canvas2d(SIZE, SIZE);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    draw(ctx, part);
    return ctx.getImageData(0, 0, SIZE, SIZE);
  };
  return sampleRaster(paint("shape"), paint("accent"), count, {
    seed: Math.floor(rng() * 2 ** 31),
  });
}

function dot(ctx: CanvasRenderingContext2D, [x, y]: Point, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ring(ctx: CanvasRenderingContext2D, [x, y]: Point, r: number, width: number) {
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r - width / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number) {
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

/* Line from a to b, trimmed so it stops at the edge of two nodes. */
function link(
  ctx: CanvasRenderingContext2D,
  a: Point,
  ra: number,
  b: Point,
  rb: number,
  w: number,
) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  line(ctx, [a[0] + ux * ra, a[1] + uy * ra], [b[0] - ux * rb, b[1] - uy * rb], w);
}

/* ShopCrew: five agents in a graph. The approval node at the bottom is the accent. */
const agentGraph: Generator = (count, rng) => {
  const nodes: Point[] = [
    [256, 96],
    [104, 256],
    [256, 256],
    [408, 256],
    [256, 416],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [2, 4],
    [3, 4],
  ];
  const r = 52;
  return drawn(
    (ctx, part) => {
      if (part === "shape") {
        edges.forEach(([a, b]) => link(ctx, nodes[a], r + 10, nodes[b], r + 10, 12));
        nodes.slice(0, 4).forEach((n) => {
          ring(ctx, n, r, 16);
          dot(ctx, n, 16);
        });
      }
      dot(ctx, nodes[4], r);
    },
    count,
    rng,
  );
};

/* Three outlined document pages along the bottom, shared by the RAG emblems. */
function pages(ctx: CanvasRenderingContext2D) {
  [-1, 0, 1].forEach((k) => {
    const x = 256 + k * 96 - 34;
    const y = 372;
    ctx.lineWidth = 9;
    ctx.strokeRect(x, y, 68, 92);
    for (let l = 0; l < 3; l++) line(ctx, [x + 16, y + 24 + l * 20], [x + 52, y + 24 + l * 20], 7);
  });
}

/*
  RAG Eval Engine, earlier version: three document pages feeding a score
  gauge. The needle is the accent. Kept so it can be switched back in.
*/
const scoreGauge: Generator = (count, rng) => {
  const c: Point = [256, 300];
  const radius = 200;
  const score = 0.78;
  const angle = Math.PI + Math.PI * score;
  const tip: Point = [c[0] + Math.cos(angle) * 168, c[1] + Math.sin(angle) * 168];
  return drawn(
    (ctx, part) => {
      if (part === "shape") {
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.arc(c[0], c[1], radius - 14, Math.PI, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI + (Math.PI * i) / 10;
          const inner = i % 5 === 0 ? 130 : 146;
          const p = (r: number): Point => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
          line(ctx, p(inner), p(166), 9);
        }
        pages(ctx);
      }
      line(ctx, c, tip, 16);
      dot(ctx, c, 26);
    },
    count,
    rng,
  );
};

/*
  RAG Eval Engine: three document pages under a radar chart of five Ragas
  metrics. The run's score polygon is the accent.
*/
const scoreRadar: Generator = (count, rng) => {
  const c: Point = [256, 196];
  const radius = 156;
  const scores = [0.92, 0.7, 0.84, 0.58, 0.78];
  const at = (i: number, r: number): Point => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  };
  const outline = (points: Point[], width: number) => {
    return (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = width;
      ctx.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.stroke();
    };
  };
  const rings = [1, 0.66, 0.33].map((f) =>
    outline(
      [0, 1, 2, 3, 4].map((i) => at(i, radius * f)),
      8,
    ),
  );
  const score = scores.map((s, i) => at(i, radius * s));
  return drawn(
    (ctx, part) => {
      if (part === "shape") {
        rings.forEach((ring) => ring(ctx));
        for (let i = 0; i < 5; i++) line(ctx, c, at(i, radius), 6);
        pages(ctx);
      }
      outline(score, 16)(ctx);
      score.forEach((p) => dot(ctx, p, 15));
    },
    count,
    rng,
  );
};

/* Air Gesture Controller: the 21 hand keypoints and their bones. Fingertips are the accent. */
const handSkeleton: Generator = (count, rng) => {
  // Wrist, then four joints per finger from base to tip: thumb, index, middle, ring, pinky.
  const k: Point[] = [
    [256, 476],
    [194, 432],
    [146, 384],
    [114, 334],
    [92, 288],
    [196, 300],
    [186, 220],
    [180, 168],
    [176, 120],
    [252, 290],
    [252, 200],
    [252, 142],
    [252, 88],
    [304, 298],
    [314, 218],
    [320, 166],
    [324, 122],
    [348, 322],
    [368, 262],
    [380, 220],
    [390, 180],
  ];
  const bones = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [9, 10],
    [10, 11],
    [11, 12],
    [13, 14],
    [14, 15],
    [15, 16],
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],
    [5, 9],
    [9, 13],
    [13, 17],
  ];
  const tips = [4, 8, 12, 16, 20];
  return drawn(
    (ctx, part) => {
      if (part === "shape") {
        bones.forEach(([a, b]) => line(ctx, k[a], k[b], 10));
        k.forEach((p, i) => !tips.includes(i) && dot(ctx, p, 14));
      }
      tips.forEach((i) => dot(ctx, k[i], 19));
    },
    count,
    rng,
  );
};

/* LightRAG Local: a knowledge graph of about thirty nodes. The central hub is the accent. */
const knowledgeGraph: Generator = (count, rng) => {
  const hub: Point = [256, 256];
  const clusters: { at: Point; leaves: Point[] }[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (rng() - 0.5) * 0.4 - Math.PI / 2;
    const r = 130 + rng() * 30;
    const at: Point = [hub[0] + Math.cos(a) * r, hub[1] + Math.sin(a) * r];
    const leaves: Point[] = [];
    const m = 3 + (i % 2) + (i === 0 ? 1 : 0);
    for (let j = 0; j < m; j++) {
      const la = a + (j - (m - 1) / 2) * 0.62 + (rng() - 0.5) * 0.2;
      const lr = 62 + rng() * 26;
      leaves.push([at[0] + Math.cos(la) * lr, at[1] + Math.sin(la) * lr]);
    }
    clusters.push({ at, leaves });
  }
  return drawn(
    (ctx, part) => {
      if (part === "shape") {
        clusters.forEach(({ at, leaves }, i) => {
          link(ctx, hub, 0, at, 0, 6);
          leaves.forEach((l) => link(ctx, at, 0, l, 0, 4));
          // A few cross links between neighbouring clusters.
          if (i % 2 === 0) link(ctx, at, 0, clusters[(i + 1) % n].at, 0, 4);
        });
        clusters.forEach(({ at, leaves }) => {
          dot(ctx, at, 18);
          leaves.forEach((l) => dot(ctx, l, 10));
        });
      }
      dot(ctx, hub, 34);
    },
    count,
    rng,
  );
};

export const generators = {
  "agent-graph": agentGraph,
  "score-gauge": scoreGauge,
  "score-radar": scoreRadar,
  "hand-skeleton": handSkeleton,
  "knowledge-graph": knowledgeGraph,
} satisfies Record<string, Generator>;

/** Ids a project's `{ kind: "generator" }` emblem may name. */
export type GeneratorId = keyof typeof generators;

export function sampleGenerator(id: string, count: number, seed = 1): Cloud {
  const generate = (generators as Record<string, Generator>)[id];
  if (!generate) throw new Error(`Unknown emblem generator "${id}"`);
  return generate(count, makeRng(seed));
}
