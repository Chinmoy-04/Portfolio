# Portfolio build plan

Owner: Chinmoy Jyoti Bora
Status: plan only. Nothing is built yet.
Written: 17 Nov 2026

---

## 1. Goal

A personal portfolio that does two jobs at once:

1. **Showpiece.** A long, scroll-driven hero where particles go from chaos to order, printed in cursor-reactive ASCII. The idea it carries: *finding structure in messy data*, which is what the projects do.
2. **Recruiter tool.** A clear project list that is one click from the first frame, and a plain `/work` page that can be linked from a CV.

Audience: recruiters and engineers hiring for Werkstudent and internship roles in ML, data engineering and AI software in Germany.

Success means:
- A recruiter reaches the project list in one click and under two seconds, on any device.
- The page still works with WebGL off, JavaScript slow, or reduced motion on.
- Adding a project later is one entry in one file.

---

## 2. Decisions already made

| Area | Decision |
|---|---|
| Direction | "Signal from noise": dark, particles resolving from chaos to order, printed in cursor-reactive ASCII |
| Hero chapters | One per project, all seven, driven by the project data file |
| Chapter text | Project name, one line, link to that project's row |
| Project order | SubspaceAD, ShopCrew, PaintOps, RAG Eval Engine, Air Gesture Controller, LightRAG Local, German Air |
| Project rows | Expand in place: write-up, metrics, stack, repo and demo links |
| Recruiter path | Pinned "View projects" button, plus a plain `/work` page |
| Sections | Hero, Projects, About, Stack, Contact |
| Colour | Off-white glyphs on near-black, one accent |
| Typography | Heavy grotesque headline, monospace labels |
| Opening | Three switchable variants: loading counter (default, locked 20 Nov 2026 at the Phase 6 checkpoint), particles form the name, name over noise |
| Mobile | Lighter version: fewer particles, no cursor effects; still frame under reduced motion |
| Personal | Open-to-work line, CV download, photo (tried in ASCII first) |
| Contact | Email, LinkedIn, GitHub links. No form |
| Extras | Custom cursor, chapter progress rail, sound (on by default since 20 Nov 2026; starts on the first click, tap or key press), cookie-free analytics |
| Language | English only |
| Hosting | Next.js on Vercel, Vercel subdomain for now, domain kept configurable |

### Choices made in this plan (say if you disagree)

- **Accent colour: amber, `#FFB020`. Locked at the Phase 0 checkpoint.** It reads as an inspection or warning light, which suits anomaly detection and industrial vision, and it is rare among developer portfolios (most use green or blue).
- **Fonts: Archivo (variable, used at heavy weight and wide width) for headlines, JetBrains Mono for labels and metadata.** Both are open-licence and load through `next/font` with no layout shift.
- **Plain three.js, not React Three Fiber.** Earlier I mentioned React Three Fiber. The hero is one custom multi-pass render pipeline, and a React scene graph adds overhead without helping. The hero lives in one client component that owns a plain three.js renderer.
- **Sound is synthesised in the browser** (Web Audio), so there are no audio files to license or load.

---

## 3. What the reference sites taught us

Read directly from each site's shipped source or public repository.

| Element | Source | How it works | Licence | How we use it |
|---|---|---|---|---|
| 3D object printed as text | bierman.io | Stock three.js `AsciiEffect` renders a GLB into real DOM text. Charset `.:-+*=%@#&`, inverted, resolution about 0.18, lowered on large screens. Mouse rotates the model; slow auto-rotation when idle. Plain scroll percentage per section, no scroll library. | Site code is the author's | Technique reference only. Too slow for thousands of moving particles. Its charset is a good starting ramp. |
| Crisp ASCII on the GPU | Codrops "shape-aware ASCII renderer" (`edoardolunardi/ascii-logo`) | Three passes: render scene to a target; one fragment per 6x10 px cell picks a glyph by matching a six-point shape sample against 95 glyphs; a post pass stamps the glyph from an atlas. Cost scales with cell count, not pixels. | MIT | Base of our ASCII pass. |
| Cursor spring-back and trail | `Agn0st/reactive-ascii-playground` | Fixed grid; each cell samples a shifted spot in the source. Defaults: radius 80 px, strength 0.7, recovery 2000 ms, memory 1200 ms, cap 24 px. | MIT | Reimplemented as a displacement step inside our cell pass, starting from these defaults. |
| Quiet field behind content | `asciify-engine` (npm) | `background(element, { preset, clear })` draws on the GPU behind an element and keeps a chosen node clear. Pauses off screen, respects reduced motion. | MIT | Used directly as a dependency behind the project list. |
| Project rows | jessemartinezdesign.com | Numbered rows with year, role and technologies as a spec sheet. | Layout pattern | Pattern for our rows. |
| Sticky identity column | brittanychiang.com | Name, role and section nav fixed on the left; content scrolls on the right. | Layout pattern | Pattern for the Projects, About and Stack area on desktop. |

Not captured:
- **Particle chaos-to-order morphing.** The "Entropy" reference is an archive card with no live code. Our morphing is original work (section 7).
- **Chapter transitions.** The sections below the hero on bierman.io and joegarnerdesign.com did not render in my browser, so the chapter choreography is our own design.

MIT code we adapt keeps its licence notice in a `THIRD_PARTY_NOTICES.md` file.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript, static generation | Matches your existing Vercel demos; pages are static so they load fast |
| Styling | Tailwind CSS with design tokens as CSS variables | One source of truth for colour, type and spacing |
| 3D | three.js, custom shaders (GLSL) | Full control of the multi-pass ASCII pipeline |
| Scroll | Lenis for smooth scrolling, GSAP ScrollTrigger for pinning and scrubbed timelines | Standard, well-supported pairing |
| Project-section field | `asciify-engine` | Does exactly the "clear around content" background |
| Fonts | Archivo, JetBrains Mono via `next/font` | Self-hosted, no layout shift |
| Analytics | `@vercel/analytics` | Cookie-free, no consent banner needed |
| Tooling | ESLint, Prettier, Playwright for smoke tests | Catches regressions in the recruiter path |

Versions are pinned at install time in Phase 0 to the latest stable releases, and recorded in `package.json`.

---

## 5. Site structure

### Routes

| Route | Purpose |
|---|---|
| `/` | Full experience: hero chapters, then Projects, About, Stack, Contact |
| `/work` | Plain page: name, one-line role, the same project list, contact links. No WebGL. Print-friendly. This is the CV link. |

Query parameters and anchors on `/`:
- `?intro=counter | name | none` picks the opening variant.
- `#projects`, `#about`, `#stack`, `#contact` are section anchors.
- `#p-<slug>` opens and scrolls to a specific project row.

### Folder layout

```
D:\Portfolio
├─ PLAN.md
├─ docs/
│  └─ projects-draft.md          draft copy for the seven projects
├─ public/
│  ├─ cv.pdf                     supplied by you
│  ├─ portrait.jpg               supplied by you
│  └─ emblems/                   SVG or GLB source for each emblem
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              fonts, metadata, analytics
│  │  ├─ page.tsx                home
│  │  └─ work/page.tsx           plain project page
│  ├─ content/
│  │  ├─ projects.ts             THE project data file
│  │  ├─ profile.ts              name, role, links, about text, stack
│  │  └─ site.config.ts          intro variant, accent, feature switches
│  ├─ components/
│  │  ├─ hero/                   HeroCanvas, ChapterOverlay, ProgressRail, intros
│  │  ├─ projects/               ProjectList, ProjectRow
│  │  ├─ sections/               About, Stack, Contact
│  │  └─ ui/                     PinnedNav, Cursor, SoundToggle
│  ├─ engine/                    framework-free three.js code
│  │  ├─ particles/              emblem sampling, morph shader
│  │  ├─ ascii/                  glyph atlas, cell pass, post pass
│  │  ├─ pointer/                displacement field
│  │  └─ quality.ts              device tiers and fallbacks
│  └─ styles/tokens.css
└─ tests/                        Playwright smoke tests
```

The `engine/` folder has no React in it, so it can be tested and tuned on its own.

---

## 6. The project data file

Everything about a project lives in one typed entry in `src/content/projects.ts`. The hero, the project list, `/work`, and the progress rail all read from it.

```ts
export type Project = {
  slug: string;              // used in URLs and anchors
  name: string;
  oneLine: string;           // shown in the hero chapter and the collapsed row
  year: number;
  domain: 'agents' | 'vision' | 'rag' | 'data';
  role: string;              // e.g. "Solo build", "Hackathon team"
  summary: string;           // 2 to 4 sentences, shown when the row expands
  highlights: string[];      // 2 to 4 bullets: what was hard, what it does
  metrics?: { label: string; value: string }[];   // real numbers only
  stack: string[];
  links: { repo?: string; demo?: string; paper?: string };
  hero?: {                   // omit to keep a project out of the hero
    emblem:
      | { kind: 'svg'; src: string; depth?: number }
      | { kind: 'glb'; src: string }
      | { kind: 'generator'; id: string }
      | { kind: 'text' };    // falls back to the project name set in type
    accentRegion?: string;   // which part of the emblem glows in the accent colour
  };
};
```

### Adding a project later

1. Add one entry to the `projects` array. Its position in the array is its position on the site.
2. To give it a hero chapter, add a `hero` block. With `{ kind: 'text' }` it needs no artwork: the particles form the project's name.
3. For a custom emblem, drop an SVG into `public/emblems/` and point `src` at it.

Nothing else changes. Chapter count, scroll length, the progress rail and `/work` all derive from the array.

### The seven emblems

| # | Project | Particles resolve into | Accent region | Source |
|---|---|---|---|---|
| 1 | SubspaceAD | An industrial part (a hex nut or bottle outline) | One patch glowing as the detected anomaly | SVG |
| 2 | ShopCrew | A small agent graph of five linked nodes | One node pulsing, waiting for approval | generator |
| 3 | PaintOps | A spray gun and its spray (chosen 18 Nov 2026; the car side view is kept as an option) | A blemish in the spray | SVG |
| 4 | RAG Eval Engine | Document pages under a radar chart of five Ragas metrics (18 Nov 2026; the gauge is kept as an option) | The score polygon | generator |
| 5 | Air Gesture Controller | An open palm inside a YOLO detection box (18 Nov 2026; the 21-keypoint skeleton is kept as an option) | The fingertips | SVG |
| 6 | LightRAG Local | A knowledge graph of about thirty nodes with edges | The central hub node | generator |
| 7 | German Air | Germany as a hex-binned map (18 Nov 2026; the plain outline is kept as an option) | A few hex clusters flagged | SVG |

The accent region in each emblem is the "signal" inside the noise, which ties all seven to the theme.

---

## 7. Hero engine

### 7.1 Particles

- **Counts by device tier:** about 40,000 on desktop, 12,000 on mid-range, 6,000 on phones. Chosen at start by `quality.ts` and lowered automatically if the frame rate drops.
- **Emblem targets:** at load, each emblem is sampled into a point cloud with the same number of points, stored as rows of one floating-point texture. SVGs are sampled along their fills and outlines with a little depth added; generators return points directly; text is rasterised and sampled.
- **Chaos state:** positions from a curl-noise flow field, so the noise looks alive, not like random static.
- **Morph:** the vertex shader blends each particle between chaos and its emblem target using the chapter's progress, with a per-particle delay so the shape assembles in a wave, not all at once.
- **Accent particles:** points in the emblem's accent region carry a flag and are tinted amber after the ASCII pass.

Everything runs on the GPU. The CPU only supplies one number per frame: scroll progress.

### 7.2 ASCII pass

Three passes per frame, following the Codrops method:

1. **Scene pass.** Particles drawn to an offscreen target.
2. **Cell pass.** One fragment per character cell (start at 7x12 CSS px). It reads the scene, applies the pointer displacement (7.3), and picks a glyph.
3. **Post pass.** Stamps each glyph from a pre-baked atlas in off-white, or amber for accent cells.

Glyph selection is built in two steps so we always have a working version:
- **Step A:** luminance ramp using `.:-+*=%@#&`.
- **Step B, if the frame budget allows:** shape-aware matching against the printable set, for crisp emblem edges.

The headline, chapter text and buttons are plain HTML layered over the canvas. They are never rendered into the ASCII.

### 7.3 Pointer response

A small displacement texture stores, per cell, how far the image is pulled. The pointer adds a pull within a radius; the pull decays back on a spring. Starting values come from reactive-ascii: radius 80 px, strength 0.7, recovery 2000 ms, cap 24 px. A sparse glyph trail fades behind the cursor. Disabled on touch devices.

### 7.4 Scroll choreography

- The canvas is pinned for the whole hero. Total hero height is about `100vh` for the opening plus `100vh` per chapter, so about `800vh` for seven projects.
- Each chapter has four beats, mapped to its scroll range:

| Beat | Range | What happens |
|---|---|---|
| Gather | 0 to 35% | Particles stream from chaos into the emblem; chapter text fades in |
| Hold | 35 to 70% | Emblem complete, slowly rotating; accent region glows; text fully readable |
| Release | 70 to 90% | Emblem loosens; text fades out |
| Drift | 90 to 100% | Back to chaos, camera shifts slightly for the next chapter |

- Odd and even chapters place the emblem on alternate sides with the text opposite, so the scroll has rhythm.
- After the last chapter the field thins out and hands over to the quiet `asciify-engine` field behind the project list.
- **Progress rail:** a thin vertical rail with one tick per chapter, the active one in amber. Clicking a tick scrolls to that chapter. Built as a real navigation list for keyboard users.
- **Pinned nav:** name on the left; "View projects" and "CV" on the right, always visible. "View projects" scrolls straight to `#projects`, skipping the hero.

### 7.5 The three openings

Switched by `site.config.ts` and overridable with `?intro=`.

| Variant | What you see | Time before usable |
|---|---|---|
| `counter` | A large 0 to 100 counter in heavy type while emblems are sampled, then the field fades up behind your name | About 1.5 to 2.5 s, capped at 3 s |
| `name` | Particles assemble into "Chinmoy Jyoti Bora", hold, then scatter as scrolling starts | About 2 s, skippable by scrolling |
| `none` | Name and role in HTML over the chaos field, immediately | 0 s |

In all three the pinned "View projects" button is clickable from the first painted frame. The counter tracks real loading work, and never runs longer than its cap.

### 7.6 Sound

- On by default (changed 20 Nov 2026), starting on the visitor's first click, tap or key press, since browsers block audio before one. A small toggle sits in the pinned nav; turning it off is remembered.
- Synthesised: a soft filtered-noise bed that narrows in pitch as particles gather, and a short tone when an emblem locks.
- Never plays under reduced motion unless the visitor turns it on.

---

## 8. The other sections

### Projects (`#projects`)

- **Desktop:** sticky left column with name, role, open-to-work line, section nav and links; project rows on the right.
- **Row, collapsed:** number, name, one line, domain tag, year, stack as monospace chips, and small repo and demo links.
- **Row, expanded:** summary, highlights, metrics as monospace readouts, full stack, and buttons for repo, live demo and paper.
- Rows are real buttons with `aria-expanded`. One row open at a time by default. `#p-<slug>` opens a row directly, which is where hero chapter links point.
- Background: `asciify-engine` field at low opacity, cleared behind the text column, pointer response off.

### About (`#about`)

Short paragraph, the photo, the open-to-work line, location, and one line of education (dual-degree M.Sc. in AI and Data Science, TH Deggendorf and University of South Bohemia). The photo is tried as an ASCII render first; if it does not read well it becomes a normal duotone photo.

### Stack (`#stack`)

Four groups as monospace lists: ML and vision; LLM, RAG and agents; frontend and data; hardware. Text only, no logo wall.

### Contact (`#contact`)

Large email link, LinkedIn, GitHub, CV download. The footer repeats them.

### `/work`

The same `ProjectList` component with all rows expanded by default, no canvas, no smooth-scroll library. Has a print stylesheet so it saves cleanly as a PDF.

---

## 9. Fallbacks, accessibility, performance

| Situation | Behaviour |
|---|---|
| WebGL unavailable or context lost | Static pre-rendered ASCII poster behind the headline, then straight to the project list; the hero chapters are left out (20 Nov 2026) |
| `prefers-reduced-motion` | Still frame per chapter, no morphing, no smooth scroll, no cursor effects |
| Phone or low-power device | Low particle tier, larger cells, no pointer displacement, no custom cursor |
| Tab hidden or hero off screen | Render loop paused |
| JavaScript slow to load | Headline, nav and the full project list are server-rendered HTML and usable immediately |

Accessibility:
- All text is real HTML with sufficient contrast (off-white on near-black; amber checked for body-size use).
- Full keyboard path: skip link, pinned nav, progress rail, project rows.
- The canvas is `aria-hidden`; chapter text is in the document in reading order.
- The custom cursor never replaces the system cursor for keyboard or touch users.

Performance budgets:
- Largest Contentful Paint under 2.0 s on a mid-range laptop; the headline is the LCP element, not the canvas.
- The three.js bundle and shaders load after first paint, in their own chunk.
- 60 fps target on desktop, 30 fps floor on phones; device pixel ratio capped at 2 (1.5 on phones).
- No layout shift from fonts or the canvas.

SEO and sharing: page titles and descriptions, Open Graph image (a still of the hero), `sitemap.xml`, and JSON-LD `Person` data.

---

## 10. Build phases

Each phase ends at a checkpoint where you review a running preview before the next phase starts. Phases 0 to 2 produce a complete, shippable site without any WebGL; the showpiece is layered on top from Phase 3.

### Phase 0. Foundations
- Create the Next.js project in `D:\Portfolio`, initialise git, set up linting and formatting.
- Add design tokens (colour, type scale, spacing), load both fonts.
- Create `projects.ts`, `profile.ts`, `site.config.ts` with the seven projects from `docs/projects-draft.md`.
- First deploy to a Vercel preview URL.
- **Skills:** `ui-ux-pro-max` (confirm the font pairing and palette), `design-taste-frontend` (token system).
- **Checkpoint:** a styled type and colour specimen page is live on a preview URL; you approve fonts and the accent from a side-by-side mock of amber, green and blue.

### Phase 1. The recruiter site, static
- Pinned nav, Projects (rows with expand in place), About, Stack, Contact, footer.
- `/work` page and print stylesheet.
- Responsive from 360 px to wide desktop.
- Photo tried in ASCII and as a duotone, side by side.
- Playwright smoke test: load, click "View projects", expand a row, follow a link.
- **Skills:** `design-taste-frontend`, `high-end-visual-design`, then `impeccable` for a critique and polish pass.
- **Checkpoint:** the site is fully usable and could go live as it is. You review copy, layout and row content.

### Phase 2. Scroll feel and the quiet field
- Lenis smooth scrolling, wired to GSAP ScrollTrigger.
- `asciify-engine` field behind the project section, cleared behind text.
- Custom cursor with link and field states.
- Reduced-motion handling for all three.
- **Skills:** `lenis`.
- **Checkpoint:** scrolling and the project section feel right; nothing fights the text.

### Phase 3. Particle engine
- `engine/particles`: emblem sampling (SVG, generator, text), position texture, morph shader, curl-noise chaos.
- A debug page with a slider that scrubs chaos to order for one emblem (SubspaceAD), no ASCII yet.
- Device tiers and automatic quality drop.
- **Checkpoint:** you scrub one emblem forming and dissolving at 60 fps and judge the motion.

### Phase 4. ASCII pass and pointer response
- Glyph atlas, cell pass, post pass (luminance ramp first).
- Accent tinting for flagged particles.
- Pointer displacement field and glyph trail.
- Shape-aware glyph matching if the frame budget allows; otherwise it is recorded as a later upgrade.
- Debug controls for cell size, charset, displacement radius and strength.
- **Checkpoint:** the single emblem now prints in ASCII and reacts to the cursor. You tune the look with the debug controls and we lock the values.

### Phase 5. Seven chapters
- Remaining six emblems (two more SVG, four generators).
- Pinned hero with the four-beat timeline per chapter, alternating layout, chapter overlay text and links.
- Progress rail.
- Hand-off from the hero field to the project-section field.
- **Skills:** `gpt-taste` (ScrollTrigger pinning and scrubbing discipline).
- **Checkpoint:** the full hero scrolls end to end. You judge length and pacing; chapter height is one number to change.

### Phase 6. Openings and sound
- The three opening variants behind `site.config.ts` and `?intro=`.
- Sound engine and toggle.
- **Checkpoint:** you compare `?intro=counter`, `?intro=name` and `?intro=none` on the preview URL and pick the default.

### Phase 7. Fallbacks, mobile and quality
- WebGL-off poster and stacked-list fallback, reduced-motion still frames, phone tier tuning.
- Accessibility pass (keyboard, screen reader, contrast).
- Performance pass against the budgets in section 9, on a real phone and a mid-range laptop.
- **Skills:** `impeccable` (audit and harden), `code-review`.
- **Checkpoint:** you test on your own phone; all budgets met or exceptions listed.

### Phase 8. Content and launch
- Final copy, real metrics, CV and photo in place.
- Metadata, Open Graph image, sitemap, analytics.
- Production deploy; GitHub profile README and LinkedIn updated to point at the site (your action).
- **Checkpoint:** live.

### Where the effort sits

Phases 0 to 2 are small. Phases 3 to 5 are the bulk of the work and carry the technical risk. If time gets short, the site can launch after Phase 2 and the hero can follow.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Seven chapters feel too long | Chapter height is a single setting; the pinned button always skips; the Phase 5 checkpoint is specifically about pacing |
| Shape-aware ASCII is too heavy with moving particles | Luminance ramp ships first and already looks right; shape-aware is an upgrade, not a dependency |
| Emblems do not read clearly as particles in ASCII | Phases 3 and 4 prove one emblem before the other six are made; simple, high-contrast silhouettes only |
| Phones overheat or stutter | Low tier, capped pixel ratio, automatic quality drop, paused when off screen |
| The showpiece hurts first-load speed | Headline and project list are static HTML; WebGL loads after first paint in its own chunk |
| `asciify-engine` changes or breaks | Version pinned; it is isolated in one component and can be replaced by a simple shader field |

---

## 12. What I need from you

Needed by Phase 1:
- Confirmation or edits for the project copy in `docs/projects-draft.md`.
- Your role line for the headline (draft: "AI agents, on-device vision, and RAG you can evaluate").

Needed by Phase 8:
- CV as a PDF.
- A portrait photo, ideally with a plain background and good contrast.
- One or two real numbers per project where you have them (accuracy, AUROC, latency, frames per second, dataset size).
- A Vercel account connected to the repository.

---

## 13. Still open

- Whether the photo works in ASCII (decided in Phase 1 by trying it).
- ~~The default opening~~: decided 20 Nov 2026, the loading counter. At 100 its digits dissolve into particles and the name fades in out of the background; the other two stay available through `?intro=`.
- Enter button for the counter opening (added 20 Nov 2026): browsers only play sound after a click, so the button is that click, and the opening has its own sound (a riser under the count, a shimmer under the dissolve). Picked 20 Nov 2026: after the counter (it waits at 100). `?enter=before` (waits at 0) and `?enter=none` stay available.
- Custom domain (later; no code change needed).
- Shape-aware glyph matching (7.2, Step B). Phase 4 ships the luminance ramp only; the frame budget is judged at the Phase 4 checkpoint before taking this on.
