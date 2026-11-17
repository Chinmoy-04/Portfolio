import {
  HalfFloatType,
  NearestFilter,
  ShaderMaterial,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/*
  Pointer displacement field (PLAN.md, section 7.3). One texel per character
  cell, ping-ponged between two targets each frame:
    R, G  how far that cell's sample point is pulled, in device px
    B     trail strength, 0 to 1

  Cells the pointer sweeps over are pulled against its motion, so the image
  drags along with the cursor, then ease back over `recoveryMs`. A thin trail
  is left along the path and fades over `memoryMs`. All in device px, origin
  at the bottom left, matching gl_FragCoord.
*/

export type PointerSettings = {
  /** Reach of the pull, CSS px */
  radius: number;
  /** Share of the pointer's motion passed to the image */
  strength: number;
  /** Time for a pulled cell to settle back, ms */
  recoveryMs: number;
  /** Largest pull, CSS px */
  cap: number;
  /** Time for the trail to fade, ms */
  memoryMs: number;
};

const fragmentShader = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uGrid;
uniform vec2 uCellPx;
uniform vec2 uPointer;
uniform vec2 uPointerPrev;
uniform float uActive;
uniform float uRadius;
uniform float uStrength;
uniform float uCap;
uniform float uDecay;
uniform float uTrailDecay;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  return length(p - a - ab * t);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec4 prev = texture2D(uPrev, (cell + 0.5) / uGrid);
  vec2 center = (cell + 0.5) * uCellPx;

  vec2 offset = prev.xy * uDecay;
  float trail = prev.z * uTrailDecay;

  if (uActive > 0.5) {
    vec2 motion = uPointer - uPointerPrev;
    // Distance to the whole path this frame, so fast moves leave no gaps.
    float d = segmentDistance(center, uPointerPrev, uPointer);
    float f = 1.0 - smoothstep(0.0, uRadius, d);
    offset -= motion * f * f * uStrength;
    float len = length(offset);
    if (len > uCap) offset *= uCap / len;

    float moving = smoothstep(0.5, 3.0, length(motion));
    float core = 1.0 - smoothstep(0.0, uRadius * 0.3, d);
    trail = max(trail, core * moving);
  }

  gl_FragColor = vec4(offset, trail, 1.0);
}
`;

const vertexShader = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

function makeTarget(cols: number, rows: number) {
  return new WebGLRenderTarget(cols, rows, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  });
}

export class PointerField {
  private targets: [WebGLRenderTarget, WebGLRenderTarget];
  private material: ShaderMaterial;
  private quad: FullScreenQuad;
  private dpr = 1;
  private pointer: { x: number; y: number } | null = null;
  private prev: { x: number; y: number } | null = null;

  constructor(private settings: PointerSettings) {
    this.targets = [makeTarget(1, 1), makeTarget(1, 1)];
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPrev: { value: null },
        uGrid: { value: [1, 1] },
        uCellPx: { value: [1, 1] },
        uPointer: { value: [0, 0] },
        uPointerPrev: { value: [0, 0] },
        uActive: { value: 0 },
        uRadius: { value: 0 },
        uStrength: { value: 0 },
        uCap: { value: 0 },
        uDecay: { value: 1 },
        uTrailDecay: { value: 1 },
      },
    });
    this.quad = new FullScreenQuad(this.material);
  }

  /** The current field, read by the cell pass. */
  get texture() {
    return this.targets[0].texture;
  }

  setSettings(settings: PointerSettings) {
    this.settings = settings;
  }

  /** Grid size in cells and cell size in device px. Clears the field. */
  resize(cols: number, rows: number, cellPxW: number, cellPxH: number, dpr: number) {
    this.dpr = dpr;
    this.targets.forEach((t) => t.setSize(cols, rows));
    this.material.uniforms.uGrid.value = [cols, rows];
    this.material.uniforms.uCellPx.value = [cellPxW, cellPxH];
    this.prev = null;
  }

  /** Pointer in device px from the bottom left, or null when it is away. */
  setPointer(point: { x: number; y: number } | null) {
    this.pointer = point;
  }

  update(renderer: WebGLRenderer, dt: number) {
    const s = this.settings;
    const u = this.material.uniforms;
    // Exponential settle: about 95% recovered after recoveryMs.
    u.uDecay.value = Math.exp(-dt / (s.recoveryMs / 3000));
    u.uTrailDecay.value = Math.exp(-dt / (s.memoryMs / 3000));
    u.uRadius.value = s.radius * this.dpr;
    u.uStrength.value = s.strength;
    u.uCap.value = s.cap * this.dpr;

    const p = this.pointer;
    u.uActive.value = p && this.prev ? 1 : 0;
    if (p) {
      u.uPointer.value = [p.x, p.y];
      u.uPointerPrev.value = this.prev ? [this.prev.x, this.prev.y] : [p.x, p.y];
    }
    this.prev = p ? { ...p } : null;

    const [read, write] = this.targets;
    u.uPrev.value = read.texture;
    renderer.setRenderTarget(write);
    this.quad.render(renderer);
    renderer.setRenderTarget(null);
    this.targets = [write, read];
  }

  dispose() {
    this.targets.forEach((t) => t.dispose());
    this.material.dispose();
    this.quad.dispose();
  }
}
