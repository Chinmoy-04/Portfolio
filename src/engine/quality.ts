/*
  Device tiers and the automatic quality drop (PLAN.md, section 7.1 and 9).

  A tier is picked once at start from what the browser reports. While the
  engine runs, a FrameMonitor watches the frame rate and asks for the next
  tier down when frames stay slow. It never steps back up.
*/

export type Tier = "high" | "mid" | "low";

export type TierSettings = {
  particles: number;
  /** Device pixel ratio cap */
  maxDpr: number;
  /** Frame rate below which this tier is dropped */
  minFps: number;
  /**
   * ASCII cell size relative to the locked setting. Larger cells on the low
   * tier: fewer cells to fill, and glyphs stay legible on a small screen.
   */
  cellScale: number;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: { particles: 40_000, maxDpr: 2, minFps: 50, cellScale: 1 },
  mid: { particles: 12_000, maxDpr: 1.5, minFps: 45, cellScale: 1 },
  low: { particles: 6_000, maxDpr: 1.5, minFps: 0, cellScale: 1.5 },
};

const ORDER: Tier[] = ["high", "mid", "low"];

export function lowerTier(tier: Tier): Tier | null {
  const next = ORDER[ORDER.indexOf(tier) + 1];
  return next ?? null;
}

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (ORDER as string[]).includes(value);
}

/** Best guess at a starting tier, from pointer type, screen size, cores and memory. */
export function detectTier(): Tier {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 600;
  if (coarse && small) return "low";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (coarse || cores <= 4 || memory <= 4) return "mid";
  return "high";
}

/*
  Averages frame rate over fixed windows. Calls onSlow once per window that
  falls below the threshold for `strikes` windows in a row. The first window
  after start or a reset is ignored, since shader compiles and texture uploads
  make it slow on every device. Gaps longer than 250 ms (tab switch, debugger)
  are skipped, not counted as slow frames.
*/
export class FrameMonitor {
  fps = 0;
  private last = 0;
  private windowStart = 0;
  private frames = 0;
  private warm = false;
  private slowWindows = 0;

  constructor(
    private minFps: number,
    private onSlow: () => void,
    private windowMs = 2000,
    private strikes = 2,
  ) {}

  setThreshold(minFps: number) {
    this.minFps = minFps;
    this.reset();
  }

  reset() {
    this.last = 0;
    this.frames = 0;
    this.warm = false;
    this.slowWindows = 0;
  }

  tick(now: number) {
    if (this.last === 0 || now - this.last > 250) {
      this.last = now;
      this.windowStart = now;
      this.frames = 0;
      return;
    }
    this.last = now;
    this.frames++;

    const elapsed = now - this.windowStart;
    if (elapsed < this.windowMs) return;

    this.fps = (this.frames * 1000) / elapsed;
    this.windowStart = now;
    this.frames = 0;

    if (!this.warm) {
      this.warm = true;
      return;
    }
    if (this.fps < this.minFps) {
      this.slowWindows++;
      if (this.slowWindows >= this.strikes) {
        this.slowWindows = 0;
        this.onSlow();
      }
    } else {
      this.slowWindows = 0;
    }
  }
}
