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
};

const CAMERA_Z = 6;
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
  private emblem = 0;
  private lastFrame = 0;
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
        uOpacity: { value: 0.55 },
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

    this.frame = requestAnimationFrame(this.loop);
  }

  setProgress(progress: number) {
    this.material.uniforms.uProgress.value = Math.min(1, Math.max(0, progress));
  }

  setEmblem(index: number) {
    this.emblem = index;
    this.material.uniforms.uRowOffset.value = index * this.rowsPerEmblem;
    this.material.uniforms.uDataMode.value = this.printing ? 1 : 0;
    this.applyTier();
  }

  /** Switches the ASCII pass on with these settings, or off with null. */
  setAscii(settings: AsciiSettings | null) {
    if (settings && this.ascii) {
      this.ascii.setSettings(settings);
      return;
    }
    if (settings) {
      this.ascii = new AsciiPass(this.renderer, {
        settings,
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

  private applyTier() {
    const settings = TIERS[this.tier];
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
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.1) : 0;
    this.lastFrame = now;
    this.material.uniforms.uTime.value = (now - this.start) / 1000;
    if (this.printing) this.ascii!.render(this.scene, this.camera, dt);
    else this.renderer.render(this.scene, this.camera);
    this.monitor.tick(now);

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
