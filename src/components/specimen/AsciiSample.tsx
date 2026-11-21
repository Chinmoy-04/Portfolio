/*
  Static ASCII preview for the specimen page: a hex nut emerging from sparse
  noise, with one patch flagged in the accent colour. It stands in for the
  real particle and ASCII engine (docs/PLAN.md, phases 3 and 4) so the accent can
  be judged on the kind of image it will actually sit on.
*/

const RAMP = " .:-+*=%@#&";
const COLS = 64;
const ROWS = 30;

/** Deterministic pseudo-random in [0, 1), so server and client always agree. */
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Distance to the edge of a flat-top hexagon of the given radius. */
function hexDistance(x: number, y: number, radius: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return Math.max(ax * 0.866 + ay * 0.5, ay) - radius;
}

type Cell = { char: string; accent: boolean };

function buildGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const line: Cell[] = [];
    for (let col = 0; col < COLS; col++) {
      // Character cells are about twice as tall as wide, so halve x.
      const x = (col - COLS / 2) / 2;
      const y = row - ROWS / 2;
      const outer = hexDistance(x, y, 11.5);
      const hole = Math.hypot(x, y) - 5.2;
      const inside = outer < 0 && hole > 0;

      let level = 0;
      let accent = false;

      if (inside) {
        // Shade as if lit from the top left, with a little grain.
        const light = 0.55 - (x + y) * 0.028 + (hash(col, row) - 0.5) * 0.18;
        const rim = Math.min(-outer, hole) < 1.1 ? 0.25 : 0;
        level = Math.min(1, Math.max(0.25, light + rim));
        // The anomaly: a small patch on the lower right face.
        if (Math.hypot(x - 6.6, y - 4.2) < 2.4) {
          accent = true;
          level = Math.max(level, 0.8);
        }
      } else {
        // Noise outside the part, thinning out near its edge.
        const n = hash(col * 1.7, row * 2.3);
        const falloff = Math.min(1, Math.max(0, outer) / 10 + 0.15);
        level = n > 0.86 ? (n - 0.86) * 3.2 * falloff : 0;
      }

      const index = Math.round(level * (RAMP.length - 1));
      line.push({ char: RAMP[index], accent });
    }
    grid.push(line);
  }
  return grid;
}

const GRID = buildGrid();

export function AsciiSample({
  className = "text-[9px] sm:text-[10px]",
}: {
  /** Font size and colour overrides. Defaults suit the specimen cards. */
  className?: string;
}) {
  return (
    <pre
      aria-hidden="true"
      className={`text-muted overflow-hidden font-mono leading-[1.15] select-none ${className}`}
    >
      {GRID.map((line, row) => {
        // Group consecutive cells of the same kind into one span per run.
        const runs: { text: string; accent: boolean }[] = [];
        for (const cell of line) {
          const last = runs[runs.length - 1];
          if (last && last.accent === cell.accent) last.text += cell.char;
          else runs.push({ text: cell.char, accent: cell.accent });
        }
        return (
          <span key={row} className="block">
            {runs.map((run, i) =>
              run.accent ? (
                <span key={i} className="text-accent">
                  {run.text}
                </span>
              ) : (
                run.text
              ),
            )}
          </span>
        );
      })}
    </pre>
  );
}
