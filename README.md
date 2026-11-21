# Chinmoy Jyoti Bora: portfolio

**Live: [chinmoybora.vercel.app](https://chinmoybora.vercel.app)** · Plain project page for CVs: [/work](https://chinmoybora.vercel.app/work)

A personal portfolio built around one idea: **finding structure in messy data**. The hero is a long scroll in which tens of thousands of particles drift as noise, then gather into an emblem for each project, all printed live as ASCII text that reacts to the cursor. One part of each emblem lights up in amber: the signal inside the noise.

The site is also a plain recruiter tool. The project list is server-rendered HTML, one click from the first frame, and everything still works with WebGL off, JavaScript slow, or reduced motion on.

---

## How it is built

### The hero: particles printed as ASCII

Everything that moves runs on the GPU. Each frame the CPU hands the shaders a single number, scroll progress, plus the time.

1. **Particles.** Each project's emblem (an SVG, a procedural generator, or plain text) is sampled once into a point cloud and stored as rows of a floating-point texture. In the chaos state, particles ride a curl-noise flow field, so the noise looks alive rather than static. A vertex shader blends every particle between chaos and its emblem position, with a per-particle delay so the shape assembles in a wave.
2. **ASCII pass.** The particles render to an offscreen target. A second pass runs one fragment per character cell, reads the brightness under it and picks a glyph from a luminance ramp. A third pass stamps glyphs from a pre-baked atlas in off-white, or amber for flagged particles. Cost scales with the number of cells, not with pixels or particles.
3. **Pointer response.** A small displacement texture stores how far each cell's image is pulled toward the cursor. The pull springs back over time and leaves a sparse glyph trail. Touch devices skip it.

### Scroll choreography

The canvas is pinned for the whole hero: an opening, then one chapter per project, each 200 viewport heights tall. Each chapter has four beats: gather, hold, release, drift. Odd and even chapters alternate sides, and a progress rail with one tick per chapter doubles as keyboard navigation. Lenis smooths the scroll and GSAP ScrollTrigger maps it onto the timeline. After the last chapter, the field hands over to a quiet ASCII background behind the project list, which stays clear behind every block of text.

### Openings and sound

There are three openings, picked in `site.config.ts` or with `?intro=`. The default is a 0 to 100 loading counter that tracks real work (sampling the emblems) and is capped at 3 seconds. At 100 its digits dissolve into particles. The other two: particles that form the name, or the name shown straight away.

Sound is synthesised in the browser with Web Audio, so there are no audio files. A filtered-noise bed narrows as particles gather, and a short tone plays when an emblem locks. Browsers block audio until the first interaction, so the counter ends on an Enter button that doubles as that click.

### Fallbacks, accessibility and performance

| Situation                          | Behaviour                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| No WebGL 2, or the context is lost | A static ASCII poster behind the headline, then straight to the project list                                                 |
| `prefers-reduced-motion`           | A still frame per chapter, no smooth scroll, no cursor effects                                                               |
| Phone or low-power device          | Fewer particles (40k / 12k / 6k by tier), larger cells, no pointer effects, and an automatic step down when frames stay slow |
| Tab hidden or hero off screen      | The render loop pauses                                                                                                       |

- All text is real HTML. The canvas is `aria-hidden`, and chapter text sits in the document in reading order.
- There is a full keyboard path: skip link, pinned nav, progress rail and project rows (real buttons with `aria-expanded`).
- three.js and the background field load after first paint, in their own chunks. Measured on a production build: LCP 0.6 s on desktop, layout shift 0.

---

## Tech stack

| Layer            | Choice                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org) (App Router, static generation), React 19, TypeScript                                                        |
| Styling          | [Tailwind CSS 4](https://tailwindcss.com), design tokens as CSS variables                                                                     |
| Graphics         | [three.js](https://threejs.org) with custom GLSL shaders, a multi-pass render pipeline, no React Three Fiber                                  |
| Scroll           | [Lenis](https://lenis.darkroom.engineering) smooth scrolling, [GSAP ScrollTrigger](https://gsap.com/scrolltrigger/) for pinning and scrubbing |
| Background field | [`asciify-engine`](https://www.npmjs.com/package/asciify-engine) behind the project list                                                      |
| Sound            | Web Audio API, synthesised at runtime                                                                                                         |
| Fonts            | Archivo (headlines) and JetBrains Mono (labels), self-hosted via `next/font`                                                                  |
| Analytics        | [Vercel Web Analytics](https://vercel.com/docs/analytics), cookie-free                                                                        |
| Testing          | [Playwright](https://playwright.dev) smoke tests on a desktop and a phone profile                                                             |
| Tooling          | ESLint, Prettier, Python (Pillow, NumPy, SciPy) for the image scripts                                                                         |
| Hosting          | Vercel, deployed on every push to `main`                                                                                                      |

---

## Project structure

```
src/
├─ app/                 routes: / (full site), /work (plain, printable), plus
│                       metadata, sitemap, robots, icons and the share image
├─ content/
│  ├─ projects.ts       THE project data file
│  ├─ profile.ts        name, links, about text, education, stack
│  └─ site.config.ts    opening, accent, chapter height, feature switches
├─ components/          hero, project list, sections, nav, cursor, sound toggle
└─ engine/              framework-free three.js code, no React
   ├─ particles/        emblem sampling, generators, morph shader
   ├─ ascii/            glyph atlas, cell and post passes
   ├─ pointer/          displacement field
   ├─ quality.ts        device tiers and automatic quality drop
   └─ sound.ts          Web Audio synthesis
scripts/
├─ portrait.py          cuts the portrait out of its background and tones it
└─ favicon.py           builds the dot-matrix icon in every size
tests/                  Playwright recruiter-path tests
```

### Adding a project

Everything about a project lives in one typed entry in `src/content/projects.ts`. The hero chapters, the project list, `/work` and the progress rail all read from it.

1. Add an entry to the `projects` array. Its position is its position on the site.
2. To give it a hero chapter, add a `hero` block. `{ kind: "text" }` needs no artwork: the particles form the project's name.
3. For a custom emblem, put an SVG in `public/emblems/` and point `src` at it.

Chapter count, scroll length and the rail all follow automatically.

---

## Running it locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint
npm test             # Playwright, uses the installed Microsoft Edge
```

Useful URL switches:

| Switch                           | Effect                                   |
| -------------------------------- | ---------------------------------------- |
| `?intro=counter \| name \| none` | Pick the opening                         |
| `?enter=before \| after \| none` | Where the counter's Enter button appears |
| `?webgl=0`                       | Force the no-WebGL fallback              |
| `?tier=high \| mid \| low`       | Force a device tier                      |

`/debug/particles` scrubs a single emblem from chaos to order with live controls, and `/specimen` shows the type and colour tokens. Neither is linked from the site, and both are excluded from search.

To regenerate images after changing the source photo or the icon design:

```bash
python scripts/portrait.py
python scripts/favicon.py
```

---

## Credits

- 3D simplex noise by Ian McEwan and Stefan Gustavson ([ashima/webgl-noise](https://github.com/ashima/webgl-noise)), MIT. The licence notice is kept in `src/engine/particles/shaders.ts`.
- [`asciify-engine`](https://www.npmjs.com/package/asciify-engine), MIT, used as a dependency for the background field.
- The cell-based ASCII pipeline follows the approach described in Codrops' shape-aware ASCII renderer article. The cursor spring-back starts from the defaults of [reactive-ascii-playground](https://github.com/Agn0st/reactive-ascii-playground). Both were reimplemented here.

Code © Chinmoy Jyoti Bora. Project write-ups, CV and portrait are personal and not licensed for reuse.
