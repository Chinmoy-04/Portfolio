/*
  ASCII pass shaders (PLAN.md, section 7.2). All coordinates are device px
  from the bottom left of the drawing buffer, matching gl_FragCoord.
*/

export const quadVertex = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/*
  Cell pass: one fragment per character cell, ping-ponged with the previous
  frame's cells. Reads the pointer offset for the cell, averages the scene
  over the whole cell (a 4x4 grid of filtered taps), and outputs
    R  brightness after tone mapping and smoothing over time, 0 to 1
    G  share of that brightness from accent particles, smoothed the same way
    B  glyph index / glyph count, the glyph actually shown
    A  brightness shown, including the pointer trail
  The glyph only changes when brightness leaves the current glyph's band by
  more than uHold, so cells near a band edge do not flicker between glyphs.
  Any cell with a trace of light prints at least the faintest glyph; the post
  pass fades it by brightness, so lone particles drift across the grid as
  dim dots instead of vanishing.
*/
export const cellFragment = /* glsl */ `
uniform sampler2D uScene;
uniform sampler2D uDisp;
uniform sampler2D uPrev;
uniform vec2 uGrid;
uniform vec2 uCellPx;
uniform vec2 uView;
uniform float uGain;
uniform float uTrail;
uniform float uBlend;
uniform float uHold;
uniform float uGlyphs;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 uv = (cell + 0.5) / uGrid;
  vec4 disp = texture2D(uDisp, uv);
  vec4 prev = texture2D(uPrev, uv);
  vec2 centre = (cell + 0.5) * uCellPx + disp.xy;

  vec4 s = vec4(0.0);
  for (int j = 0; j < 4; j++) {
    for (int i = 0; i < 4; i++) {
      vec2 o = (vec2(float(i), float(j)) + 0.5) / 4.0 - 0.5;
      s += texture2D(uScene, (centre + o * uCellPx) / uView);
    }
  }
  s /= 16.0;

  float lum = mix(prev.r, 1.0 - exp(-s.r * uGain), uBlend);
  float accent = mix(prev.g, s.g / max(s.r, 1e-4), uBlend);

  float shown = lum;
  float h = hash(cell);
  if (h < disp.z * uTrail) {
    shown = max(shown, 0.2 + 0.6 * fract(h * 61.0));
  }

  float x = shown * uGlyphs;
  float index = min(floor(x), uGlyphs - 1.0);
  if (shown > 0.004) index = max(index, 1.0);
  float held = min(floor(prev.b * uGlyphs + 0.5), uGlyphs - 1.0);
  if (x > held - uHold && x < held + 1.0 + uHold) index = held;

  gl_FragColor = vec4(lum, accent, index / uGlyphs, shown);
}
`;

/*
  Post pass: stamps each cell's glyph from the atlas. Glyph 0 is a space.
  Faint cells print dimmer (uFade): opacity follows the square root of
  brightness, scaled by uHaze, so it rises and falls smoothly as particles
  cross cells, and lone particles read as light grey.
  Cells mostly lit by accent particles print in the accent colour. Output is
  premultiplied, so the canvas stays transparent between glyphs.
*/
export const postFragment = /* glsl */ `
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform vec2 uCellPx;
uniform float uGlyphs;
uniform float uFade;
uniform float uHaze;
uniform vec3 uInk;
uniform vec3 uAccent;

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uCellPx);
  vec4 c = texture2D(uCells, (cell + 0.5) / uGrid);
  float index = floor(c.b * uGlyphs + 0.5);
  if (index < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 local = (gl_FragCoord.xy - cell * uCellPx) / uCellPx;
  float a = texture2D(uAtlas, vec2((index + local.x) / uGlyphs, local.y)).a;
  a *= mix(1.0, clamp(sqrt(c.a) * uHaze, 0.0, 1.0), uFade);
  vec3 colour = mix(uInk, uAccent, step(0.4, c.g));
  gl_FragColor = vec4(colour * a, a);
}
`;
