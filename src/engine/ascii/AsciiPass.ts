import {
  type Camera,
  type CanvasTexture,
  Color,
  HalfFloatType,
  LinearSRGBColorSpace,
  NearestFilter,
  NoBlending,
  type Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { PointerField, type PointerSettings } from "../pointer/PointerField";
import { bakeAtlas, glyphList } from "./atlas";
import { cellFragment, postFragment, quadVertex } from "./shaders";

/*
  ASCII pass (PLAN.md, section 7.2). Three steps per frame:
    1. scene  particles drawn to an offscreen target (R intensity, G accent)
    2. cell   one fragment per character cell: pointer offset, then a glyph
              picked from a luminance ramp
    3. post   each glyph stamped from the atlas, off-white or amber
  Cost scales with the number of cells, not pixels or particles.
*/

export type AsciiSettings = PointerSettings & {
  /** Character cell, CSS px */
  cellWidth: number;
  cellHeight: number;
  /** Glyphs from faint to dense. A space is added in front. */
  charset: string;
  /** Brightness before the ramp. Higher fills more cells with dense glyphs. */
  gain: number;
  /** Share of trail cells that print a glyph, 0 to 1 */
  trail: number;
  /** Time for a cell's brightness to catch up with the scene, ms. 0 is instant. */
  smoothMs: number;
  /** Extra brightness, in glyph steps, needed before a cell changes glyph, 0 to 0.5 */
  hold: number;
  /** How much faint cells are dimmed, 0 (all full ink) to 1 */
  fade: number;
  /** Brightness of faint cells, such as lone chaos particles */
  haze: number;
};

/** Locked at the Phase 4 checkpoint, 17 Nov 2026, from the debug page. */
export const DEFAULT_ASCII: AsciiSettings = {
  cellWidth: 4,
  cellHeight: 6,
  charset: ".,:;i1tfLCG08@",
  gain: 3,
  radius: 80,
  strength: 0.7,
  recoveryMs: 2000,
  cap: 24,
  memoryMs: 1200,
  trail: 1,
  smoothMs: 80,
  hold: 0.3,
  fade: 1,
  haze: 1,
};

type AsciiPassOptions = {
  settings: AsciiSettings;
  ink: string;
  accent: string;
  /** Font for the atlas. It must be loaded before the pass is created. */
  fontFamily: string;
};

function cellTarget() {
  return new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
  });
}

export class AsciiPass {
  private settings: AsciiSettings;
  private sceneTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
  /** [current, previous], swapped every frame */
  private cells: [WebGLRenderTarget, WebGLRenderTarget] = [cellTarget(), cellTarget()];
  private pointer: PointerField;
  private cellMaterial: ShaderMaterial;
  private postMaterial: ShaderMaterial;
  private cellQuad: FullScreenQuad;
  private postQuad: FullScreenQuad;
  private atlas: CanvasTexture | null = null;
  private size = { width: 1, height: 1, dpr: 1 };

  constructor(
    private renderer: WebGLRenderer,
    private options: AsciiPassOptions,
  ) {
    this.settings = options.settings;
    this.pointer = new PointerField(this.settings);

    // Token colours are sRGB already and written out as is (see ParticleField).
    const raw = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace);

    this.cellMaterial = new ShaderMaterial({
      vertexShader: quadVertex,
      fragmentShader: cellFragment,
      uniforms: {
        uScene: { value: this.sceneTarget.texture },
        uDisp: { value: null },
        uPrev: { value: null },
        uGrid: { value: [1, 1] },
        uCellPx: { value: [1, 1] },
        uView: { value: [1, 1] },
        uGain: { value: 1 },
        uTrail: { value: 0 },
        uBlend: { value: 1 },
        uHold: { value: 0 },
        uGlyphs: { value: 1 },
      },
    });
    this.postMaterial = new ShaderMaterial({
      vertexShader: quadVertex,
      fragmentShader: postFragment,
      blending: NoBlending,
      uniforms: {
        uCells: { value: null },
        uAtlas: { value: null },
        uGrid: { value: [1, 1] },
        uCellPx: { value: [1, 1] },
        uGlyphs: { value: 1 },
        uFade: { value: 0 },
        uHaze: { value: 1 },
        uInk: { value: raw(options.ink) },
        uAccent: { value: raw(options.accent) },
      },
    });
    this.cellQuad = new FullScreenQuad(this.cellMaterial);
    this.postQuad = new FullScreenQuad(this.postMaterial);
  }

  setSettings(next: AsciiSettings) {
    const prev = this.settings;
    this.settings = next;
    this.pointer.setSettings(next);
    if (
      next.cellWidth !== prev.cellWidth ||
      next.cellHeight !== prev.cellHeight ||
      next.charset !== prev.charset
    ) {
      this.layout();
    }
  }

  /** Canvas size in CSS px and the renderer's pixel ratio. */
  resize(width: number, height: number, dpr: number) {
    this.size = { width, height, dpr };
    // The scene only feeds coarse cells, so CSS resolution is plenty.
    this.sceneTarget.setSize(Math.ceil(width), Math.ceil(height));
    this.layout();
  }

  /** Pointer in CSS px from the canvas's top left, or null when it is away. */
  setPointer(point: { x: number; y: number } | null) {
    const { height, dpr } = this.size;
    this.pointer.setPointer(point && { x: point.x * dpr, y: (height - point.y) * dpr });
  }

  render(scene: Scene, camera: Camera, dt: number) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneTarget);
    r.render(scene, camera);

    this.pointer.update(r, dt);
    const s = this.settings;
    const [current, previous] = [this.cells[1], this.cells[0]];
    const cu = this.cellMaterial.uniforms;
    cu.uDisp.value = this.pointer.texture;
    cu.uPrev.value = previous.texture;
    cu.uGain.value = s.gain;
    cu.uTrail.value = s.trail;
    cu.uBlend.value = s.smoothMs > 0 ? 1 - Math.exp((-dt * 1000) / s.smoothMs) : 1;
    cu.uHold.value = s.hold;
    r.setRenderTarget(current);
    this.cellQuad.render(r);
    this.cells = [current, previous];

    r.setRenderTarget(null);
    this.postMaterial.uniforms.uCells.value = current.texture;
    this.postMaterial.uniforms.uFade.value = s.fade;
    this.postMaterial.uniforms.uHaze.value = s.haze;
    this.postQuad.render(r);
  }

  dispose() {
    this.sceneTarget.dispose();
    this.cells.forEach((t) => t.dispose());
    this.pointer.dispose();
    this.cellMaterial.dispose();
    this.postMaterial.dispose();
    this.cellQuad.dispose();
    this.postQuad.dispose();
    this.atlas?.dispose();
  }

  /*
    Cells are whole device pixels so atlas texels map one to one. The grid
    covers the drawing buffer from the bottom left; the last row and column
    may be cut off at the edges.
  */
  private layout() {
    const { width, height, dpr } = this.size;
    const s = this.settings;
    const cellW = Math.max(1, Math.round(s.cellWidth * dpr));
    const cellH = Math.max(1, Math.round(s.cellHeight * dpr));
    const bufW = Math.round(width * dpr);
    const bufH = Math.round(height * dpr);
    const cols = Math.ceil(bufW / cellW);
    const rows = Math.ceil(bufH / cellH);

    this.cells.forEach((t) => t.setSize(cols, rows));
    this.pointer.resize(cols, rows, cellW, cellH, dpr);

    const glyphs = glyphList(s.charset);
    this.atlas?.dispose();
    this.atlas = bakeAtlas(glyphs, cellW, cellH, this.options.fontFamily);

    const cu = this.cellMaterial.uniforms;
    cu.uGrid.value = [cols, rows];
    cu.uCellPx.value = [cellW, cellH];
    cu.uView.value = [bufW, bufH];
    cu.uGlyphs.value = glyphs.length;

    const pu = this.postMaterial.uniforms;
    pu.uAtlas.value = this.atlas;
    pu.uGrid.value = [cols, rows];
    pu.uCellPx.value = [cellW, cellH];
    pu.uGlyphs.value = glyphs.length;
  }
}
