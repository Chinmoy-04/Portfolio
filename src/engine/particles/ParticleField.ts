import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LinearSRGBColorSpace,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { AsciiPass, type AsciiSettings } from "../ascii/AsciiPass";
import { FrameMonitor, lowerTier, TIERS, type Tier } from "../quality";
import { makeRng, type Cloud } from "./sample";
import { fragmentShader, vertexShader } from "./shaders";
import { packTargets } from "./targets";

export type ParticleStats = {
  fps: number;
  tier: Tier;
  particles: number;
  /** Times the automatic quality drop has fired */
  drops: number;
};

export type ParticleFieldOptions = {
  canvas: HTMLCanvasElement;
  tier: Tier;
  /** One cloud per emblem, each with at least the starting tier's particle count */
  clouds: Cloud[];
  /** Colours as hex, read from the design tokens */
  ink: string;
  accent: string;
  /** Called about twice a second */
  onStats?: (stats: ParticleStats) => void;
  /** Print through the ASCII pass. Omit to draw plain points. */
  ascii?: AsciiSettings;
  /**
   * Per emblem, whether it prints through the ASCII pass when the pass is on.
   * Missing entries print. Text emblems should not: thin letter strokes break
   * up into unreadable glyphs, so they stay as plain points.
   */
  asciiEmblems?: boolean[];
  /** Font for the ASCII glyphs. It must be loaded before the field is created. */
  asciiFont?: string;
  /** Let the pointer pull the ASCII image. Leave off for touch and reduced motion. */
  pointer?: boolean;
  /**
   * Still frames, for reduced motion: time stands still in the field and a
   * frame is drawn only when something the owner sets has changed.
   */
  still?: boolean;
  /** Called once the shaders have compiled and the first frame can draw */
  onReady?: () => void;
  /** Called after the canvas changes size, once viewExtent() reflects it */
  onResize?: () => void;
};

export type EmblemLayout = {
  /** Emblem centre in scene units; the view spans viewExtent() either side of 0 */
  x: number;
  y: number;
  /** Half the emblem's longer side, in scene units */
  scale: number;
  /** Turn about the vertical axis, radians */
  rotation: number;
};

const CAMERA_Z = 6;
const BASE_OPACITY = 0.55;
/** Point diameter in CSS px at the high tier, before perspective */
const BASE_POINT_PX = 1.6;

/*
  One canvas of morphing particles. Plain three.js, no React. The owner calls
  setProgress (0 = chaos, 1 = emblem) and setEmblem; the rest runs itself.
*/
export class ParticleField {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(35, 1, 0.1, 50);
  private geometry = new BufferGeometry();
  private material: ShaderMaterial;
  private points: Points;
  private monitor: FrameMonitor;
  private resizeObserver: ResizeObserver;
  private frame = 0;
  private start = performance.now();
  private lastStats = 0;
  private drops = 0;
  private tier: Tier;
  private ascii: AsciiPass | null = null;
  /** ASCII settings as given, before the tier's cell scale */
  private asciiSettings: AsciiSettings | null = null;
  /** Something changed since the last frame (only consulted for still frames) */
  private dirty = true;
  private emblem = 0;
  private lastFrame = 0;
  private running = true;
  /** False until the particle shader has compiled */
  private ready = false;
  private readonly capacity: number;
  private readonly rowsPerEmblem: number;

  constructor(private options: ParticleFieldOptions) {
    const { canvas, clouds, tier } = options;
    this.tier = tier;
    this.capacity = TIERS[tier].particles;

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.z = CAMERA_Z;

    // Chaos seeds fill a wide, shallow box around the emblem.
    const rng = makeRng(7);
    const seeds = new Float32Array(this.capacity * 3);
    const rand = new Float32Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      seeds[i * 3] = (rng() * 2 - 1) * 4.2;
      seeds[i * 3 + 1] = (rng() * 2 - 1) * 2.4;
      seeds[i * 3 + 2] = (rng() * 2 - 1) * 1.5;
      rand[i] = rng();
    }
    this.geometry.setAttribute("position", new BufferAttribute(seeds, 3));
    this.geometry.setAttribute("aRand", new BufferAttribute(rand, 1));

    const atlas = packTargets(clouds, this.capacity);
    this.rowsPerEmblem = atlas.rowsPerEmblem;

    // Token colours are sRGB already and this shader writes them out as is,
    // so they are passed through without colour-space conversion.
    const raw = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace);

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uTargets: { value: atlas.texture },
        uWidth: { value: atlas.width },
        uRowOffset: { value: 0 },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uSpread: { value: 0.55 },
        uEmblemScale: { value: 1.35 },
        uFlow: { value: 0.32 },
        uPointSize: { value: 1 },
        uInk: { value: raw(options.ink) },
        uAccent: { value: raw(options.accent) },
        uOpacity: { value: BASE_OPACITY },
        uOffset: { value: new Vector3() },
        uRotation: { value: 0 },
        uDataMode: { value: 0 },
      },
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.monitor = new FrameMonitor(TIERS[tier].minFps, () => this.dropTier());
    if (options.ascii) this.setAscii(options.ascii);
    this.applyTier();
    if (options.pointer) window.addEventListener("pointermove", this.onPointer);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    // Compile the particle shader before the first frame, for the canvas and
    // for the ASCII pass's target. Where the browser supports parallel
    // compiling this happens off the main thread; otherwise the first render
    // would block the page for about half a second.
    Promise.all([
      this.renderer.compileAsync(this.scene, this.camera),
      this.ascii?.compile(this.scene, this.camera),
    ])
      .catch(() => undefined)
      .then(() => {
        this.ready = true;
        this.options.onReady?.();
        if (this.running) this.frame = requestAnimationFrame(this.loop);
      });
  }

  setProgress(progress: number) {
    this.material.uniforms.uProgress.value = Math.min(1, Math.max(0, progress));
    this.dirty = true;
  }

  setEmblem(index: number) {
    this.emblem = index;
    this.material.uniforms.uRowOffset.value = index * this.rowsPerEmblem;
    this.material.uniforms.uDataMode.value = this.printing ? 1 : 0;
    this.applyTier();
    this.dirty = true;
  }

  /** Places the emblem. Missing fields keep their current value. */
  setLayout({ x, y, scale, rotation }: Partial<EmblemLayout>) {
    const u = this.material.uniforms;
    if (x !== undefined) u.uOffset.value.x = x;
    if (y !== undefined) u.uOffset.value.y = y;
    if (scale !== undefined) u.uEmblemScale.value = scale;
    if (rotation !== undefined) u.uRotation.value = rotation;
    this.dirty = true;
  }

  /** Half the visible width and height at the emblem's depth, in scene units. */
  viewExtent() {
    const height = CAMERA_Z * Math.tan((this.camera.fov * Math.PI) / 360);
    return { width: height * this.camera.aspect, height };
  }

  /** Scales particle brightness: 1 is normal, 0 is invisible. */
  setOpacity(amount: number) {
    this.material.uniforms.uOpacity.value = BASE_OPACITY * amount;
    this.dirty = true;
  }

  /** Stops or restarts the render loop, e.g. while the canvas is off screen. */
  setRunning(running: boolean) {
    if (running === this.running) return;
    this.running = running;
    cancelAnimationFrame(this.frame);
    if (running && this.ready) {
      this.lastFrame = 0;
      this.dirty = true;
      this.frame = requestAnimationFrame(this.loop);
    }
  }

  /** Switches the ASCII pass on with these settings, or off with null. */
  setAscii(settings: AsciiSettings | null) {
    this.asciiSettings = settings;
    this.dirty = true;
    if (settings && this.ascii) {
      this.ascii.setSettings(this.tierAscii(settings));
      return;
    }
    if (settings) {
      this.ascii = new AsciiPass(this.renderer, {
        settings: this.tierAscii(settings),
        ink: this.options.ink,
        accent: this.options.accent,
        fontFamily: this.options.asciiFont ?? "monospace",
      });
    } else {
      this.ascii?.dispose();
      this.ascii = null;
    }
    this.material.uniforms.uDataMode.value = this.printing ? 1 : 0;
    this.applyTier();
    this.resize();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener("pointermove", this.onPointer);
    this.ascii?.dispose();
    this.resizeObserver.disconnect();
    this.geometry.dispose();
    this.material.uniforms.uTargets.value.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  /** True when the current emblem goes through the ASCII pass. */
  private get printing() {
    return this.ascii !== null && (this.options.asciiEmblems?.[this.emblem] ?? true);
  }

  private dropTier() {
    const next = lowerTier(this.tier);
    if (!next) return;
    this.tier = next;
    this.drops++;
    this.applyTier();
    this.resize();
  }

  /** ASCII settings with the cells scaled for the current tier. */
  private tierAscii(settings: AsciiSettings): AsciiSettings {
    const k = TIERS[this.tier].cellScale;
    return { ...settings, cellWidth: settings.cellWidth * k, cellHeight: settings.cellHeight * k };
  }

  private applyTier() {
    const settings = TIERS[this.tier];
    if (this.ascii && this.asciiSettings) this.ascii.setSettings(this.tierAscii(this.asciiSettings));
    this.dirty = true;
    const count = Math.min(settings.particles, this.capacity);
    this.geometry.setDrawRange(0, count);
    this.monitor.setThreshold(settings.minFps);

    const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);
    this.renderer.setPixelRatio(dpr);
    // Fewer particles get bigger points, so the emblem keeps its weight.
    // The ASCII pass draws the scene at CSS resolution, so no pixel ratio there.
    const density = Math.sqrt(TIERS.high.particles / count);
    const pointDpr = this.printing ? 1 : dpr;
    this.material.uniforms.uPointSize.value = BASE_POINT_PX * pointDpr * CAMERA_Z * density;
  }

  private resize() {
    const canvas = this.options.canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.ascii?.resize(width, height, this.renderer.getPixelRatio());
    this.dirty = true;
    this.options.onResize?.();
  }

  private onPointer = (e: PointerEvent) => {
    if (!this.ascii) return;
    if (e.pointerType === "touch") {
      this.ascii.setPointer(null);
      return;
    }
    const rect = this.options.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    this.ascii.setPointer(inside ? { x, y } : null);
  };

  private loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    if (this.options.still && !this.dirty) return;
    this.dirty = false;
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.1) : 0;
    this.lastFrame = now;
    if (!this.options.still) this.material.uniforms.uTime.value = (now - this.start) / 1000;
    if (this.printing) this.ascii!.render(this.scene, this.camera, dt);
    else this.renderer.render(this.scene, this.camera);
    // Still frames draw only when something changed, so their rate says how
    // often the owner scrolls, not how fast the device is: no quality drop.
    if (!this.options.still) this.monitor.tick(now);

    if (this.options.onStats && now - this.lastStats > 500) {
      this.lastStats = now;
      this.options.onStats({
        fps: Math.round(this.monitor.fps),
        tier: this.tier,
        particles: this.geometry.drawRange.count,
        drops: this.drops,
      });
    }
  };
}
