/*
  Morph shader (PLAN.md, section 7.1). Everything moves on the GPU; the CPU
  supplies progress and time each frame.

  Each particle has a chaos position (a fixed seed pushed around by a curl
  noise flow field) and an emblem target read from the target atlas. Progress
  blends between them with a per-particle delay, so the shape assembles in a
  wave from left to right with some scatter, not all at once.
*/

/*
  3D simplex noise by Ian McEwan and Stefan Gustavson (Ashima Arts),
  github.com/ashima/webgl-noise.

  Copyright (C) 2011 Ashima Arts. Copyright (C) 2011-2016 Stefan Gustavson.
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to
  deal in the Software without restriction, including without limitation the
  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
  sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions: The above
  copyright notice and this permission notice shall be included in all copies
  or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
  WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
*/
const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 snoise3(vec3 x) {
  return vec3(
    snoise(x),
    snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)),
    snoise(vec3(x.z + 74.2, x.x - 124.4, x.y + 99.4))
  );
}

// Curl of a noise potential: divergence-free, so the flow swirls instead of
// clumping or thinning out.
vec3 curl(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 x0 = snoise3(p - dx), x1 = snoise3(p + dx);
  vec3 y0 = snoise3(p - dy), y1 = snoise3(p + dy);
  vec3 z0 = snoise3(p - dz), z1 = snoise3(p + dz);
  return vec3(
    (y1.z - y0.z) - (z1.y - z0.y),
    (z1.x - z0.x) - (x1.z - x0.z),
    (x1.y - x0.y) - (y1.x - y0.x)
  ) / (2.0 * e);
}
`;

export const vertexShader = /* glsl */ `
uniform sampler2D uTargets;
uniform int uWidth;
uniform int uRowOffset;
uniform float uProgress;
uniform float uTime;
uniform float uSpread;
uniform float uEmblemScale;
uniform float uFlow;
uniform float uPointSize;

attribute float aRand;

varying float vAccent;
varying float vAlpha;

${noise}

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  int i = gl_VertexID;
  vec4 target = texelFetch(uTargets, ivec2(i % uWidth, i / uWidth + uRowOffset), 0);
  vec3 home = target.xyz * uEmblemScale;

  // Chaos: the seed position carried along a slowly evolving flow field.
  vec3 seed = position;
  vec3 chaos = seed + curl(seed * 0.35 + vec3(0.0, 0.0, uTime * 0.035)) * uFlow;

  // Schedule: left-to-right wave mixed with per-particle scatter.
  float wave = target.x * 0.5 + 0.5;
  float delay = mix(aRand, wave, 0.55);
  float t = clamp((uProgress - delay * uSpread) / (1.0 - uSpread), 0.0, 1.0);
  float e = easeInOutCubic(t);

  // Particles arc in rather than travel in straight lines.
  vec3 swirl = snoise3(home * 0.9 + aRand * 13.0 + uTime * 0.05);
  vec3 p = mix(chaos, home, e) + swirl * 0.45 * sin(3.14159265 * e);

  vAccent = target.w * smoothstep(0.6, 1.0, e);
  // The anomaly is the signal: its particles grow and brighten as it locks in.
  vAlpha = mix(0.45, 1.0, e) * (1.0 + 1.2 * vAccent);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize / -mv.z * (1.0 + 0.6 * vAccent);
}
`;

export const fragmentShader = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
// 1 when feeding the ASCII pass: R carries brightness, G accent brightness.
uniform float uDataMode;

varying float vAccent;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
  vec3 colour = uDataMode > 0.5 ? vec3(1.0, vAccent, 0.0) : mix(uInk, uAccent, vAccent);
  gl_FragColor = vec4(colour, a);
}
`;
