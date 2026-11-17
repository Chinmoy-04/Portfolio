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
      },
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.monitor = new FrameMonitor(TIERS[tier].minFps, () => this.dropTier());
    this.applyTier();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    this.frame = requestAnimationFrame(this.loop);
  }

  setProgress(progress: number) {
    this.material.uniforms.uProgress.value = Math.min(1, Math.max(0, progress));
  }

  setEmblem(index: number) {
    this.material.uniforms.uRowOffset.value = index * this.rowsPerEmblem;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.geometry.dispose();
    this.material.uniforms.uTargets.value.dispose();
    this.material.dispose();
    this.renderer.dispose();
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
    const density = Math.sqrt(TIERS.high.particles / count);
    this.material.uniforms.uPointSize.value = BASE_POINT_PX * dpr * CAMERA_Z * density;
  }

  private resize() {
    const canvas = this.options.canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    this.material.uniforms.uTime.value = (now - this.start) / 1000;
    this.renderer.render(this.scene, this.camera);
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
